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
            var bannedAt = await db.Users.Where(u => u.Id == id)
                                         .Select(u => u.BannedAt)
                                         .FirstOrDefaultAsync(context.RequestAborted);
            if (bannedAt is not null)
            {
                await Results.Problem(
                    title: "Account suspended",
                    detail: "This account is not allowed to use LocalBuddy.",
                    statusCode: StatusCodes.Status403Forbidden).ExecuteAsync(context);
                return;
            }
        }

        await next(context);
    }
}
