using LocalBuddy.Api.Controllers;
using LocalBuddy.Api.Data;
using LocalBuddy.Api.Dtos;
using LocalBuddy.Api.Models;
using LocalBuddy.Api.Services;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.PixelFormats;

namespace LocalBuddy.Api.Tests;

/// The demo reset (ADR-0014): the route, what a reset leaves behind, and what it must not touch.
public class DemoResetTests
{
    const string Password = "a-test-only-demo-password";

    static readonly DemoSeed Seed = DemoSeed.Current;
    static Guid Presenter => Seed.PresenterId;
    static Guid Id(string key) => DemoSeed.IdOf(key);

    static DemoOptions On(string photos = "") => new() { ResetEnabled = true, AccountPassword = Password, PhotosPath = photos };

    static DemoSeeder Seeder(TestDb t, TestIdentity identity, DemoOptions options, IPhotoStorage? storage = null) =>
        new(t.Db, identity.Users, storage ?? new MemoryPhotos(), options, NullLogger<DemoSeeder>.Instance);

    static Task Reset(TestDb t, TestIdentity identity, DemoOptions? options = null, IPhotoStorage? storage = null) =>
        Seeder(t, identity, options ?? On(), storage).ResetAsync(Trip.Today, DateTime.UtcNow);

    static DemoController Demo(TestDb t, TestIdentity identity, DemoOptions options, Guid caller) =>
        new DemoController(options, Seeder(t, identity, options)).As(caller);

    static string? Code(IActionResult result) =>
        (Assert.IsType<ObjectResult>(result).Value as ProblemDetails)?.Extensions["code"]?.ToString();

    static async Task<object> Snapshot(LocalBuddyDbContext db) => string.Join(",",
        string.Join(";", await db.Users.OrderBy(u => u.Id).Select(u => u.Id).ToListAsync()),
        await db.Trips.CountAsync(), await db.Matches.CountAsync(), await db.Conversations.CountAsync(),
        await db.Messages.CountAsync(), await db.Photos.CountAsync(), await db.Availabilities.CountAsync(),
        await db.Listings.CountAsync());

    [Fact]
    public async Task With_the_switch_off_the_route_does_not_exist()
    {
        using var t = new TestDb();
        using var identity = new TestIdentity(t.Db);

        var result = await Demo(t, identity, new DemoOptions(), Presenter).Reset(CancellationToken.None);

        Assert.Equal(StatusCodes.Status404NotFound, Assert.IsType<ObjectResult>(result).StatusCode);
        Assert.Equal("demo_disabled", Code(result));
        Assert.Equal(0, await t.Db.Users.CountAsync());
    }

    [Fact]
    public async Task Only_the_presenter_may_reset()
    {
        using var t = new TestDb();
        using var identity = new TestIdentity(t.Db);
        var bruno = t.AddVerifiedUser("bruno");

        var result = await Demo(t, identity, On(), bruno).Reset(CancellationToken.None);

        Assert.Equal(StatusCodes.Status403Forbidden, Assert.IsType<ObjectResult>(result).StatusCode);
        Assert.Equal("demo_reset_forbidden", Code(result));
        Assert.Equal(1, await t.Db.Users.CountAsync());
    }

    [Fact]
    public async Task The_presenter_resets_and_a_second_reset_leaves_the_same_cast()
    {
        using var t = new TestDb();
        using var identity = new TestIdentity(t.Db);

        Assert.IsType<NoContentResult>(await Demo(t, identity, On(), Presenter).Reset(CancellationToken.None));
        var first = await Snapshot(t.Db);
        Assert.IsType<NoContentResult>(await Demo(t, identity, On(), Presenter).Reset(CancellationToken.None));

        Assert.Equal(first, await Snapshot(t.Db));
        Assert.Equal(Seed.People.Select(p => Id(p.Key)).Order(), await t.Db.Users.Select(u => u.Id).OrderBy(id => id).ToListAsync());
    }

