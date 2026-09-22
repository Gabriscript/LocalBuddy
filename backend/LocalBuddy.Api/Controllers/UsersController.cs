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
        var user = await WithProfile().FirstOrDefaultAsync(u => u.Id == User.Id());
        if (user is null) return NotFound();

        return new MyProfile(
            user.Id, user.Email, user.Name, user.City, user.Role,
            user.WhatWeWillDo, user.WhyIHost, user.LanguagesSpoken,
            user.IdentityVerified, user.AgeVerified, user.CreditsBalance,
            user.HasCar, user.Smokes, user.HasPets, user.ProfileVisibleToAnonymous,
            user.Photos.Select(PhotoDto.From).ToList(),
            user.Availabilities.Select(AvailabilityDto.From).ToList(),
            ListingDto.From(user.Listing));
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
        var user = await WithProfile().FirstOrDefaultAsync(u => u.Id == id);
        // A banned account is gone as far as other members are concerned (ADR-0005).
        if (user is null || user.BannedAt is not null || !User.CanSeeProfileOf(user)) return NotFound();

        // Home photos exist for overnight hosting only; switching it off takes them off the profile.
        var photos = user.Photos.Where(p => p.Type == PhotoType.Profile || user.Listing?.OffersOvernight == true);

        return new ProfileDetail(
            PublicProfile.From(user),
            photos.Select(PhotoDto.From).ToList(),
            user.Availabilities.Select(AvailabilityDto.From).ToList(),
            ListingDto.From(user.Listing),
            await db.Reviews.Where(r => r.SubjectId == id).AverageAsync(r => (double?)r.Rating));
    }

    IQueryable<User> WithProfile() =>
        db.Users.Include(u => u.Photos).Include(u => u.Availabilities).Include(u => u.Listing).AsSplitQuery();

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
        // files on disk are the one thing the cascade cannot reach, so they go once the rows
        // are gone: a failed delete must not leave an account whose photos have vanished.
        var keys = await db.Photos.Where(p => p.UserId == me).Select(p => p.Url).ToListAsync();

        // ponytail: payments and reports survive on purpose — accounting and abuse history
        // outlive the account, which is exactly why they carry no FK. See ADR-0004.
        db.Users.Remove(user);
        await db.SaveChangesAsync();

        foreach (var key in keys) await storage.DeleteAsync(key);
        return NoContent();
    }

    /// Four times of day across a few seasons is the realistic ceiling; the cap is what stops a
    /// single request storing hundreds of thousands of rows.
    const int MaxAvailabilitySlots = 20;

    [HttpPut("me/availability")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SetAvailability(List<AvailabilitySlot> slots)
    {
        if (slots.Count > MaxAvailabilitySlots)
            return this.Invalid("too_many_slots", $"At most {MaxAvailabilitySlots} availability slots.");
        // JSON happily binds any number into an enum, and nothing else checks the season.
        if (slots.Any(s => !Enum.IsDefined(s.TimeOfDay) || s.SeasonStart > s.SeasonEnd))
            return this.Invalid("invalid_slot", "Each slot needs a known time of day and a season that ends after it starts.");

        var me = User.Id();

        // Replace, not append: the delete and the insert commit together or not at all.
        await using var transaction = await db.Database.BeginTransactionAsync();
        await db.Availabilities.Where(a => a.UserId == me).ExecuteDeleteAsync();

        db.Availabilities.AddRange(slots.Select(s => new Availability
        {
            UserId = me,
            TimeOfDay = s.TimeOfDay,
            SeasonStart = s.SeasonStart,
            SeasonEnd = s.SeasonEnd
        }));

        await db.SaveChangesAsync();
        await transaction.CommitAsync();
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
