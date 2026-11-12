using LocalBuddy.Api.Data;
using LocalBuddy.Api.Dtos;
using LocalBuddy.Api.Models;
using LocalBuddy.Api.Services;
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
[Authorize]
[RequiresModerator]
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
        var me = User.Id();
        var user = await db.Users.FindAsync(userId);
        if (user is null) return NotFound();
        if (user.Id == me) return this.Invalid("self_target", "You cannot ban yourself.");

        // The ban follows the person, not the account (ADR-0005): every account verified with the
        // same identity goes with it, including spares verified before the ban. The verification
        // check alone only caught accounts verified after it.
        var hash = user.IdentitySubjectHash;
        var now = DateTime.UtcNow;
        var banned = await db.Users
            .Where(u => u.Id == userId || (hash != null && u.IdentitySubjectHash == hash && u.Id != me))
            .ExecuteUpdateAsync(s => s.SetProperty(u => u.BannedAt, now).SetProperty(u => u.BanReason, req.Reason));

        log.LogWarning("User {UserId} banned by {ModeratorId}, {Count} account(s) in all: {Reason}",
                       userId, me, banned, req.Reason);
        return NoContent();
    }

    /// Members who asked to be verified and are waiting for a moderator, oldest first (ADR-0011).
    [HttpGet("verifications")]
    [ProducesResponseType<Page<PendingVerificationDto>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<Page<PendingVerificationDto>>> PendingVerifications(
        int page = 0, int pageSize = Page<PendingVerificationDto>.DefaultSize)
    {
        (page, pageSize) = Page<PendingVerificationDto>.Clamp(page, pageSize);

        var rows = await db.Users.Where(u => u.IdentityVerificationRequestedAt != null && !u.IdentityVerified && u.BannedAt == null)
                                 .OrderBy(u => u.IdentityVerificationRequestedAt)
                                 .ThenBy(u => u.Id)
                                 .Skip(page * pageSize)
                                 .Take(pageSize + 1)
                                 .Select(u => new PendingVerificationDto(u.Id, u.Name, u.Email, u.City, u.IdentityVerificationRequestedAt!.Value))
                                 .ToListAsync();

        return Page<PendingVerificationDto>.From(rows, page, pageSize);
    }

    /// The pilot's identity check (ADR-0011): the moderator knows the person and has confirmed
    /// they are who they say and an adult. Idempotent. No identity hash is stored: there is no
    /// provider handle, and every new account has to pass the same moderator, who is the ban
    /// continuity ADR-0005 asks for.
    [HttpPost("users/{userId:guid}/verify")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Verify(Guid userId)
    {
        var user = await db.Users.FindAsync(userId);
        if (user is null) return NotFound();
        // Verifying is a way back into contact; a banned account comes back through unban first.
        if (user.BannedAt is not null) return this.Conflicted("user_banned", "This account is banned; lift the ban first.");
        if (user.IdentityVerified && user.AgeVerified) return NoContent();

        (user.IdentityVerified, user.AgeVerified) = (true, true);
        await db.SaveChangesAsync();

        log.LogWarning("Identity of user {UserId} approved by {ModeratorId}", userId, User.Id());
        return NoContent();
    }

    /// Lifts the ban on this one account only. Other accounts of the same person that went down
    /// with it stay banned until a moderator lifts them individually.
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
