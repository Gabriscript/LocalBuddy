using LocalBuddy.Api.Data;
using LocalBuddy.Api.Dtos;
using LocalBuddy.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LocalBuddy.Api.Controllers;

[ApiController]
[Route("api/v1/listings")]
[Authorize]
[Produces("application/json")]
public class ListingsController(LocalBuddyDbContext db) : ControllerBase
{
    [HttpPut("me")]
    [ProducesResponseType<ListingDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Upsert(ListingUpdate update)
    {
        // GUIDELINES §5: overnight is only switchable on with an explicit Alloggiati Web /
        // TULPS acknowledgement. Enforced here, not just in the UI checkbox.
        if (update.OffersOvernight && !update.OvernightComplianceAck)
            return this.Invalid("compliance_not_acknowledged",
                "Overnight hosting requires confirming the Alloggiati Web / TULPS obligations.");

        var me = User.Id();
        var listing = await db.Listings.FirstOrDefaultAsync(l => l.UserId == me);

        if (listing is null)
        {
            listing = new Listing { UserId = me };
            db.Listings.Add(listing);
        }

        listing.OffersExperience = update.OffersExperience;
        listing.OffersOvernight = update.OffersOvernight;
        listing.OvernightComplianceAck = update.OvernightComplianceAck;

        await db.SaveChangesAsync();
        return Ok(ListingDto.From(listing));
    }
}
