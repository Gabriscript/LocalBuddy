using LocalBuddy.Api.Controllers;
using LocalBuddy.Api.Data;
using LocalBuddy.Api.Dtos;
using LocalBuddy.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LocalBuddy.Api.Tests;

public class TripsTests
{
    static readonly DateOnly Today = Trip.Today;

    static TripsController Trips(LocalBuddyDbContext db, Guid caller) => new TripsController(db).As(caller);

    static Task<IActionResult> Post(TestDb t, Guid caller, string city, int fromDay, int toDay) =>
        Trips(t.Db, caller).Create(new NewTrip(city, Today.AddDays(fromDay), Today.AddDays(toDay)));

    static string? Code(IActionResult result) =>
        (Assert.IsType<ObjectResult>(result).Value as ProblemDetails)?.Extensions["code"]?.ToString();

    static void Seed(TestDb t, Guid user, string city, int fromDay, int toDay)
    {
        t.Db.Trips.Add(new Trip { Id = Guid.CreateVersion7(), UserId = user, City = city, From = Today.AddDays(fromDay), To = Today.AddDays(toDay) });
        t.Db.SaveChanges();
    }

    [Fact]
    public async Task A_trip_is_created_and_listed()
    {
        using var t = new TestDb();
        var anna = t.AddUser("anna");

        var created = Assert.IsType<ObjectResult>(await Post(t, anna, "  Firenze ", 0, 6));

        Assert.Equal(201, created.StatusCode);
        var trip = Assert.IsType<TripDto>(created.Value);
        Assert.Equal(("Firenze", Today, Today.AddDays(6)), (trip.City, trip.From, trip.To));
        Assert.Equal([trip], (await Trips(t.Db, anna).Mine()).Items);
    }

    [Theory]
    [InlineData("  ", 1, 2, "invalid_city")]
    [InlineData("Firenze", 3, 2, "invalid_dates")]
    [InlineData("Firenze", -5, -2, "trip_over")]
    [InlineData("Firenze", -3, -1, "trip_over")] // ended yesterday: discovery would never show it
    [InlineData(" milano ", 1, 2, "trip_home_city")] // anna lives in Milano
    [InlineData("Firenze", 1, 31, "trip_too_long")]
    [InlineData("Firenze", 366, 367, "trip_too_far")]
    public async Task Each_rule_refuses_its_trip(string city, int fromDay, int toDay, string code)
    {
        using var t = new TestDb();
        var anna = t.AddUser("anna");

        Assert.Equal(code, Code(await Post(t, anna, city, fromDay, toDay)));
        Assert.Equal(0, await t.Db.Trips.CountAsync());
    }

    [Theory]
    [InlineData(-3, 0)]    // ends today
    [InlineData(0, 29)]    // exactly 30 days
    [InlineData(365, 365)] // the furthest start
    public async Task The_edges_of_each_rule_pass(int fromDay, int toDay)
    {
        using var t = new TestDb();
        Assert.Equal(201, Assert.IsType<ObjectResult>(await Post(t, t.AddUser("anna"), "Firenze", fromDay, toDay)).StatusCode);
    }

    [Fact]
    public async Task A_sixth_upcoming_trip_is_refused_and_ended_ones_are_cleared_by_a_new_trip_only()
    {
        using var t = new TestDb();
        var anna = t.AddUser("anna");
        Seed(t, anna, "Roma", -10, -1);
        Seed(t, anna, "Napoli", -20, -15);
        for (var i = 0; i < 4; i++) Seed(t, anna, "Firenze", i * 10, i * 10 + 2);

        // Ended trips do not count towards the cap, and go once a new trip is in.
        Assert.Equal(201, Assert.IsType<ObjectResult>(await Post(t, anna, "Firenze", 50, 52)).StatusCode);
        Assert.False(await t.Db.Trips.AnyAsync(x => x.To < Today)); // ended trips are location history

        Seed(t, anna, "Oslo", -5, -2);
        var refused = await Post(t, anna, "Firenze", 100, 101);
        Assert.Equal((409, "too_many_trips"), (Assert.IsType<ObjectResult>(refused).StatusCode, Code(refused)));
        Assert.True(await t.Db.Trips.AnyAsync(x => x.To < Today)); // a refused request changes nothing
    }

