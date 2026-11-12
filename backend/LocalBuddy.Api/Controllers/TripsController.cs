using LocalBuddy.Api.Data;
using LocalBuddy.Api.Dtos;
using LocalBuddy.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LocalBuddy.Api.Controllers;

/// The caller's own trips. Other members see them only on discovery cards, as PublicTrip.
[ApiController]
[Route("api/v1/trips")]
[Authorize]
[Produces("application/json")]
public class TripsController(LocalBuddyDbContext db) : ControllerBase
{
    const int MaxDays = 30;
    const int MaxDaysAhead = 365;
    const int MaxActive = 5;

    [HttpPost]
    [ProducesResponseType<TripDto>(StatusCodes.Status201Created)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create(NewTrip trip)
    {
        var me = User.Id();
        var today = Trip.Today;
        var city = trip.City.Trim();

        if (city.Length == 0) return this.Invalid("invalid_city", "A trip needs a city.");
        if (trip.From > trip.To) return this.Invalid("invalid_dates", "A trip cannot end before it starts.");
        // Discovery shows a trip from its first day to its last, both counted in UTC; one that ended would never show.
        if (trip.To < today) return this.Invalid("trip_over", "This trip has already ended.");
        if (trip.To.DayNumber - trip.From.DayNumber + 1 > MaxDays)
            return this.Invalid("trip_too_long", $"A trip lasts at most {MaxDays} days.");
        if (trip.From > today.AddDays(MaxDaysAhead))
            return this.Invalid("trip_too_far", $"A trip starts within {MaxDaysAhead} days.");

        // A trip home would put a resident at the top of their own city's feed as a visitor.
        var home = await db.Users.Where(u => u.Id == me).Select(u => u.City).FirstAsync();
        if (string.Equals(city, home.Trim(), StringComparison.OrdinalIgnoreCase))
            return this.Invalid("trip_home_city", "A trip goes somewhere other than the city you live in.");

        // shortcut: two simultaneous posts can both pass the cap and make six; lock per user if it matters.
        if (await db.Trips.CountAsync(t => t.UserId == me && t.To >= today) >= MaxActive)
            return this.Conflicted("too_many_trips", $"At most {MaxActive} upcoming trips.");

        var row = new Trip { Id = Guid.CreateVersion7(), UserId = me, City = city, From = trip.From, To = trip.To };
        db.Trips.Add(row);
        await db.SaveChangesAsync();

        // No background job sweeps old trips, and a past trip is location history nobody needs.
        await db.Trips.Where(t => t.UserId == me && t.To < today).ExecuteDeleteAsync();
        return StatusCode(StatusCodes.Status201Created, new TripDto(row.Id, row.City, row.From, row.To));
    }

    [HttpGet]
    [ProducesResponseType<Page<TripDto>>(StatusCodes.Status200OK)]
    public async Task<Page<TripDto>> Mine(int page = 0, int pageSize = Page<TripDto>.DefaultSize)
    {
        var me = User.Id();
        var today = Trip.Today;
        (page, pageSize) = Page<TripDto>.Clamp(page, pageSize);

        var trips = await db.Trips
            .Where(t => t.UserId == me && t.To >= today)
            .OrderBy(t => t.From).ThenBy(t => t.Id)
            .Skip(page * pageSize)
            .Take(pageSize + 1)
            .Select(t => new TripDto(t.Id, t.City, t.From, t.To))
            .ToListAsync();
        return Page<TripDto>.From(trips, page, pageSize);
    }

    /// Idempotent, like the pass undo: deleting a trip that is gone, or not mine, changes nothing.
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var me = User.Id();
        await db.Trips.Where(t => t.Id == id && t.UserId == me).ExecuteDeleteAsync();
        return NoContent();
    }
}
