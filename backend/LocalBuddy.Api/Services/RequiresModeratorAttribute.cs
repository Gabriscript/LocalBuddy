using LocalBuddy.Api.Data;
using LocalBuddy.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;

namespace LocalBuddy.Api.Services;

/// Moderator powers are checked against the database on every request, not against the role
/// claim in the token: tokens live for 30 days and there is no revocation, so a moderator who
/// was stood down kept the ban button for the rest of the month. For the same reason a new
/// moderator gets in straight away instead of after the next sign-in.
///
/// ponytail: one indexed lookup per moderation request, on the handful of calls a day that
/// reach this surface.
public class RequiresModeratorAttribute : Attribute, IAsyncAuthorizationFilter
{
    public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        var db = context.HttpContext.RequestServices.GetRequiredService<LocalBuddyDbContext>();

        if (context.HttpContext.User.TryGetId(out var id) &&
            await db.UserRoles.AnyAsync(
                ur => ur.UserId == id && db.Roles.Any(r => r.Id == ur.RoleId && r.Name == Roles.Moderator),
                context.HttpContext.RequestAborted))
            return;

        // The one error shape (ADR-0008). Deliberately says no more than that the surface is
        // closed to this account.
        var problem = new ProblemDetails
        {
            Status = StatusCodes.Status403Forbidden,
            Title = "Moderators only",
            Detail = "This account cannot moderate."
        };
        problem.Extensions["code"] = "moderator_only";
        context.Result = new ObjectResult(problem) { StatusCode = StatusCodes.Status403Forbidden };
    }
}
