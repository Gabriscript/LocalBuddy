using LocalBuddy.Api.Data;
using LocalBuddy.Api.Dtos;
using LocalBuddy.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LocalBuddy.Api.Controllers;

/// Reporting and blocking are deliberately reachable by unverified accounts: a safety action
/// must never depend on the reporter having finished their paperwork (ADR-0007).
[ApiController]
[Route("api/v1")]
[Authorize]
[Produces("application/json")]
public class SafetyController(LocalBuddyDbContext db) : ControllerBase
{
    [HttpPost("reports")]
    [ProducesResponseType(StatusCodes.Status202Accepted)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Report(NewReport req)
    {
        if (!await db.Users.AnyAsync(u => u.Id == req.ReportedId)) return NotFound();

        db.Reports.Add(new Report
        {
            Id = Guid.CreateVersion7(),
            ReporterId = User.Id(),
            ReportedId = req.ReportedId,
            Reason = req.Reason,
            Status = ReportStatus.Open
        });

        await db.SaveChangesAsync();
        // Accepted, not Created: the report is queued for a human, and the reporter is not
        // given a handle to read it back.
        return Accepted();
    }

    /// PUT rather than POST: blocking somebody twice is the same as blocking them once.
    [HttpPut("users/{userId:guid}/block")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Block(Guid userId)
    {
        var me = User.Id();
        if (me == userId) return this.Invalid("self_target", "You cannot block yourself.");
        if (!await db.Users.AnyAsync(u => u.Id == userId)) return NotFound();

        if (await db.Blocks.AnyAsync(b => b.BlockerId == me && b.BlockedId == userId))
            return NoContent();

        db.Blocks.Add(new Block { Id = Guid.CreateVersion7(), BlockerId = me, BlockedId = userId });
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("users/{userId:guid}/block")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Unblock(Guid userId)
    {
        await db.Blocks.Where(b => b.BlockerId == User.Id() && b.BlockedId == userId).ExecuteDeleteAsync();
        return NoContent();
    }

    /// The only way back. A blocked member is gone from discovery, from the inbox and from
    /// every profile lookup, so without this list the block could never be undone.
    [HttpGet("users/me/blocks")]
    [ProducesResponseType<Page<ProfileCard>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<Page<ProfileCard>>> Blocks(
        int page = 0, int pageSize = Page<ProfileCard>.DefaultSize)
    {
        var me = User.Id();
        (page, pageSize) = Page<ProfileCard>.Clamp(page, pageSize);

        var rows = await db.Blocks
            .Where(b => b.BlockerId == me)
            .Join(db.Users, b => b.BlockedId, u => u.Id, (b, u) => new { b.Id, User = u })
            // Version 7 ids carry the time they were made, so this is newest block first.
            .OrderByDescending(r => r.Id)
            .Skip(page * pageSize)
            .Take(pageSize + 1)
            .Select(r => new
            {
                r.User,
                PhotoId = db.Photos.Where(p => p.UserId == r.User.Id && p.Type == PhotoType.Profile)
                                   .Select(p => (Guid?)p.Id).FirstOrDefault()
            })
            .ToListAsync();

        // No rating: this list is for recognising somebody and undoing a block, not for judging them.
        var cards = rows.Select(r => new ProfileCard(
            PublicProfile.From(r.User),
            r.PhotoId is null ? null : PhotoDto.UrlFor(r.PhotoId.Value),
            null)).ToList();

        return Page<ProfileCard>.From(cards, page, pageSize);
    }
}
