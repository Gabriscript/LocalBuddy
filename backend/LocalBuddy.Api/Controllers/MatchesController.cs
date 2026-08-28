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
        if (!await db.Users.AnyAsync(u => u.Id == targetId)) return NotFound();
        if (await db.IsBlockedBetweenAsync(me, targetId))
            return this.Invalid("blocked", "This member is not reachable.");

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
            return Ok(new InterestResult(false, null));
        }

        // Reciprocal — open the chat.
        theirs!.Status = MatchStatus.Matched;
        theirs.MatchedAt = DateTime.UtcNow;

        var (conversation, _) = await conversations.OpenAsync(me, targetId, unlockedByPayment: false);

        await db.SaveChangesAsync();
        return Created($"/api/v1/conversations/{conversation.Id}/messages",
                       new InterestResult(true, conversation.Id));
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
