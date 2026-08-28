using LocalBuddy.Api.Data;
using LocalBuddy.Api.Dtos;
using LocalBuddy.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LocalBuddy.Api.Controllers;

/// Moderator surface. A ban stops an account from using the service — it does not, and is not
/// meant to, stop the person from looking at the site. See ADR-0005 for the rationale and for
/// how a banned person is recognised if they come back with a new account.
///
/// The verbs here are deliberate: banning is an action, not a resource you create.
[ApiController]
[Route("api/v1/moderation")]
[Authorize(Roles = Roles.Moderator)]
[Produces("application/json")]
public class ModerationController(LocalBuddyDbContext db, ILogger<ModerationController> log) : ControllerBase
{
    [HttpGet("reports")]
    [ProducesResponseType<Page<ReportDto>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<Page<ReportDto>>> Reports(
        ReportStatus status = ReportStatus.Open, int page = 0, int pageSize = Page<ReportDto>.DefaultSize)
    {
        (page, pageSize) = Page<ReportDto>.Clamp(page, pageSize);

        var rows = await db.Reports.Where(r => r.Status == status)
                                   .OrderByDescending(r => r.CreatedAt)
                                   .Skip(page * pageSize)
                                   .Take(pageSize + 1)
                                   .Select(r => ReportDto.From(r))
                                   .ToListAsync();

        return Page<ReportDto>.From(rows, page, pageSize);
    }

    [HttpPost("reports/{id:guid}/resolve")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Resolve(Guid id, ReportStatus status = ReportStatus.Reviewed)
    {
        if (status == ReportStatus.Open)
            return this.Invalid("not_a_resolution", "Resolving a report means Reviewed or Dismissed.");

        var report = await db.Reports.FindAsync(id);
        if (report is null) return NotFound();

        report.Status = status;
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("users/{userId:guid}/ban")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Ban(Guid userId, BanRequest req)
    {
        var user = await db.Users.FindAsync(userId);
        if (user is null) return NotFound();
        if (user.Id == User.Id()) return this.Invalid("self_target", "You cannot ban yourself.");

        user.BannedAt = DateTime.UtcNow;
        user.BanReason = req.Reason;
        await db.SaveChangesAsync();

        log.LogWarning("User {UserId} banned by {ModeratorId}: {Reason}", userId, User.Id(), req.Reason);
        return NoContent();
    }

    [HttpPost("users/{userId:guid}/unban")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Unban(Guid userId)
    {
        var user = await db.Users.FindAsync(userId);
        if (user is null) return NotFound();

        (user.BannedAt, user.BanReason) = (null, null);
        await db.SaveChangesAsync();

        log.LogWarning("User {UserId} unbanned by {ModeratorId}", userId, User.Id());
        return NoContent();
    }
}
