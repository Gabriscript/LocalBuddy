using LocalBuddy.Api.Models;
using LocalBuddy.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LocalBuddy.Api.Controllers;

/// The presenter's one power: putting the demo back in its first state between two showings (ADR-0014).
[ApiController]
[Route("api/v1/demo")]
[Authorize]
[Produces("application/json")]
public class DemoController(DemoOptions options, DemoSeeder seeder) : ControllerBase
{
    /// Idempotent: every call leaves the same cast, with the same account ids, anchored to today.
    [HttpPost("reset")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Reset(CancellationToken ct)
    {
        if (!options.ResetEnabled)
            return this.Failure(StatusCodes.Status404NotFound, "demo_disabled", "Demo data is not enabled on this server.");
        if (User.Id() != DemoSeed.Current.PresenterId)
            return this.Denied("demo_reset_forbidden", "Only the demo presenter account can reset the demo data.");

        await seeder.ResetAsync(Trip.Today, DateTime.UtcNow, ct);
        return NoContent();
    }
}