    [Fact]
    public async Task A_member_who_is_not_in_the_cast_keeps_everything_but_what_they_share_with_it()
    {
        using var t = new TestDb();
        using var identity = new TestIdentity(t.Db);
        await Reset(t, identity);

        var bruno = t.AddVerifiedUser("bruno");
        var carla = t.AddVerifiedUser("carla");
        var anna = Presenter;
        t.Db.Trips.Add(new Trip { Id = Guid.CreateVersion7(), UserId = bruno, City = "Helsinki", From = Trip.Today, To = Trip.Today.AddDays(3) });
        t.Db.Photos.Add(new Photo { Id = Guid.CreateVersion7(), UserId = bruno, Type = PhotoType.Profile, Url = "/uploads/bruno.jpg" });
        t.Db.Matches.Add(new Match { Id = Guid.CreateVersion7(), InitiatorId = bruno, TargetId = carla, Status = MatchStatus.Pending });
        t.Db.Matches.Add(new Match { Id = Guid.CreateVersion7(), InitiatorId = bruno, TargetId = anna, Status = MatchStatus.Matched });
        var shared = new Conversation { Id = Guid.CreateVersion7(), UserAId = anna, UserBId = bruno };
        t.Db.Conversations.Add(shared);
        t.Db.Messages.Add(new Message { Id = Guid.CreateVersion7(), ConversationId = shared.Id, SenderId = bruno, Content = "ciao" });
        t.Db.Payments.Add(new Payment { Id = Guid.CreateVersion7(), UserId = Id("tom"), Type = PaymentType.OneTimeUnlock, Amount = 4.99m, StripeId = "pi_demo" });
        t.Db.Payments.Add(new Payment { Id = Guid.CreateVersion7(), UserId = bruno, Type = PaymentType.OneTimeUnlock, Amount = 4.99m, StripeId = "pi_bruno" });
        t.Db.Reports.Add(new Report { Id = Guid.CreateVersion7(), ReporterId = bruno, ReportedId = Id("julien"), Reason = "spam" });
        t.Db.Reports.Add(new Report { Id = Guid.CreateVersion7(), ReporterId = bruno, ReportedId = carla, Reason = "spam" });
        await t.Db.SaveChangesAsync();

        await Reset(t, identity);

        Assert.True(await t.Db.Users.AnyAsync(u => u.Id == bruno));
        Assert.Equal(1, await t.Db.Trips.CountAsync(x => x.UserId == bruno));
        Assert.Equal(1, await t.Db.Photos.CountAsync(x => x.UserId == bruno));
        Assert.Equal([carla], await t.Db.Matches.Where(m => m.InitiatorId == bruno).Select(m => m.TargetId).ToListAsync());
        Assert.False(await t.Db.Conversations.AnyAsync(c => c.Id == shared.Id));
        Assert.Equal(["pi_bruno"], await t.Db.Payments.Select(p => p.StripeId).ToListAsync());
        Assert.Equal([carla], await t.Db.Reports.Select(r => r.ReportedId).ToListAsync());
    }

    [Fact]
    public async Task The_presenter_signs_in_with_the_configured_password()
    {
        using var t = new TestDb();
        using var identity = new TestIdentity(t.Db);
        await Reset(t, identity);
        var auth = new AuthController(identity.Users, identity.SignIn,
            new TokenService(new JwtOptions { Issuer = "test", Key = "a-signing-key-long-enough-for-hmac-sha256" }),
            NullLogger<AuthController>.Instance)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };

        var result = Assert.IsType<OkObjectResult>(await auth.Login(new LoginRequest(DemoSeed.EmailOf(Seed.Presenter), Password)));

