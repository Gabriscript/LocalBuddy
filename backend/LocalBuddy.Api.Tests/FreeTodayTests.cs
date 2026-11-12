using LocalBuddy.Api.Controllers;
using LocalBuddy.Api.Dtos;
using LocalBuddy.Api.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace LocalBuddy.Api.Tests;

public class FreeTodayTests
{
    // The verifier and the storage are not touched by these endpoints.
    static UsersController Users(TestDb t, Guid caller) => new UsersController(t.Db, null!, null!).As(caller);

    static Task<ActionResult<Page<ProfileCard>>> Feed(TestDb t, Guid me, string? city = null, bool? free = null) =>
        new DiscoveryController(t.Db).As(me).Search(city, null, null, null, null, null, null, freeToday: free);

    static void FreeFor(TestDb t, Guid id, TimeSpan from) { t.Db.Users.Find(id)!.FreeUntil = DateTime.UtcNow + from; t.Db.SaveChanges(); }

    static string? Code(IActionResult r) => (Assert.IsType<ObjectResult>(r).Value as ProblemDetails)?.Extensions["code"]?.ToString();

    [Theory]
    [InlineData(-1)]   // already over
    [InlineData(1500)] // 25 hours
    public async Task An_end_outside_the_next_24_hours_is_refused(int minutes)
    {
        using var t = new TestDb();
        var anna = t.AddUser("anna");

        var result = await Users(t, anna).SetFreeToday(new FreeToday(DateTime.UtcNow.AddMinutes(minutes)));

        Assert.Equal("invalid_free_until", Code(result));
        Assert.Null(t.Db.Users.Find(anna)!.FreeUntil);
    }

    [Fact]
    public async Task An_end_without_a_zone_is_read_as_utc()
    {
        using var t = new TestDb();
        var anna = t.AddUser("anna");
        var until = DateTime.UtcNow.AddHours(2);

        Assert.IsType<NoContentResult>(await Users(t, anna).SetFreeToday(new FreeToday(DateTime.SpecifyKind(until, DateTimeKind.Unspecified))));

        Assert.Equal(until, t.Db.Users.Find(anna)!.FreeUntil);
    }

    [Fact]
    public async Task Anonymous_visitors_do_not_see_who_is_free()
    {
        using var t = new TestDb();
        var (me, anna) = (t.AddUser("me"), t.AddUser("anna"));
        t.Db.Users.Find(anna)!.ProfileVisibleToAnonymous = true;
        FreeFor(t, anna, TimeSpan.FromHours(3));
        var anonymous = new UsersController(t.Db, null!, null!)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };

        Assert.False((await anonymous.GetById(anna)).Value!.FreeToday);
        Assert.True((await Users(t, me).GetById(anna)).Value!.FreeToday);
    }

    [Fact]
    public async Task It_is_switched_on_shown_on_me_and_switched_off()
    {
        using var t = new TestDb();
        var anna = t.AddUser("anna");

        Assert.IsType<NoContentResult>(await Users(t, anna).SetFreeToday(new FreeToday(DateTime.UtcNow.AddHours(5))));
        Assert.NotNull((await Users(t, anna).Me()).Value!.FreeUntil);

        Assert.IsType<NoContentResult>(await Users(t, anna).ClearFreeToday());
        Assert.Null((await Users(t, anna).Me()).Value!.FreeUntil);
    }

    [Fact]
    public async Task An_expired_end_reads_as_not_free()
    {
        using var t = new TestDb();
        var (me, anna) = (t.AddUser("me"), t.AddUser("anna"));
        FreeFor(t, anna, TimeSpan.FromHours(-1));

        Assert.False((await Feed(t, me)).Value!.Items.Single().FreeToday);
        Assert.Null((await Users(t, anna).Me()).Value!.FreeUntil);
    }

    [Fact]
    public async Task The_filter_keeps_only_members_free_now_and_false_means_no_preference()
    {
        using var t = new TestDb();
        var (me, free, busy) = (t.AddUser("me"), t.AddUser("free"), t.AddUser("busy"));
        FreeFor(t, free, TimeSpan.FromHours(3));

        Assert.Equal([free], (await Feed(t, me, free: true)).Value!.Items.Select(c => c.Id));
        Assert.Equal(2, (await Feed(t, me, free: false)).Value!.Items.Count);
        Assert.True((await Feed(t, me)).Value!.Items.Single(c => c.Id == free).FreeToday);
    }

    [Fact]
    public async Task With_a_city_free_members_follow_arrivals_and_precede_the_credit_order()
    {
        using var t = new TestDb();
        var city = "Firenze";
        var me = t.AddUser("me");
        Guid Resident(string n, int credits) { var id = t.AddUser(n); var u = t.Db.Users.Find(id)!; (u.City, u.CreditsBalance) = (city, credits); t.Db.SaveChanges(); return id; }
        var (rich, free, arriving) = (Resident("rich", 9), Resident("free", 0), t.AddUser("arriving"));
        FreeFor(t, free, TimeSpan.FromHours(3));
        t.Db.Trips.Add(new Trip { Id = Guid.CreateVersion7(), UserId = arriving, City = city, From = Trip.Today, To = Trip.Today.AddDays(2) });
        t.Db.SaveChanges();

        Assert.Equal([arriving, free, rich], (await Feed(t, me, city)).Value!.Items.Select(c => c.Id));
    }
}
