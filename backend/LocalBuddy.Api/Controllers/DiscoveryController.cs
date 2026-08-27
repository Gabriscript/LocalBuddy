using LocalBuddy.Api.Data;
using LocalBuddy.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LocalBuddy.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DiscoveryController(LocalBuddyDbContext db) : ControllerBase
{
    /// Nullable bools are the "no preference" third state (GUIDELINES §11.3) — a plain
    /// bool would silently exclude everyone who doesn't match.
    [HttpGet]
    public async Task<IActionResult> Search(
        string? city,
        string? role,
        bool? offersOvernight,
        [FromQuery] TimeOfDay[]? timeOfDay,
        bool? hasCar,
        bool? smokes,
        bool? hasPets,
        int page = 0,
        int pageSize = 20)
    {
        var me = User.Id();

        var blocked = db.Blocks
            .Where(b => b.BlockerId == me || b.BlockedId == me)
            .Select(b => b.BlockerId == me ? b.BlockedId : b.BlockerId);

        var alreadySeen = db.Matches.Where(m => m.InitiatorId == me).Select(m => m.TargetId);

        var q = db.Users.Where(u => u.Id != me && !blocked.Contains(u.Id) && !alreadySeen.Contains(u.Id));

        if (!string.IsNullOrWhiteSpace(city)) q = q.Where(u => u.City.ToLower() == city.ToLower());
        if (!string.IsNullOrWhiteSpace(role)) q = q.Where(u => u.Role == role || u.Role == "entrambi");
        if (hasCar is not null) q = q.Where(u => u.HasCar == hasCar);
        if (smokes is not null) q = q.Where(u => u.Smokes == smokes);
        if (hasPets is not null) q = q.Where(u => u.HasPets == hasPets);

        if (offersOvernight is not null)
            q = q.Where(u => db.Listings.Any(l => l.UserId == u.Id && l.OffersOvernight == offersOvernight));

        if (timeOfDay?.Length > 0)
            q = q.Where(u => db.Availabilities.Any(a => a.UserId == u.Id && timeOfDay.Contains(a.TimeOfDay)));

        var results = await q
            .OrderByDescending(u => u.CreditsBalance) // GUIDELINES §4: hosting earns visibility
            .Skip(page * pageSize)
            .Take(pageSize)
            .Select(u => new
            {
                u.Id, u.Name, u.City, u.Role, u.Bio,
                u.IdentityVerified, u.HasCar, u.Smokes, u.HasPets,
                PhotoUrl = db.Photos.Where(p => p.UserId == u.Id && p.Type == PhotoType.Profile)
                                    .Select(p => p.Url).FirstOrDefault(),
                Rating = db.Reviews.Where(r => r.SubjectId == u.Id).Average(r => (double?)r.Rating)
            })
            .ToListAsync();

        return Ok(results);
    }
}