    [Fact]
    public async Task The_list_shows_upcoming_trips_soonest_first()
    {
        using var t = new TestDb();
        var anna = t.AddUser("anna");
        Seed(t, anna, "Bergen", 20, 22);
        Seed(t, anna, "Oslo", -3, -1);
        Seed(t, anna, "Turku", -2, 0);
        Seed(t, t.AddUser("bruno"), "Espoo", 1, 2);

        Assert.Equal(["Turku", "Bergen"], (await Trips(t.Db, anna).Mine()).Items.Select(x => x.City));
    }

    [Fact]
    public async Task Only_the_owner_deletes_a_trip_and_deleting_twice_is_fine()
    {
        using var t = new TestDb();
        var (anna, bruno) = (t.AddUser("anna"), t.AddUser("bruno"));
        var trip = (TripDto)Assert.IsType<ObjectResult>(await Post(t, anna, "Firenze", 1, 3)).Value!;

        Assert.IsType<NoContentResult>(await Trips(t.Db, bruno).Delete(trip.Id));
        Assert.Equal(1, await t.Db.Trips.CountAsync());

        Assert.IsType<NoContentResult>(await Trips(t.Db, anna).Delete(trip.Id));
        Assert.IsType<NoContentResult>(await Trips(t.Db, anna).Delete(trip.Id));
        Assert.Equal(0, await t.Db.Trips.CountAsync());
    }
}

public class TripDiscoveryTests
{
    static readonly DateOnly Today = Trip.Today;

    static Guid Member(TestDb t, string name, string city, string role = "guest", int credits = 0)
    {
        var id = t.AddUser(name);
        var u = t.Db.Users.Find(id)!;
        (u.City, u.Role, u.CreditsBalance) = (city, role, credits);
        t.Db.SaveChanges();
        return id;
    }

    static void Visit(TestDb t, Guid user, string city, int fromDay, int toDay)
    {
        t.Db.Trips.Add(new Trip { Id = Guid.CreateVersion7(), UserId = user, City = city, From = Today.AddDays(fromDay), To = Today.AddDays(toDay) });
        t.Db.SaveChanges();
    }

    static async Task<IReadOnlyList<ProfileCard>> Feed(TestDb t, Guid me, string? city, string? role = null, int page = 0, int pageSize = 20) =>
        (await new DiscoveryController(t.Db).As(me).Search(city, role, null, null, null, null, null, page: page, pageSize: pageSize)).Value!.Items;

    [Fact]
    public async Task A_city_shows_its_residents_and_its_visitors()
    {
        using var t = new TestDb();
        var me = Member(t, "me", "Milano");
        var resident = Member(t, "resident", "Firenze");
        var visitor = Member(t, "visitor", "Helsinki");
        var gone = Member(t, "gone", "Helsinki");
        Member(t, "elsewhere", "Roma");
        Visit(t, visitor, "firenze", 2, 5);
        Visit(t, visitor, "Firenze", 20, 25); // a later visit does not replace the next one
        Visit(t, gone, "Firenze", -6, -1);

        var cards = await Feed(t, me, "Firenze");

        Assert.Equal([visitor, resident], cards.Select(c => c.Id));
        Assert.Equal(new PublicTrip("firenze", Today.AddDays(2), Today.AddDays(5)), cards[0].Trip);
        Assert.Null(cards[1].Trip);
        Assert.Equal(cards.Select(c => c.Id), (await Feed(t, me, " firenze ")).Select(c => c.Id)); // trimmed
        Assert.All(await Feed(t, me, null), c => Assert.Null(c.Trip)); // no city, no trip on the card
    }

    [Fact]
    public async Task A_host_visiting_counts_as_a_traveller_there()
    {
        using var t = new TestDb();
        var me = Member(t, "me", "Milano");
        var hostHere = Member(t, "hostHere", "Firenze", "host");
        var guestHere = Member(t, "guestHere", "Firenze", "guest");
        var visitingHost = Member(t, "visitingHost", "Helsinki", "host");
        Visit(t, visitingHost, "Firenze", 0, 3);

        Assert.Equal([visitingHost, guestHere], (await Feed(t, me, "Firenze", "guest")).Select(c => c.Id));
        Assert.Equal([hostHere], (await Feed(t, me, "Firenze", "host")).Select(c => c.Id)); // a visitor hosts nobody here
        Assert.Equal([hostHere, visitingHost], (await Feed(t, me, null, "host")).OrderBy(c => c.Name).Select(c => c.Id));
        Assert.DoesNotContain(visitingHost, (await Feed(t, me, null, "guest")).Select(c => c.Id)); // no city, no change
    }

