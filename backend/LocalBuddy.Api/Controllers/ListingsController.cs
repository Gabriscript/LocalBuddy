using LocalBuddy.Api.Data;
using LocalBuddy.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LocalBuddy.Api.Controllers;

public record ListingUpdate(bool OffersExperience, bool OffersOvernight, bool OvernightComplianceAck);

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ListingsController(LocalBuddyDbContext db) : ControllerBase
{
    [HttpPut("me")]
    public async Task<IActionResult> Upsert(ListingUpdate update)
    {
        // GUIDELINES §5: overnight is only switchable on with an explicit Alloggiati Web /
        // TULPS acknowledgement. Enforced here, not just in the UI checkbox.
        if (update.OffersOvernight && !update.OvernightComplianceAck)
            return BadRequest("Overnight hosting requires confirming the Alloggiati Web / TULPS obligations");

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
        return Ok(listing);
    }
}
