using System.Security.Claims;

namespace LocalBuddy.Api;

public static class Extensions
{
    /// Id of the caller, straight from the JWT. Only valid inside [Authorize] actions.
    public static Guid Id(this ClaimsPrincipal principal)
        => Guid.Parse(principal.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
