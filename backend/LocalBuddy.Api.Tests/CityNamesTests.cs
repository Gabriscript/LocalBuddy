using LocalBuddy.Api.Controllers;
using LocalBuddy.Api.Dtos;
using LocalBuddy.Api.Models;
using LocalBuddy.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LocalBuddy.Api.Tests;

/// ADR-0016: a known city answers to its names in two languages, in search, suggestions and saving.
public class CityNamesTests
{
    static readonly DateOnly Today = Trip.Today;

    static Guid Member(TestDb t, string name, string city)
    {
        var id = t.AddUser(name);
        t.Db.Users.Find(id)!.City = city;
        t.Db.SaveChanges();
        return id;
    }

    static void Visit(TestDb t, Guid user, string city, int fromDay = 1, int toDay = 3)
    {
        t.Db.Trips.Add(new Trip { Id = Guid.CreateVersion7(), UserId = user, City = city, From = Today.AddDays(fromDay), To = Today.AddDays(toDay) });
        t.Db.SaveChanges();
    }

    static async Task<IReadOnlyList<ProfileCard>> Feed(TestDb t, Guid me, string city) =>
        (await new DiscoveryController(t.Db).As(me).Search(city, null, null, null, null, null, null)).Value!.Items;

    public static TheoryData<string, string> Pairs()
    {
        var pairs = new TheoryData<string, string>();
        foreach (var g in CityNames.Groups)
            foreach (var alias in g.Skip(1))
                pairs.Add(g[0], alias);
        return pairs;
    }

    [Fact]
    public void No_name_belongs_to_two_cities()
    {
        var names = CityNames.Groups.SelectMany(g => g.Select(n => n.ToLowerInvariant())).ToList();
        Assert.Equal(names.Count, names.Distinct().Count());
    }

    [Theory]
    [MemberData(nameof(Pairs))]
    public async Task Each_name_finds_the_residents_and_visitors_saved_under_the_other(string canonical, string alias)
    {
        using var t = new TestDb();
        var me = Member(t, "me", "Oslo");
        var (atCanonical, atAlias) = (Member(t, "atCanonical", canonical), Member(t, "atAlias", alias));
        var (toCanonical, toAlias) = (Member(t, "toCanonical", "Oslo"), Member(t, "toAlias", "Oslo"));
        Visit(t, toCanonical, canonical);
        Visit(t, toAlias, alias);
        Member(t, "elsewhere", "Bergen");
        var everyone = new[] { atCanonical, atAlias, toCanonical, toAlias }.Order();

        Assert.Equal(everyone, (await Feed(t, me, alias)).Select(c => c.Id).Order());
        Assert.Equal(everyone, (await Feed(t, me, canonical)).Select(c => c.Id).Order());
        Assert.Equal(canonical, CityNames.Canonical(alias));
    }

    [Fact]
    public async Task Florence_finds_a_Firenze_resident_and_a_visitor_whose_trip_says_Firenze()
    {
        using var t = new TestDb();
        var me = Member(t, "me", "Milano");
        var resident = Member(t, "resident", "Firenze");
        var visitor = Member(t, "visitor", "Helsinki");
        Visit(t, visitor, "Firenze");

        var cards = await Feed(t, me, " FLORENCE ");

        Assert.Equal([visitor, resident], cards.Select(c => c.Id));
        Assert.Equal("Firenze", cards[0].Trip?.City);
    }

    [Fact]
    public async Task A_resident_is_not_a_visitor_at_home_under_the_other_name()
    {
        using var t = new TestDb();
        var me = Member(t, "me", "Oslo");
        var movedHere = Member(t, "movedHere", "Firenze");
        Visit(t, movedHere, "Florence"); // saved before the change, under the alias

        var card = Assert.Single(await Feed(t, me, "Florence"));

        Assert.Equal(movedHere, card.Id);
        Assert.Null(card.Trip);
    }

    [Fact]
    public async Task An_unknown_city_matches_only_itself()
    {
        using var t = new TestDb();
        var me = Member(t, "me", "Milano");
        var oslo = Member(t, "oslo", "Oslo");
        Member(t, "bergen", "Bergen");

        Assert.Equal([oslo], (await Feed(t, me, " oslo ")).Select(c => c.Id));
        Assert.Equal("Oslo", CityNames.Canonical("  Oslo "));
        Assert.Equal(["oslo"], CityNames.Names(" Oslo"));
        Assert.Equal("Firenze", CityNames.Canonical(" fLoReNcE "));
        Assert.Equal("Munich", CityNames.Canonical("MÜNCHEN"));
        Assert.Equal("Firenzee", CityNames.Canonical("Firenzee")); // only case and spaces are ignored
    }

    [Fact]
    public async Task A_trip_under_an_alias_is_saved_under_the_canonical_name()
    {
        using var t = new TestDb();
        var anna = t.AddUser("anna"); // lives in Milano

        var created = Assert.IsType<ObjectResult>(await new TripsController(t.Db).As(anna)
            .Create(new NewTrip(" florence ", Today.AddDays(1), Today.AddDays(2))));
        var home = Assert.IsType<ObjectResult>(await new TripsController(t.Db).As(anna)
            .Create(new NewTrip("Milan", Today.AddDays(5), Today.AddDays(6))));
        var other = Assert.IsType<ObjectResult>(await new TripsController(t.Db).As(anna)
            .Create(new NewTrip(" Bergen ", Today.AddDays(8), Today.AddDays(9))));

        Assert.Equal("Firenze", Assert.IsType<TripDto>(created.Value).City);
        Assert.Equal("trip_home_city", (home.Value as ProblemDetails)?.Extensions["code"]?.ToString()); // Milan is home
        Assert.Equal("Bergen", Assert.IsType<TripDto>(other.Value).City);
        Assert.Equal(["Bergen", "Firenze"], (await t.Db.Trips.Select(x => x.City).ToListAsync()).Order());
    }

    [Theory]
    [InlineData(" milan ", "Milano")]
    [InlineData("Bergen ", "Bergen")]
    public async Task A_profile_city_under_an_alias_is_saved_under_the_canonical_name(string typed, string stored)
    {
        using var t = new TestDb();
        var anna = t.AddUser("anna");

        await new UsersController(t.Db, null!, null!).As(anna)
            .UpdateMe(new ProfileUpdate("anna", typed, "guest", "", "", "", false, false, false, false));

        Assert.Equal(stored, t.Db.Users.Find(anna)!.City);
    }

    [Fact]
    public async Task Suggestions_offer_a_city_by_any_of_its_names_once()
    {
        using var t = new TestDb();
        var me = Member(t, "me", "Oslo");
        foreach (var (name, city) in new[] { ("a", "Firenze"), ("b", "Florence"), ("c", "florence"), ("d", "Florø"), ("e", "Roma"), ("f", "Rome"), ("g", "Rotterdam") })
            Member(t, name, city);

        Assert.Equal(["Firenze", "Florø"], await new DiscoveryController(t.Db).As(me).Cities(" flo"));
        Assert.Equal(["Firenze"], await new DiscoveryController(t.Db).As(me).Cities("fir"));
        Assert.Equal(["Roma"], await new DiscoveryController(t.Db).As(me).Cities("ROM"));
        Assert.Equal(["Firenze", "Roma", "Florø", "Rotterdam"], await new DiscoveryController(t.Db).As(me).Cities(""));
    }
}