        Assert.Equal(Presenter, Assert.IsType<AuthResult>(result.Value).UserId);
        Assert.IsType<ObjectResult>(await auth.Login(new LoginRequest(DemoSeed.EmailOf(Seed.Presenter), DemoOptions.PublishedPassword)));
    }

    [Fact]
    public async Task Only_the_presenter_on_an_enabled_server_is_told_it_can_reset()
    {
        using var t = new TestDb();
        using var identity = new TestIdentity(t.Db);
        await Reset(t, identity);
        var bruno = t.AddVerifiedUser("bruno");
        UsersController Users(Guid caller) => new UsersController(t.Db, new FakeIdentityVerifier(), new MemoryPhotos()).As(caller);

        Assert.True((await Users(Presenter).Me(On())).Value!.CanResetDemo);
        Assert.False((await Users(Presenter).Me(new DemoOptions())).Value!.CanResetDemo);
        Assert.False((await Users(bruno).Me(On())).Value!.CanResetDemo);
    }

    /// The presenter's first screen: chats that end on the other side, people waiting for an
    /// answer, and one request of her own still out.
    [Fact]
    public async Task The_presenter_starts_with_unread_chats_and_requests_both_ways()
    {
        using var t = new TestDb();
        using var identity = new TestIdentity(t.Db);
        await Reset(t, identity);

        var chats = (await new ConversationsController(t.Db, TestPush.For(t.Db)).As(Presenter).List()).Value!.Items;
        Assert.Equal(Seed.Matches.Count(m => m.A == Seed.Presenter || m.B == Seed.Presenter), chats.Count);
        Assert.All(chats, c => Assert.True(c.UnreadCount > 0));

        var matches = new MatchesController(t.Db, new ConversationService(t.Db), TestPush.For(t.Db)).As(Presenter);
        var waiting = Seed.Requests.Where(r => r.To == Seed.Presenter).Select(r => Id(r.From)).ToList();
        Assert.Equal(waiting.Order(), (await matches.Requests()).Value!.Items.Select(c => c.Id).Order());
        Assert.Equal(Seed.Requests.Where(r => r.From == Seed.Presenter).Select(r => Id(r.To)),
                     (await matches.Sent()).Value!.Items.Select(c => c.Id));

        // Answering any of them is an instant match.
        foreach (var asker in waiting)
            Assert.IsType<CreatedResult>(await matches.Interest(asker));
    }

    [Fact]
    public async Task Without_a_photo_folder_the_cast_is_seeded_without_photos()
    {
        using var t = new TestDb();
        using var identity = new TestIdentity(t.Db);

        await Reset(t, identity, On(Path.Combine(Path.GetTempPath(), $"no-demo-photos-{Guid.NewGuid():N}")));
        await Reset(t, identity, On(""));

        Assert.Equal(Seed.People.Count, await t.Db.Users.CountAsync());
        Assert.Equal(0, await t.Db.Photos.CountAsync());
    }

    [Fact]
    public async Task A_photo_in_the_folder_becomes_a_profile_photo_and_the_old_file_goes()
    {
        using var t = new TestDb();
        using var identity = new TestIdentity(t.Db);
        var folder = Directory.CreateTempSubdirectory("demo-photos-");
        try
        {
            using (var image = new Image<Rgb24>(8, 8)) await image.SaveAsJpegAsync(Path.Combine(folder.FullName, $"{Seed.Presenter}.jpg"));
            await File.WriteAllTextAsync(Path.Combine(folder.FullName, Seed.People[1].PhotoFile), "not an image");
            var storage = new MemoryPhotos();

            await Reset(t, identity, On(folder.FullName), storage);
            var firstKey = Assert.Single(storage.Files.Keys);
            await Reset(t, identity, On(folder.FullName), storage);

            var photo = await t.Db.Photos.SingleAsync();
            Assert.Equal((Presenter, PhotoType.Profile), (photo.UserId, photo.Type));
            Assert.Equal([photo.Url], storage.Files.Keys);
            Assert.NotEqual(firstKey, photo.Url);
        }
        finally
        {
            folder.Delete(recursive: true);
        }
    }
}

public class DemoOptionsTests
{
    [Fact]
    public void An_enabled_switch_needs_a_password_of_twelve_characters()
        => Assert.Throws<InvalidOperationException>(
            () => new DemoOptions { ResetEnabled = true, AccountPassword = "short-pass1" }.Validated(publishedPasswordAllowed: true));

    [Fact]
    public void The_published_password_is_accepted_in_Development_only()
    {
        var options = new DemoOptions { ResetEnabled = true, AccountPassword = DemoOptions.PublishedPassword };
        Assert.Same(options, options.Validated(publishedPasswordAllowed: true));
        Assert.Throws<InvalidOperationException>(() => options.Validated(publishedPasswordAllowed: false));
    }

