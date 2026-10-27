using LocalBuddy.Api.Data;
using LocalBuddy.Api.Dtos;
using LocalBuddy.Api.Models;
using LocalBuddy.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LocalBuddy.Api.Controllers;

/// Routed under users because interest and pass are things you do to a person, not a
/// "matches" resource you create. Shares the prefix with UsersController; the templates
/// do not overlap.
[ApiController]
[Route("api/v1/users")]
[Authorize]
[Produces("application/json")]
public class MatchesController(LocalBuddyDbContext db, ConversationService conversations) : ControllerBase
{
    /// Free path to a conversation: both sides express interest (GUIDELINES §3).
    /// 201 with a Location when the interest was reciprocal and a chat opened, 200 otherwise.
    [HttpPost("{targetId:guid}/interest")]
    [RequiresVerifiedIdentity]
    [ProducesResponseType<InterestResult>(StatusCodes.Status200OK)]
    [ProducesResponseType<InterestResult>(StatusCodes.Status201Created)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Interest(Guid targetId)
    {
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
            MatchedAt = matched ? DateTime.UtcNow : null
        });

        if (!matched)
        {
            await db.SaveChangesAsync();
            await transaction.CommitAsync();
            return Ok(new InterestResult(false, null));
        }

        // Reciprocal — open the chat.
        theirs!.Status = MatchStatus.Matched;
        theirs.MatchedAt = DateTime.UtcNow;

        var (conversation, _) = await conversations.OpenAsync(me, targetId, unlockedByPayment: false);

        await db.SaveChangesAsync();
        await transaction.CommitAsync();
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

        var rows = await (
                from m in PendingRequestsTo(User.Id())
                join u in db.Users on m.InitiatorId equals u.Id
                // Version 7 ids are time-ordered, so this is newest request first without a
                // timestamp column. The id is unique, so pages cannot overlap either.
                orderby m.Id descending
                select u)
            .Skip(page * pageSize)
            .Take(pageSize + 1)
            .Select(u => new
            {
                User = u,
                PhotoId = db.Photos.Where(p => p.UserId == u.Id && p.Type == PhotoType.Profile)
                                   .Select(p => (Guid?)p.Id).FirstOrDefault(),
                Rating = db.Reviews.Where(r => r.SubjectId == u.Id).Average(r => (double?)r.Rating)
            })
            .ToListAsync();

        var cards = rows.Select(r => new ProfileCard(
            PublicProfile.From(r.User),
            r.PhotoId is null ? null : PhotoDto.UrlFor(r.PhotoId.Value),
            r.Rating)).ToList();

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
}
