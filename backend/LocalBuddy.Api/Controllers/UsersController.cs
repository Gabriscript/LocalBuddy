using LocalBuddy.Api.Data;
using LocalBuddy.Api.Models;
using LocalBuddy.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LocalBuddy.Api.Controllers;

public record ProfileUpdate(string Name, string City, string Role, string Bio, bool HasCar, bool Smokes, bool HasPets);
public record AvailabilitySlot(TimeOfDay TimeOfDay, DateOnly? SeasonStart, DateOnly? SeasonEnd);

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController(LocalBuddyDbContext db, IIdentityVerifier verifier) : ControllerBase
{
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var me = User.Id();
        var user = await db.Users.FindAsync(me);
        if (user is null) return NotFound();

        return Ok(new
        {
            user.Id, user.Email, user.Name, user.City, user.Role, user.Bio,
            user.IdentityVerified, user.AgeVerified, user.CreditsBalance,
            user.HasCar, user.Smokes, user.HasPets,
            Photos = await db.Photos.Where(p => p.UserId == me).ToListAsync(),
            Availability = await db.Availabilities.Where(a => a.UserId == me).ToListAsync(),
            Listing = await db.Listings.FirstOrDefaultAsync(l => l.UserId == me)
        });
    }

    /// Public profile — no email, no surname, per GUIDELINES §3.
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var user = await db.Users.FindAsync(id);
        if (user is null) return NotFound();

        return Ok(new
        {
            user.Id, user.Name, user.City, user.Role, user.Bio,
            user.IdentityVerified, user.HasCar, user.Smokes, user.HasPets,
            Photos = await db.Photos.Where(p => p.UserId == id).ToListAsync(),
            Availability = await db.Availabilities.Where(a => a.UserId == id).ToListAsync(),
            Listing = await db.Listings.FirstOrDefaultAsync(l => l.UserId == id),
            Rating = await db.Reviews.Where(r => r.SubjectId == id).AverageAsync(r => (double?)r.Rating)
        });
    }

    [HttpPut("me")]
    public async Task<IActionResult> UpdateMe(ProfileUpdate update)
    {
        var user = await db.Users.FindAsync(User.Id());
        if (user is null) return NotFound();

        (user.Name, user.City, user.Role, user.Bio) = (update.Name, update.City, update.Role, update.Bio);
        (user.HasCar, user.Smokes, user.HasPets) = (update.HasCar, update.Smokes, update.HasPets);

        await db.SaveChangesAsync();
        return NoContent();
    }

    /// GDPR right to erasure. Cascades to everything owned by the user.
    [HttpDelete("me")]
    public async Task<IActionResult> DeleteMe()
    {
        var me = User.Id();
        var user = await db.Users.FindAsync(me);
        if (user is null) return NotFound();

        await db.Photos.Where(p => p.UserId == me).ExecuteDeleteAsync();
        await db.Availabilities.Where(a => a.UserId == me).ExecuteDeleteAsync();
        await db.Listings.Where(l => l.UserId == me).ExecuteDeleteAsync();
        await db.Matches.Where(m => m.InitiatorId == me || m.TargetId == me).ExecuteDeleteAsync();
        await db.Messages.Where(m => m.SenderId == me).ExecuteDeleteAsync();
        await db.Conversations.Where(c => c.UserAId == me || c.UserBId == me).ExecuteDeleteAsync();
        await db.Reviews.Where(r => r.AuthorId == me || r.SubjectId == me).ExecuteDeleteAsync();
        await db.Blocks.Where(x => x.BlockerId == me || x.BlockedId == me).ExecuteDeleteAsync();
        // ponytail: payments/reports survive deletion on purpose — accounting and abuse
        // history outlive the account. Anonymise them if a DPO ever asks.

        db.Users.Remove(user);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPut("me/availability")]
    public async Task<IActionResult> SetAvailability(List<AvailabilitySlot> slots)
    {
        var me = User.Id();
        await db.Availabilities.Where(a => a.UserId == me).ExecuteDeleteAsync();

        db.Availabilities.AddRange(slots.Select(s => new Availability
        {
            UserId = me,
            TimeOfDay = s.TimeOfDay,
            SeasonStart = s.SeasonStart,
            SeasonEnd = s.SeasonEnd
        }));

        await db.SaveChangesAsync();
        return NoContent();
    }

    /// Kicks off document check with the external provider; we only ever store the verdict.
    [HttpPost("me/verify")]
    public async Task<IActionResult> Verify()
    {
        var user = await db.Users.FindAsync(User.Id());
        if (user is null) return NotFound();

        var (verified, isAdult) = await verifier.VerifyAsync(user.Id);
        if (!isAdult) return BadRequest("Must be 18 or older");

        (user.IdentityVerified, user.AgeVerified) = (verified, isAdult);
        await db.SaveChangesAsync();
        return Ok(new { user.IdentityVerified, user.AgeVerified });
    }
}