    [Fact]
    public async Task A_resident_with_a_trip_home_is_not_a_visitor_there()
    {
        using var t = new TestDb();
        var me = Member(t, "me", "Milano");
        var visitor = Member(t, "visitor", "Oslo");
        var movedHere = Member(t, "movedHere", "Firenze", credits: 9);
        var resident = Member(t, "resident", "Firenze");
        Visit(t, visitor, "Firenze", 3, 5);
        Visit(t, movedHere, "firenze", 0, 2); // saved before the home city changed to Firenze

        var cards = await Feed(t, me, "Firenze");

        Assert.Equal([visitor, movedHere, resident], cards.Select(c => c.Id));
        Assert.Null(cards[1].Trip);
    }

    [Fact]
    public async Task In_town_now_comes_first_then_arrivals_by_date_then_everyone_else()
    {
        using var t = new TestDb();
        var me = Member(t, "me", "Milano");
        var richResident = Member(t, "richResident", "Firenze", credits: 50);
        var later = Member(t, "later", "Oslo", credits: 9);
        var soon = Member(t, "soon", "Oslo");
        var inTown = Member(t, "inTown", "Oslo");
        var inTownRich = Member(t, "inTownRich", "Oslo", credits: 5);
        Visit(t, later, "Firenze", 10, 12);
        Visit(t, soon, "Firenze", 2, 4);
        Visit(t, inTown, "Firenze", 0, 2);
        Visit(t, inTownRich, "Firenze", -3, 1);
        Visit(t, inTownRich, "Firenze", 8, 9);

        var all = (await Feed(t, me, "Firenze")).Select(c => c.Id).ToList();

        // Already in town ties on the day, so the usual order decides between them.
        Assert.Equal([inTownRich, inTown, soon, later, richResident], all);
        var paged = (await Feed(t, me, "Firenze", pageSize: 2)).Concat(await Feed(t, me, "Firenze", page: 1, pageSize: 2))
            .Concat(await Feed(t, me, "Firenze", page: 2, pageSize: 2)).Select(c => c.Id);
        Assert.Equal(all, paged);
    }
}

/// The feed query sorts on a CASE inside a correlated MIN over dates; SQLite stores those dates as
/// text, so this checks the same query translates and orders on Postgres.
[Trait("Category", "Integration")]
public class TripDiscoveryPostgresTests(PostgresFixture postgres) : IClassFixture<PostgresFixture>
{
    [Fact]
    public async Task Visitors_and_residents_come_back_in_order_on_Postgres()
    {
        var city = $"Firenze-{Guid.NewGuid():N}"; // the fixture is shared, so a city of its own
        var today = Trip.Today;
        await using var db = new LocalBuddyDbContext(postgres.Options);
        User Member(string name, string home) => new() { Id = Guid.CreateVersion7(), UserName = $"{name}-{Guid.NewGuid()}", Email = $"{name}@test.local", City = home, Role = "guest" };
        var (me, resident, soon, inTown) = (Member("me", "Milano"), Member("resident", city), Member("soon", "Oslo"), Member("inTown", "Oslo"));
        db.Users.AddRange(me, resident, soon, inTown);
        db.Trips.AddRange(
            new Trip { Id = Guid.CreateVersion7(), UserId = soon.Id, City = city, From = today.AddDays(3), To = today.AddDays(4) },
            new Trip { Id = Guid.CreateVersion7(), UserId = inTown.Id, City = city.ToUpper(), From = today.AddDays(-1), To = today });
        await db.SaveChangesAsync();

        var cards = (await new DiscoveryController(db).As(me.Id).Search(city, "guest", null, null, null, null, null)).Value!.Items;

        Assert.Equal([inTown.Id, soon.Id, resident.Id], cards.Select(c => c.Id));
        Assert.Equal(today.AddDays(3), cards[1].Trip?.From);
    }
}
