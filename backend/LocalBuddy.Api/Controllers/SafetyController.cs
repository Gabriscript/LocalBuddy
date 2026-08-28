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
}