    [Fact]
    public void A_disabled_switch_checks_nothing()
    {
        var options = new DemoOptions { AccountPassword = DemoOptions.PublishedPassword };
        Assert.Same(options, options.Validated(publishedPasswordAllowed: false));
        var empty = new DemoOptions();
        Assert.Same(empty, empty.Validated(publishedPasswordAllowed: false));
    }
}

/// The seeder writes past the controllers' validation, so the seed file is held to the same rules
/// here. Driven by `cities`, so the checks keep holding as cities are added.
public class DemoSeedFileTests
{
    static readonly DemoSeed Seed = DemoSeed.Current;
    static readonly HashSet<string> Roles = ["host", "guest", "entrambi"];

    static IEnumerable<DemoPerson> Residents(string city) => Seed.People.Where(p => p.Key != Seed.Presenter && p.City == city);

    static IEnumerable<DemoPerson> Visitors(string city) =>
        Seed.People.Where(p => p.Key != Seed.Presenter && p.Trips.Any(t => t.City == city && t.To >= 0));

    [Fact]
    public void Every_city_has_two_resident_hosts_and_a_visitor()
    {
        Assert.NotEmpty(Seed.Cities);
        foreach (var city in Seed.Cities)
        {
            Assert.True(Residents(city).Count(p => p.Role != "guest") >= 2, $"{city} needs two resident hosts.");
            Assert.True(Visitors(city).Any(), $"{city} needs a visitor.");
        }
    }

    [Fact]
    public void The_demo_covers_the_eleven_cities() =>
        Assert.Equal(new[] { "Milano", "Helsinki", "Firenze", "Roma", "Stockholm", "Paris", "London", "Berlin", "Madrid", "Prague", "Copenhagen" },
                     Seed.Cities);

    static IEnumerable<DemoTrip> TripsTo(string city) => Visitors(city).SelectMany(p => p.Trips.Where(t => t.City == city));

    /// The demo is shown on any day after a reset: most cities have somebody in town, the rest somebody arriving soon.
    [Fact]
    public void Six_cities_have_a_visitor_today_and_the_rest_one_arriving_within_twelve_days()
    {
        var inTown = Seed.Cities.Where(c => TripsTo(c).Any(t => t.From <= 0 && t.To >= 0)).ToList();
        Assert.True(inTown.Count >= 6, $"Only {inTown.Count} cities have somebody in town today.");
        foreach (var city in Seed.Cities.Except(inTown))
            Assert.True(TripsTo(city).Any(t => t.From is > 0 and <= 12), $"{city}: nobody arrives within 12 days.");
    }

    [Fact]
    public void Nobody_is_in_two_places_at_once()
    {
        foreach (var p in Seed.People)
        {
            var trips = p.Trips.OrderBy(t => t.From).ToList();
            for (var i = 1; i < trips.Count; i++)
                Assert.True(trips[i].From > trips[i - 1].To, $"{p.Key}: overlapping trips.");
        }
    }

    [Fact]
    public void Every_trip_keeps_to_the_apps_own_limits()
    {
        foreach (var p in Seed.People)
        {
            foreach (var t in p.Trips)
            {
                Assert.True(t.From <= t.To, $"{p.Key}: a trip ends before it starts.");
                Assert.True(t.To >= 0, $"{p.Key}: a trip already over.");
                Assert.True(t.To - t.From + 1 <= TripsController.MaxDays, $"{p.Key}: a trip too long.");
                Assert.True(t.From <= TripsController.MaxDaysAhead, $"{p.Key}: a trip too far ahead.");
                Assert.False(string.Equals(t.City, p.City, StringComparison.OrdinalIgnoreCase), $"{p.Key}: a trip home.");
            }
            Assert.True(p.Trips.Count(t => t.To >= 0) <= TripsController.MaxActive, $"{p.Key}: too many trips.");
        }
    }

