using LocalBuddy.Api.Data;
using LocalBuddy.Api.Dtos;
using LocalBuddy.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LocalBuddy.Api.Controllers;

/// Not /users: discovery is a curated feed, not the users collection. It hides blocked
/// members, people already responded to, and banned accounts.
[ApiController]
[Route("api/v1/discovery")]
[Authorize]
[Produces("application/json")]
public class DiscoveryController(LocalBuddyDbContext db) : ControllerBase
{
    /// Nullable bools are the "no preference" third state (GUIDELINES §11.3) — a plain
    /// bool would silently exclude everyone who does not match.
    [HttpGet]
    [ProducesResponseType<Page<ProfileCard>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<Page<ProfileCard>>> Search(
        string? city,
        string? role,
        bool? offersOvernight,
        [FromQuery] TimeOfDay[]? timeOfDay,
        bool? hasCar,
        bool? smokes,
        bool? hasPets,
        int page = 0,
        int pageSize = Page<ProfileCard>.DefaultSize)
    {
        var me = User.Id();
        (page, pageSize) = Page<ProfileCard>.Clamp(page, pageSize);

        var blocked = db.BlockedIdsFor(me);
        var alreadySeen = db.Matches.Where(m => m.InitiatorId == me).Select(m => m.TargetId);

        // Banned accounts stay off discovery: being findable is part of the service.
        var q = db.Users.Where(u => u.Id != me && u.BannedAt == null
                                    && !blocked.Contains(u.Id) && !alreadySeen.Contains(u.Id));

        if (!string.IsNullOrWhiteSpace(city)) q = q.Where(u => u.City.ToLower() == city.ToLower());
        if (!string.IsNullOrWhiteSpace(role)) q = q.Where(u => u.Role == role || u.Role == "entrambi");
        if (hasCar is not null) q = q.Where(u => u.HasCar == hasCar);
        if (smokes is not null) q = q.Where(u => u.Smokes == smokes);
        if (hasPets is not null) q = q.Where(u => u.HasPets == hasPets);

        if (offersOvernight is not null)
            q = q.Where(u => db.Listings.Any(l => l.UserId == u.Id && l.OffersOvernight == offersOvernight));

        if (timeOfDay?.Length > 0)
            q = q.Where(u => db.Availabilities.Any(a => a.UserId == u.Id && timeOfDay.Contains(a.TimeOfDay)));

        // The card extras stay in SQL to avoid an N+1; the public field set is applied after,
        // through PublicProfile, so it stays defined in exactly one place.
        var rows = await q
            .OrderByDescending(u => u.CreditsBalance) // GUIDELINES §4: hosting earns visibility
            .Skip(page * pageSize)
            .Take(pageSize + 1) // one extra, to know whether another page exists
            .Select(u => new
            {
                User = u,
                PhotoId = db.Photos.Where(p => p.UserId == u.Id && p.Type == PhotoType.Profile)
                                   .Select(p => (Guid?)p.Id).FirstOrDefault(),
                Rating = db.Reviews.Where(r => r.SubjectId == u.Id).Average(r => (double?)r.Rating)
            })
            .ToListAsync();

        var cards = rows.Select(r => new ProfileCard(
            PublicProfile.From(r.User),
            r.PhotoId is null ? null : PhotoDto.UrlFor(r.PhotoId.Value),
            r.Rating)).ToList();

        return Page<ProfileCard>.From(cards, page, pageSize);
    }
}
