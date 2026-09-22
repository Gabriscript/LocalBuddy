using LocalBuddy.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace LocalBuddy.Api.Services;

/// A ban has to bite immediately, but tokens live for 30 days and carry no revocation, so the
/// check cannot live at sign-in — it runs on every authenticated request.
/// ponytail: one indexed lookup per request. Cache it against the token lifetime if it ever
/// shows up in a profile.
public class BanEnforcementMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context, LocalBuddyDbContext db)
    {
        if (context.User.Identity?.IsAuthenticated == true && context.User.TryGetId(out var id))
        {
            var account = await db.Users.Where(u => u.Id == id)
                                        .Select(u => new { u.BannedAt })
                                        .FirstOrDefaultAsync(context.RequestAborted);

            // A deleted account's token stays cryptographically valid for its full 30 days. It
            // must not keep counting as signed in — seeing every profile, filing reports.
            if (account is null)
            {
                await Problem(context, StatusCodes.Status401Unauthorized, "account_not_found",
                              "Account not found", "This account no longer exists.");
                return;
            }

            if (account.BannedAt is not null)
            {
                await Problem(context, StatusCodes.Status403Forbidden, "account_banned",
                              "Account suspended", "This account is not allowed to use LocalBuddy.");
                return;
            }
        }

        await next(context);
    }

    // Same shape as ApiProblem (ADR-0008), which needs a controller and so cannot be used here.
    static Task Problem(HttpContext context, int status, string code, string title, string detail) =>
        Results.Problem(title: title, detail: detail, statusCode: status,
                        extensions: new Dictionary<string, object?> { ["code"] = code })
               .ExecuteAsync(context);
}