    [Fact]
    public void Keys_and_photo_files_are_unique()
    {
        Assert.Equal(Seed.People.Count, Seed.People.Select(p => p.Key).Distinct().Count());
        var files = Seed.People.Select(p => p.PhotoFile).Concat(Seed.People.Where(p => p.HomePhoto is not null).Select(p => p.HomePhoto!)).ToList();
        Assert.Equal(files.Count, files.Distinct(StringComparer.OrdinalIgnoreCase).Count());
    }

    [Fact]
    public void Every_reference_names_somebody_in_the_cast()
    {
        var keys = Seed.People.Select(p => p.Key).ToHashSet();
        Assert.Contains(Seed.Presenter, keys);
        foreach (var m in Seed.Matches)
        {
            Assert.Contains(m.A, keys);
            Assert.Contains(m.B, keys);
            Assert.All(m.Messages, x => Assert.Contains(x.From, new[] { m.A, m.B }));
        }
        foreach (var r in Seed.Requests)
        {
            Assert.Contains(r.From, keys);
            Assert.Contains(r.To, keys);
        }

        // One interest row per direction (a unique index): a pair is either a match or a request, once.
        var pairs = Seed.Matches.SelectMany(m => new[] { (m.A, m.B), (m.B, m.A) })
            .Concat(Seed.Requests.Select(r => (r.From, r.To))).ToList();
        Assert.Equal(pairs.Count, pairs.Distinct().Count());
        Assert.DoesNotContain(pairs, p => p.Item1 == p.Item2);
    }

    [Fact]
    public void Every_profile_is_complete_and_fits_the_columns()
    {
        foreach (var p in Seed.People)
        {
            Assert.Contains(p.Role, Roles);
            Assert.False(string.IsNullOrWhiteSpace(p.Name), p.Key);
            Assert.False(string.IsNullOrWhiteSpace(p.City), p.Key);
            Assert.False(string.IsNullOrWhiteSpace(p.WhatWeWillDo), $"{p.Key}: empty bio.");
            if (p.Role != "guest") Assert.False(string.IsNullOrWhiteSpace(p.WhyIHost), $"{p.Key}: a host without a why.");
            Assert.True(p.Name.Length <= Limits.Name && p.City.Length <= Limits.City && p.Languages.Length <= Limits.Languages, p.Key);
            Assert.True(p.WhatWeWillDo.Length <= Limits.Prompt && p.WhyIHost.Length <= Limits.Prompt, $"{p.Key}: bio too long.");
            // A home photo only ever belongs to an overnight listing (PhotosController.Upload).
            if (p.HomePhoto is not null) Assert.True(p.OffersOvernight && p.Role != "guest", p.Key);
        }
        Assert.All(Seed.Matches.SelectMany(m => m.Messages), x => Assert.InRange(x.Text.Length, 1, Limits.Message));
    }
}

/// What the presenter sees in each seeded city right after a reset.
public class DemoDiscoveryTests
{
    static readonly DemoSeed Seed = DemoSeed.Current;

    static async Task<IReadOnlyList<ProfileCard>> Search(TestDb t, string city, Lifestyle? lifestyle = null) =>
        (await new DiscoveryController(t.Db).As(Seed.PresenterId)
            .Search(city, null, null, null, null, null, null, lifestyle: lifestyle, pageSize: Page<ProfileCard>.MaxSize)).Value!.Items;

    static async Task<TestDb> Seeded()
    {
        var t = new TestDb();
        using var identity = new TestIdentity(t.Db);
        await new DemoSeeder(t.Db, identity.Users, new MemoryPhotos(),
                new DemoOptions { ResetEnabled = true, AccountPassword = "a-test-only-demo-password" }, NullLogger<DemoSeeder>.Instance)
            .ResetAsync(Trip.Today, DateTime.UtcNow);
        return t;
    }

    [Fact]
    public async Task Every_city_shows_hosts_and_a_visitor()
    {
        using var t = await Seeded();
        foreach (var city in Seed.Cities)
        {
            var cards = await Search(t, city);
            Assert.True(cards.Count(c => c.Role != "guest" && c.City == city) >= 2, $"{city}: fewer than two hosts.");
            Assert.True(cards.Any(c => c.Trip is not null), $"{city}: no visitor.");
        }
    }

