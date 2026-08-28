using System.Security.Claims;
using LocalBuddy.Api.Models;

namespace LocalBuddy.Api;

public static class ClaimsPrincipalExtensions
{
    /// Id of the caller, straight from the JWT. Only valid inside [Authorize] actions.
    public static Guid Id(this ClaimsPrincipal principal)
        => Guid.Parse(principal.FindFirstValue(ClaimTypes.NameIdentifier)!);

    /// For code that runs before authorization has ruled out anonymous callers.
    public static bool TryGetId(this ClaimsPrincipal principal, out Guid id)
        => Guid.TryParse(principal.FindFirstValue(ClaimTypes.NameIdentifier), out id);

    /// A profile is readable by any signed-in user, and by anonymous visitors only where the
    /// host has chosen to allow it (GUIDELINES §3). Photos follow the same rule.
    public static bool CanSeeProfileOf(this ClaimsPrincipal caller, User owner)
        => caller.Identity?.IsAuthenticated == true || owner.ProfileVisibleToAnonymous;
}
