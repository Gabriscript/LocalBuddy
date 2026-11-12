using LocalBuddy.Api.Data;
using LocalBuddy.Api.Dtos;
using LocalBuddy.Api.Models;
using Microsoft.AspNetCore.Authorization;
using System.ComponentModel.DataAnnotations;
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
        [FromQuery] DayOfWeek[]? days = null,
        ActivityStyle? activityStyle = null,
        Lifestyle? lifestyle = null,
        bool? freeToday = null,
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

        // With a city, the feed is its residents plus its visitors: members with an active trip there.
        var today = Trip.Today;
        var hasCity = !string.IsNullOrWhiteSpace(city);
        var place = hasCity ? city!.Trim().ToLower() : "";
        // A resident is not a visitor at home, even with a trip saved before they moved there.
        var tripsHere = db.Trips.Where(t => hasCity && t.To >= today && t.City.ToLower() == place
                                            && !db.Users.Any(u => u.Id == t.UserId && u.City.ToLower() == place));

        if (hasCity) q = q.Where(u => u.City.ToLower() == place || tripsHere.Any(t => t.UserId == u.Id));
        // A host visiting the city is a traveller there, so "guest" takes in every visitor,
        // and "host" means somebody who lives there: a visitor has no home in that city to show.
        if (role == "guest" && hasCity)
            q = q.Where(u => u.Role == role || u.Role == "entrambi" || tripsHere.Any(t => t.UserId == u.Id));
        else if (role == "host" && hasCity)
            q = q.Where(u => (u.Role == role || u.Role == "entrambi") && u.City.ToLower() == place);
        else if (!string.IsNullOrWhiteSpace(role)) q = q.Where(u => u.Role == role || u.Role == "entrambi");
        if (hasCar is not null) q = q.Where(u => u.HasCar == hasCar);
        if (smokes is not null) q = q.Where(u => u.Smokes == smokes);
        if (hasPets is not null) q = q.Where(u => u.HasPets == hasPets);

        // A query string binds any number into an enum; an unknown day is ignored, not a wrong bit.
        var mask = UsualDays.ToMask((days ?? []).Where(Enum.IsDefined));
        if (mask != 0) q = q.Where(u => (u.UsualDays & mask) != 0);
        if (activityStyle is not null) q = q.Where(u => u.ActivityStyle == activityStyle);
        if (lifestyle is not null) q = q.Where(u => u.Lifestyle == lifestyle);
        var now = DateTime.UtcNow;
        // Only true filters; false would hide the people who are free, so it means "no preference".
        if (freeToday == true) q = q.Where(u => u.FreeUntil > now);

        if (offersOvernight is not null)
            q = q.Where(u => db.Listings.Any(l => l.UserId == u.Id && l.OffersOvernight == offersOvernight));

        if (timeOfDay?.Length > 0)
            q = q.Where(u => db.Availabilities.Any(a => a.UserId == u.Id && timeOfDay.Contains(a.TimeOfDay)));

        // The card extras stay in SQL to avoid an N+1; the public field set is applied after,
        // through PublicProfile, so it stays defined in exactly one place.
        var rows = await q
            // The day each visitor is here from, today for those already in town; null for everyone
            // else (and for all without a city), who sort last and keep the order below.
            .Select(u => new { User = u, Here = tripsHere.Where(t => t.UserId == u.Id).Min(t => (DateOnly?)(t.From > today ? t.From : today)) })
            .OrderBy(x => x.Here == null).ThenBy(x => x.Here)
            .ThenByDescending(x => hasCity && x.User.FreeUntil > now) // free today ranks right after arrivals
            .ThenByDescending(x => x.User.CreditsBalance) // GUIDELINES §4: hosting earns visibility
            .ThenBy(x => x.User.Id) // most members share a balance; without a tie-break pages overlap
            .Skip(page * pageSize)
            .Take(pageSize + 1) // one extra, to know whether another page exists
            .Select(x => x.User)
            .Select(u => new
            {
                User = u,
                PhotoId = db.Photos.Where(p => p.UserId == u.Id && p.Type == PhotoType.Profile)
                                   .Select(p => (Guid?)p.Id).FirstOrDefault(),
                Rating = db.Reviews.Where(r => r.SubjectId == u.Id).Average(r => (double?)r.Rating)
            })
            .ToListAsync();

        // One more query for the page, not one per card: the earliest active trip here per member.
        var ids = rows.Select(r => r.User.Id).ToList();
        var trips = hasCity
            ? (await tripsHere.Where(t => ids.Contains(t.UserId)).ToListAsync())
                .GroupBy(t => t.UserId).ToDictionary(g => g.Key, g => g.MinBy(t => t.From)!)
            : [];

        var cards = rows.Select(r => new ProfileCard(
            PublicProfile.From(r.User),
            r.PhotoId is null ? null : PhotoDto.UrlFor(r.PhotoId.Value),
            r.Rating,
            trips.TryGetValue(r.User.Id, out var t) ? new PublicTrip(t.City, t.From, t.To) : null)).ToList();

        return Page<ProfileCard>.From(cards, page, pageSize);
    }

    /// Destinations for the "where are you going?" box: cities where somebody discoverable
    /// lives, most members first. Only places with people in them, so a pick never comes back empty.
    [HttpGet("cities")]
    [ProducesResponseType<List<string>>(StatusCodes.Status200OK)]
    public async Task<List<string>> Cities([StringLength(Limits.City)] string? q)
    {
        var me = User.Id();
        var prefix = (q ?? "").Trim().ToLower();
        // shortcut: accents count ("mal" misses Málaga); add Postgres unaccent if real users trip on it.
        return await db.Users
            .Where(u => u.Id != me && u.BannedAt == null && u.City != "" && u.City.ToLower().StartsWith(prefix))
            .GroupBy(u => u.City.ToLower())
            .OrderByDescending(g => g.Count()).ThenBy(g => g.Key)
            .Select(g => g.Min(u => u.City)!)
            .Take(8)
            .ToListAsync();
    }
}
