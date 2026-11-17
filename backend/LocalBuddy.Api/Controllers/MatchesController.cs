using LocalBuddy.Api.Data;
using LocalBuddy.Api.Dtos;
using LocalBuddy.Api.Models;
using LocalBuddy.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.EntityFrameworkCore;

namespace LocalBuddy.Api.Controllers;

/// Routed under users because interest and pass are things you do to a person, not a
/// "matches" resource you create. Shares the prefix with UsersController; the templates
/// do not overlap.
[ApiController]
[Route("api/v1/users")]
[Authorize]
[Produces("application/json")]
public class MatchesController(LocalBuddyDbContext db, ConversationService conversations, PushNotifier push)
    : ControllerBase
{
    /// Free path to a conversation: both sides express interest (GUIDELINES §3).
    /// 201 with a Location when the interest was reciprocal and a chat opened, 200 otherwise.
    /// The body is optional: apps that predate the note (ADR-0015) send none at all.
    [HttpPost("{targetId:guid}/interest")]
    [RequiresVerifiedIdentity]
    [ProducesResponseType<InterestResult>(StatusCodes.Status200OK)]
    [ProducesResponseType<InterestResult>(StatusCodes.Status201Created)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Interest(
        Guid targetId, [FromBody(EmptyBodyBehavior = EmptyBodyBehavior.Allow)] InterestRequest? request = null)
    {
        // Measured after trimming, so padding neither counts against the limit nor gets stored.
        var note = request?.Note?.Trim();
        if (note?.Length > Limits.Note)
            return this.Invalid("invalid_request", $"A note can be at most {Limits.Note} characters.");
        if (note == "") note = null;

        var me = User.Id();
        if (me == targetId) return this.Invalid("self_target", "You cannot express interest in yourself.");
        // A banned account is gone as far as other members are concerned (ADR-0005).
        if (!await db.Users.AnyAsync(u => u.Id == targetId && u.BannedAt == null)) return NotFound();
        if (await db.IsBlockedBetweenAsync(me, targetId))
            return this.Invalid("blocked", "This member is not reachable.");

        // Both people tapping at the same moment would otherwise each miss the other's row and
        // leave two pending interests that never become a match. The lock makes the second one
        // find the first.
        await using var transaction = await conversations.BeginPairAsync(me, targetId);

        if (await db.Matches.AnyAsync(m => m.InitiatorId == me && m.TargetId == targetId))
            return this.Conflicted("already_responded", "You have already responded to this profile.");

        var theirs = await db.Matches.FirstOrDefaultAsync(m =>
            m.InitiatorId == targetId && m.TargetId == me && m.Status == MatchStatus.Pending);
        var matched = theirs is not null;

        db.Matches.Add(new Match
        {
            Id = Guid.CreateVersion7(),
            InitiatorId = me,
            TargetId = targetId,
            Status = matched ? MatchStatus.Matched : MatchStatus.Pending,
            MatchedAt = matched ? DateTime.UtcNow : null,
            // A yes to their request carries no note of mine: the chat opens with theirs.
            Note = matched ? null : note
        });

        if (!matched)
        {
            // Someone who already passed on me never sees this request, so they are not told about it.
            var passedOnMe = await db.Matches.AnyAsync(m => m.InitiatorId == targetId && m.TargetId == me);
            await db.SaveChangesAsync();
            await transaction.CommitAsync();
            if (!passedOnMe) await push.NotifyAsync(targetId, me, PushKind.Request, "/requests");
            return Ok(new InterestResult(false, null));
        }

        // Reciprocal — open the chat.
        theirs!.Status = MatchStatus.Matched;
        theirs.MatchedAt = DateTime.UtcNow;

        var (conversation, created) = await conversations.OpenAsync(me, targetId, unlockedByPayment: false);

        // Their note becomes the chat's first message, from them, so the reason they asked is still
        // there once the request is gone (ADR-0015). Unread for me, like any message from the other
        // side. A chat that already existed (a paid unlock) is left as it is.
        if (created && theirs.Note is not null)
            db.Messages.Add(new Message
            {
                Id = Guid.CreateVersion7(),
                ConversationId = conversation.Id,
                SenderId = targetId,
                Content = theirs.Note
            });

        await db.SaveChangesAsync();
        await transaction.CommitAsync();
        // They asked first; I just said yes.
        await push.NotifyAsync(targetId, me, PushKind.Match, $"/chat/{conversation.Id}");
        return Created($"/api/v1/conversations/{conversation.Id}/messages",
                       new InterestResult(true, conversation.Id));
    }

    /// The other half of the interest above: people who said they would like to meet me and
    /// have no answer from me yet. Accepting is an interest back, declining is a pass, and the
    /// requester is told about neither until there is a match. Same cards as the feed.
    [HttpGet("me/requests")]
    [ProducesResponseType<Page<ProfileCard>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<Page<ProfileCard>>> Requests(int page = 0, int pageSize = Page<ProfileCard>.DefaultSize)
    {
        (page, pageSize) = Page<ProfileCard>.Clamp(page, pageSize);
        var me = User.Id();

        var cards = await CardsAsync(
            from m in PendingRequestsTo(me)
            join u in db.Users on m.InitiatorId equals u.Id
            // Version 7 ids are time-ordered, so this is newest request first without a
            // timestamp column. The id is unique, so pages cannot overlap either.
            orderby m.Id descending
            select new Person { User = u, Note = m.Note },
            page, pageSize);

        // Why they are asking, even without a note (ADR-0015): each asker's earliest active trip to
        // where I live or to a city I am visiting too. One more query for the page, not one per card.
        var today = Trip.Today;
        var ids = cards.Items.Select(c => c.Id).ToList();
        var trips = (await db.Trips
                .Where(t => ids.Contains(t.UserId) && t.To >= today &&
                            (db.Users.Any(u => u.Id == me && u.City.ToLower() == t.City.ToLower()) ||
                             db.Trips.Any(o => o.UserId == me && o.To >= today && o.City.ToLower() == t.City.ToLower())))
                .ToListAsync())
            .GroupBy(t => t.UserId).ToDictionary(g => g.Key, g => g.MinBy(t => t.From)!);

        return cards with
        {
            Items = cards.Items
                .Select(c => trips.TryGetValue(c.Id, out var t) ? c with { Trip = new PublicTrip(t.City, t.From, t.To) } : c)
                .ToList()
        };
    }

    /// The same thing seen from the asker's side: people I asked to meet who have not said yes.
    /// Without it a request leaves and is never seen again, and nobody can tell whom they are
    /// still waiting for. Somebody who declined stays on the list on purpose: a decline is never
    /// told (see Interest), and a request that vanished would be telling. Hidden: anyone blocked
    /// in either direction, and banned accounts (ADR-0005).
    [HttpGet("me/requests/sent")]
    [ProducesResponseType<Page<ProfileCard>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<Page<ProfileCard>>> Sent(int page = 0, int pageSize = Page<ProfileCard>.DefaultSize)
    {
        (page, pageSize) = Page<ProfileCard>.Clamp(page, pageSize);
        var me = User.Id();
        var blocked = db.BlockedIdsFor(me);

        return await CardsAsync(
            from m in db.Matches
            where m.InitiatorId == me && m.Status == MatchStatus.Pending && !blocked.Contains(m.TargetId)
            join u in db.Users on m.TargetId equals u.Id
            where u.BannedAt == null
            orderby m.Id descending
            // My own note stays out: the list shows whom I asked, not what I wrote.
            select new Person { User = u },
            page, pageSize);
    }

    /// A member to show as a card, with the note they sent me when the list is my received requests.
    sealed class Person
    {
        public required User User { get; init; }
        public string? Note { get; init; }
    }

    /// One page of people as the cards the feed shows, in the order the query gives them.
    async Task<Page<ProfileCard>> CardsAsync(IQueryable<Person> people, int page, int pageSize)
    {
        var rows = await people
            .Skip(page * pageSize)
            .Take(pageSize + 1)
            .Select(x => new
            {
                x.User,
                x.Note,
                PhotoId = db.Photos.Where(p => p.UserId == x.User.Id && p.Type == PhotoType.Profile)
                                   .Select(p => (Guid?)p.Id).FirstOrDefault(),
                Rating = db.Reviews.Where(r => r.SubjectId == x.User.Id).Average(r => (double?)r.Rating),
                References = db.Reviews.Count(r => r.SubjectId == x.User.Id),
                AsHost = db.Reviews.Count(r => r.SubjectId == x.User.Id && r.Context == ReferenceContext.WasHosted),
                AsTraveller = db.Reviews.Count(r => r.SubjectId == x.User.Id && r.Context == ReferenceContext.Hosted)
            })
            .ToListAsync();

        var cards = rows.Select(r => new ProfileCard(
            PublicProfile.From(r.User),
            r.PhotoId is null ? null : PhotoDto.UrlFor(r.PhotoId.Value),
            r.Rating)
        {
            Note = r.Note, References = r.References, ReferencesAsHost = r.AsHost, ReferencesAsTraveller = r.AsTraveller
        }).ToList();

        return Page<ProfileCard>.From(cards, page, pageSize);
    }

    /// For the badge on the Chats tab, which should not have to load a page of cards to count.
    [HttpGet("me/requests/count")]
    [ProducesResponseType<RequestCount>(StatusCodes.Status200OK)]
    public async Task<RequestCount> RequestsCount()
        => new(await PendingRequestsTo(User.Id()).CountAsync());

    /// One definition for the list and the count, so the badge cannot disagree with the screen.
    /// Hidden: anyone I have already answered (interest, pass or match), anyone blocked in either
    /// direction, and banned accounts (ADR-0005).
    IQueryable<Match> PendingRequestsTo(Guid me)
    {
        var blocked = db.BlockedIdsFor(me);
        var answered = db.Matches.Where(m => m.InitiatorId == me).Select(m => m.TargetId);
        return db.Matches.Where(m => m.TargetId == me && m.Status == MatchStatus.Pending
                                     && !answered.Contains(m.InitiatorId)
                                     && !blocked.Contains(m.InitiatorId)
                                     && db.Users.Any(u => u.Id == m.InitiatorId && u.BannedAt == null));
    }

    [HttpPost("{targetId:guid}/pass")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Pass(Guid targetId)
    {
        var me = User.Id();
        if (me == targetId) return this.Invalid("self_target", "You cannot pass on yourself.");
        // Without this the foreign key rejects the row and the caller gets a 500 instead of a 404.
        if (!await db.Users.AnyAsync(u => u.Id == targetId)) return NotFound();

        if (await db.Matches.AnyAsync(m => m.InitiatorId == me && m.TargetId == targetId))
            return NoContent();

        db.Matches.Add(new Match
        {
            Id = Guid.CreateVersion7(),
            InitiatorId = me,
            TargetId = targetId,
            Status = MatchStatus.Passed
        });
        await db.SaveChangesAsync();
        return NoContent();
    }

    /// Takes back a pass, so the person comes back into discovery. Only a pass: an interest
    /// already reached the other side. Idempotent, like the pass itself.
    [HttpDelete("{targetId:guid}/pass")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> UndoPass(Guid targetId)
    {
        var me = User.Id();
        await db.Matches
            .Where(m => m.InitiatorId == me && m.TargetId == targetId && m.Status == MatchStatus.Passed)
            .ExecuteDeleteAsync();
        return NoContent();
    }
}
