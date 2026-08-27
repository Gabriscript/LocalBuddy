using LocalBuddy.Api.Data;
using LocalBuddy.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LocalBuddy.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MatchesController(LocalBuddyDbContext db) : ControllerBase
{
    /// Free path to a conversation: both sides express interest (GUIDELINES §3).
    [HttpPost("interest/{targetId}")]
    public async Task<IActionResult> Interest(Guid targetId)
    {
        var me = User.Id();
        if (me == targetId) return BadRequest("Cannot match with yourself");
        if (!await db.Users.AnyAsync(u => u.Id == targetId)) return NotFound();

        if (await db.Blocks.AnyAsync(b =>
            (b.BlockerId == me && b.BlockedId == targetId) ||
            (b.BlockerId == targetId && b.BlockedId == me)))
            return BadRequest("Blocked");

        if (await db.Matches.AnyAsync(m => m.InitiatorId == me && m.TargetId == targetId))
            return BadRequest("Already responded to this profile");

        var theirs = await db.Matches.FirstOrDefaultAsync(m =>
            m.InitiatorId == targetId && m.TargetId == me && m.Status == MatchStatus.Pending);
        var matched = theirs is not null;

        db.Matches.Add(new Match
        {
            Id = Guid.NewGuid(),
            InitiatorId = me,
            TargetId = targetId,
            Status = matched ? MatchStatus.Matched : MatchStatus.Pending,
            MatchedAt = matched ? DateTime.UtcNow : null
        });

        if (!matched)
        {
            await db.SaveChangesAsync();
            return Ok(new { matched = false });
        }

        // Reciprocal — open the chat.
        theirs!.Status = MatchStatus.Matched;
        theirs.MatchedAt = DateTime.UtcNow;

        // ponytail: simultaneous mutual interest could race into two conversations.
        // Vanishingly unlikely at MVP scale; add a unique index on the ordered pair if it bites.
        var conversation = new Conversation { Id = Guid.NewGuid(), UserAId = me, UserBId = targetId };
        db.Conversations.Add(conversation);

        await db.SaveChangesAsync();
        return Ok(new { matched = true, conversationId = conversation.Id });
    }

    [HttpPost("pass/{targetId}")]
    public async Task<IActionResult> Pass(Guid targetId)
    {
        var me = User.Id();
        if (await db.Matches.AnyAsync(m => m.InitiatorId == me && m.TargetId == targetId))
            return NoContent();

        db.Matches.Add(new Match { Id = Guid.NewGuid(), InitiatorId = me, TargetId = targetId, Status = MatchStatus.Passed });
        await db.SaveChangesAsync();
        return NoContent();
    }
}
