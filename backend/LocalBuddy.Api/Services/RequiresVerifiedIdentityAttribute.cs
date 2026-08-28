using LocalBuddy.Api.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;

namespace LocalBuddy.Api.Services;

/// Reaching another member requires a verified identity. Hosts are letting these people into
/// their homes and are entitled to know who is coming, and it is also what makes a ban stick:
/// an unverified account can be opened again forever. See ADR-0007.
///
/// Deliberately NOT applied to reading the site, nor to reporting and blocking — a safety
/// action must never depend on the reporter having finished their paperwork.
public class RequiresVerifiedIdentityAttribute : Attribute, IAsyncAuthorizationFilter
{
    public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        var db = context.HttpContext.RequestServices.GetRequiredService<LocalBuddyDbContext>();

        if (context.HttpContext.User.TryGetId(out var id) &&
            await db.Users.AnyAsync(u => u.Id == id && u.IdentityVerified, context.HttpContext.RequestAborted))
            return;

        context.Result = new ObjectResult(new
        {
            identityVerificationRequired = true,
            detail = "Verify your identity before contacting other members."
        })
        { StatusCode = StatusCodes.Status403Forbidden };
    }
}
