using LocalBuddy.Api.Data;
using LocalBuddy.Api.Dtos;
using LocalBuddy.Api.Models;
using LocalBuddy.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LocalBuddy.Api.Controllers;

[ApiController]
[Route("api/v1/users")]
[Authorize]
[Produces("application/json")]
public class UsersController(LocalBuddyDbContext db, IIdentityVerifier verifier, IPhotoStorage storage)
    : ControllerBase
{
    [HttpGet("me")]
    [ProducesResponseType<MyProfile>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<MyProfile>> Me()
    {
        var me = User.Id();
        var user = await db.Users.FindAsync(me);
        if (user is null) return NotFound();

        var photos = await db.Photos.Where(p => p.UserId == me).ToListAsync();
        var availability = await db.Availabilities.Where(a => a.UserId == me).ToListAsync();

        return new MyProfile(
            user.Id, user.Email, user.Name, user.City, user.Role,
            user.WhatWeWillDo, user.WhyIHost, user.LanguagesSpoken,
            user.IdentityVerified, user.AgeVerified, user.CreditsBalance,
            user.HasCar, user.Smokes, user.HasPets, user.ProfileVisibleToAnonymous,
            photos.Select(PhotoDto.From).ToList(),
            availability.Select(AvailabilityDto.From).ToList(),
            ListingDto.From(await db.Listings.FirstOrDefaultAsync(l => l.UserId == me)));
    }

    /// Public profile — what PublicProfile exposes and nothing more (GUIDELINES §3).
    /// Readable without signing in only where the host has allowed it; otherwise a visitor who
    /// is not signed in gets NotFound, which does not confirm that the profile exists.
    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    [ProducesResponseType<ProfileDetail>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProfileDetail>> GetById(Guid id)
    {
        var user = await db.Users.FindAsync(id);
        if (user is null || !User.CanSeeProfileOf(user)) return NotFound();

        var photos = await db.Photos.Where(p => p.UserId == id).ToListAsync();
        var availability = await db.Availabilities.Where(a => a.UserId == id).ToListAsync();

        return new ProfileDetail(
            PublicProfile.From(user),
            photos.Select(PhotoDto.From).ToList(),
            availability.Select(AvailabilityDto.From).ToList(),
            ListingDto.From(await db.Listings.FirstOrDefaultAsync(l => l.UserId == id)),
            await db.Reviews.Where(r => r.SubjectId == id).AverageAsync(r => (double?)r.Rating));
    }

    [HttpPut("me")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateMe(ProfileUpdate update)
    {
        var user = await db.Users.FindAsync(User.Id());
        if (user is null) return NotFound();

        (user.Name, user.City, user.Role) = (update.Name, update.City, update.Role);
        (user.WhatWeWillDo, user.WhyIHost, user.LanguagesSpoken) =
            (update.WhatWeWillDo, update.WhyIHost, update.LanguagesSpoken);
        (user.HasCar, user.Smokes, user.HasPets) = (update.HasCar, update.Smokes, update.HasPets);
        user.ProfileVisibleToAnonymous = update.ProfileVisibleToAnonymous;

        await db.SaveChangesAsync();
        return NoContent();
    }

    /// GDPR right to erasure.
    [HttpDelete("me")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteMe()
    {
        var me = User.Id();
        var user = await db.Users.FindAsync(me);
        if (user is null) return NotFound();

        // Every owned row is cascaded by the database (see LocalBuddyDbContext). The image
        // files on disk are the one thing the cascade cannot reach.
        var keys = await db.Photos.Where(p => p.UserId == me).Select(p => p.Url).ToListAsync();
        foreach (var key in keys) await storage.DeleteAsync(key);

        // ponytail: payments and reports survive on purpose — accounting and abuse history
        // outlive the account, which is exactly why they carry no FK. See ADR-0004.
        db.Users.Remove(user);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPut("me/availability")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
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

    /// Kicks off the document check with the external provider; we only ever store the verdict
    /// and a hashed handle for the person, never the document (GUIDELINES §9).
    [HttpPost("me/verify")]
    [ProducesResponseType<VerificationResult>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Verify()
    {
        var user = await db.Users.FindAsync(User.Id());
        if (user is null) return NotFound();

        var check = await verifier.VerifyAsync(user.Id);
        if (!check.IsAdult) return this.Invalid("under_age", "You must be 18 or older to use LocalBuddy.");

        if (check.Verified && check.SubjectHash is not null)
        {
            // The same human already had an account banned: the new one inherits the ban rather
            // than becoming a clean slate. This is the whole reason the provider returns a
            // handle instead of a boolean. ADR-0005.
            var evading = await db.Users.AnyAsync(u =>
                u.IdentitySubjectHash == check.SubjectHash && u.BannedAt != null && u.Id != user.Id);

            user.IdentitySubjectHash = check.SubjectHash;

            if (evading)
            {
                user.BannedAt = DateTime.UtcNow;
                user.BanReason = "Identity matches an account banned from the platform.";
                await db.SaveChangesAsync();
                return this.Denied("account_banned", user.BanReason);
            }
        }

        (user.IdentityVerified, user.AgeVerified) = (check.Verified, check.IsAdult);
        await db.SaveChangesAsync();
        return Ok(new VerificationResult(user.IdentityVerified, user.AgeVerified));
    }
}
