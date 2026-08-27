using LocalBuddy.Api.Data;
using LocalBuddy.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LocalBuddy.Api.Controllers;

public record NewReport(Guid ReportedId, string Reason);

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SafetyController(LocalBuddyDbContext db) : ControllerBase
{
    [HttpPost("report")]
    public async Task<IActionResult> Report(NewReport req)
    {
        if (string.IsNullOrWhiteSpace(req.Reason)) return BadRequest("Reason required");

        db.Reports.Add(new Report
        {
            Id = Guid.NewGuid(),
            ReporterId = User.Id(),
            ReportedId = req.ReportedId,
            Reason = req.Reason,
            Status = ReportStatus.Open
        });

        await db.SaveChangesAsync();
        return NoContent();
        // ponytail: no moderation queue endpoint — reports are read straight from the DB
        // until there's enough volume to justify an admin surface.
    }

    [HttpPost("block/{userId}")]
    public async Task<IActionResult> Block(Guid userId)
    {
        var me = User.Id();
        if (me == userId) return BadRequest("Cannot block yourself");

        if (await db.Blocks.AnyAsync(b => b.BlockerId == me && b.BlockedId == userId))
            return NoContent();

        db.Blocks.Add(new Block { Id = Guid.NewGuid(), BlockerId = me, BlockedId = userId });
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("block/{userId}")]
    public async Task<IActionResult> Unblock(Guid userId)
    {
        await db.Blocks.Where(b => b.BlockerId == User.Id() && b.BlockedId == userId).ExecuteDeleteAsync();
        return NoContent();
    }
}
