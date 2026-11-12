using LocalBuddy.Api.Controllers;
using LocalBuddy.Api.Models;
using LocalBuddy.Api.Services;

namespace LocalBuddy.Api.Tests;

public class DiscoveryTests
{
    static MatchesController Matches(TestDb t, Guid caller) =>
        new MatchesController(t.Db, new ConversationService(t.Db)).As(caller);

    static DiscoveryController Discovery(TestDb t, Guid caller) => new DiscoveryController(t.Db).As(caller);

    static async Task<List<Guid>> FeedOf(TestDb t, Guid me) =>
        (await Discovery(t, me).Search(null, null, null, null, null, null, null)).Value!.Items.Select(c => c.Id).ToList();

    [Fact]
    public async Task Undoing_a_pass_brings_the_person_back()
    {
        using var t = new TestDb();
        var (anna, bruno) = (t.AddVerifiedUser("anna"), t.AddVerifiedUser("bruno"));
        await Matches(t, anna).Pass(bruno);
        Assert.Empty(await FeedOf(t, anna));

        await Matches(t, anna).UndoPass(bruno);

        Assert.Equal([bruno], await FeedOf(t, anna));
    }

    [Fact]
    public async Task Undo_leaves_an_interest_alone()
    {
        using var t = new TestDb();
        var (anna, bruno) = (t.AddVerifiedUser("anna"), t.AddVerifiedUser("bruno"));
        await Matches(t, anna).Interest(bruno);

        await Matches(t, anna).UndoPass(bruno);

        Assert.Empty(await FeedOf(t, anna));
    }

    [Fact]
    public async Task City_suggestions_start_with_what_was_typed_and_put_the_busiest_first()
    {
        using var t = new TestDb();
        var me = t.AddUser("me");
        foreach (var (name, city) in new[] { ("a", "Madrid"), ("b", "madrid"), ("c", "Marbella"), ("d", "Malmö"), ("e", "Roma") })
            t.Db.Users.Find(t.AddUser(name))!.City = city;
        t.Db.Users.Find(me)!.City = "Mantova"; // my own city is not a destination
        t.Db.SaveChanges();

        var cities = await Discovery(t, me).Cities(" MA");

        Assert.Equal("madrid", cities[0].ToLower()); // two members, written two ways: one entry
        Assert.Equal(3, cities.Count);
        Assert.DoesNotContain("Mantova", cities);
    }

    [Fact]
    public async Task Usual_days_and_style_narrow_the_feed()
    {
        using var t = new TestDb();
        var (me, weekend, weekday) = (t.AddUser("me"), t.AddUser("weekend"), t.AddUser("weekday"));
        var w = t.Db.Users.Find(weekend)!;
        (w.UsualDays, w.Lifestyle) = (UsualDays.ToMask([DayOfWeek.Saturday, DayOfWeek.Sunday]), Lifestyle.Nightlife);
        var d = t.Db.Users.Find(weekday)!;
        (d.UsualDays, d.ActivityStyle) = (UsualDays.ToMask([DayOfWeek.Monday]), ActivityStyle.Relaxed);
        t.Db.SaveChanges();

        async Task<List<Guid>> Feed(DayOfWeek[]? days = null, ActivityStyle? style = null, Lifestyle? life = null) =>
            (await Discovery(t, me).Search(null, null, null, null, null, null, null, days, style, life))
                .Value!.Items.Select(c => c.Id).ToList();

        Assert.Equal([weekend], await Feed(days: [DayOfWeek.Sunday, DayOfWeek.Friday]));
        Assert.Equal([weekday], await Feed(style: ActivityStyle.Relaxed));
        Assert.Equal([weekend], await Feed(life: Lifestyle.Nightlife));
        Assert.Equal(2, (await Feed()).Count);
    }

    [Fact]
    public void Usual_days_survive_the_round_trip_through_the_mask() =>
        Assert.Equal([DayOfWeek.Sunday, DayOfWeek.Wednesday, DayOfWeek.Saturday],
            UsualDays.FromMask(UsualDays.ToMask([DayOfWeek.Saturday, DayOfWeek.Sunday, DayOfWeek.Wednesday])));
}