    [Fact]
    public async Task Helsinki_has_the_sauna_the_families_and_company_for_the_presenters_week()
    {
        using var t = await Seeded();
        var mine = Seed.People.Single(p => p.Key == Seed.Presenter).Trips.Single(x => x.City == "Helsinki");
        var (from, to) = (Trip.Today.AddDays(mine.From), Trip.Today.AddDays(mine.To));

        var cards = await Search(t, "Helsinki");
        Assert.Contains(cards, c => c.Id == DemoSeed.IdOf("aino"));
        Assert.True(cards.Count(c => c.Trip is { } trip && trip.From <= to && trip.To >= from) >= 2);

        var families = (await Search(t, "Helsinki", Lifestyle.Family)).Select(c => c.Id).ToList();
        Assert.Superset(new[] { "laura", "antti", "marta", "pablo" }.Select(DemoSeed.IdOf).ToHashSet(), families.ToHashSet());
    }
}

/// The same reset on the real database: the advisory lock, the cascades the migrations created and
/// Npgsql's insistence on UTC timestamps are not exercised by SQLite.
[Trait("Category", "Integration")]
public class DemoResetPostgresTests(PostgresFixture postgres) : IClassFixture<PostgresFixture>
{
    [Fact]
    public async Task Two_resets_on_Postgres_leave_one_cast()
    {
        for (var i = 0; i < 2; i++)
        {
            await using var db = new LocalBuddyDbContext(postgres.Options);
            using var identity = new TestIdentity(db);
            await new DemoSeeder(db, identity.Users, new MemoryPhotos(),
                    new DemoOptions { ResetEnabled = true, AccountPassword = "a-test-only-demo-password" }, NullLogger<DemoSeeder>.Instance)
                .ResetAsync(Trip.Today, DateTime.UtcNow);
        }

        await using var check = new LocalBuddyDbContext(postgres.Options);
        var ids = DemoSeed.Current.People.Select(p => DemoSeed.IdOf(p.Key)).ToList();
        Assert.Equal(ids.Count, await check.Users.CountAsync(u => ids.Contains(u.Id)));
        Assert.Equal(DemoSeed.Current.Matches.Sum(m => m.Messages.Count),
                     await check.Messages.CountAsync(m => ids.Contains(m.SenderId)));
    }
}

/// Like the moderator seed, the boot seed may fail without taking the app down with it.
public class DemoBootTests(WebApplicationFactory<Program> app) : IClassFixture<WebApplicationFactory<Program>>
{
    [Fact]
    public void A_boot_seed_that_cannot_reach_the_database_does_not_stop_the_app()
    {
        using var host = app.WithWebHostBuilder(b => b
            .UseSetting("Demo:ResetEnabled", "true")
            .UseSetting("Demo:AccountPassword", "a-test-only-demo-password")
            // Nothing listens on port 1: the seed fails at once instead of touching a real database.
            .UseSetting("ConnectionStrings:Default", "Host=127.0.0.1;Port=1;Database=unused;Timeout=3"));

        Assert.True(host.Services.GetRequiredService<DemoOptions>().ResetEnabled);
    }
}

/// Keeps what is saved in memory, so a test can see which files a reset leaves behind.
file class MemoryPhotos : IPhotoStorage
{
    public readonly Dictionary<string, byte[]> Files = [];

    public async Task<string> SaveJpegAsync(Stream jpeg, CancellationToken ct = default)
    {
        var copy = new MemoryStream();
        await jpeg.CopyToAsync(copy, ct);
        var key = $"/uploads/{Guid.NewGuid():N}.jpg";
        Files[key] = copy.ToArray();
        return key;
    }

    public Task<Stream?> OpenReadAsync(string key, CancellationToken ct = default) =>
        Task.FromResult<Stream?>(Files.TryGetValue(key, out var bytes) ? new MemoryStream(bytes) : null);

    public Task DeleteAsync(string key, CancellationToken ct = default)
    {
        Files.Remove(key);
        return Task.CompletedTask;
    }
}
