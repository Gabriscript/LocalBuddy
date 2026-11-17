using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using LocalBuddy.Api.Controllers;
using LocalBuddy.Api.Data;
using LocalBuddy.Api.Dtos;
using LocalBuddy.Api.Models;
using LocalBuddy.Api.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace LocalBuddy.Api.Tests;

/// The note sent with a request (ADR-0015): stored with the request, shown to the person asked
/// and nobody else, and the first message of the chat a yes opens.
public class NoteTests
{
    static MatchesController Matches(TestDb t, Guid caller) =>
        new MatchesController(t.Db, new ConversationService(t.Db), TestPush.For(t.Db)).As(caller);

    static Task<IActionResult> Ask(TestDb t, Guid from, Guid to, string? note) =>
        Matches(t, from).Interest(to, new InterestRequest(note));

    static async Task<ProfileCard> RequestFrom(TestDb t, Guid me, Guid asker) =>
        (await Matches(t, me).Requests()).Value!.Items.Single(c => c.Id == asker);

    static string? Code(IActionResult result) =>
        (Assert.IsType<ObjectResult>(result).Value as ProblemDetails)?.Extensions["code"]?.ToString();

    [Fact]
    public async Task The_person_asked_sees_the_note_trimmed()
    {
        using var t = new TestDb();
        var (anna, bruno) = (t.AddVerifiedUser("anna"), t.AddVerifiedUser("bruno"));

        Assert.IsType<OkObjectResult>(await Ask(t, bruno, anna, "  Coffee by the canal?  \n"));

        Assert.Equal("Coffee by the canal?", (await RequestFrom(t, anna, bruno)).Note);
    }

    [Fact]
    public async Task Without_a_body_the_request_has_no_note()
    {
        using var t = new TestDb();
        var (anna, bruno) = (t.AddVerifiedUser("anna"), t.AddVerifiedUser("bruno"));

        Assert.IsType<OkObjectResult>(await Matches(t, bruno).Interest(anna));

        Assert.Null((await RequestFrom(t, anna, bruno)).Note);
        Assert.Null((await t.Db.Matches.SingleAsync()).Note);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   \n\t ")]
    public async Task An_empty_note_is_no_note(string? note)
    {
        using var t = new TestDb();
        var (anna, bruno) = (t.AddVerifiedUser("anna"), t.AddVerifiedUser("bruno"));

        Assert.IsType<OkObjectResult>(await Ask(t, bruno, anna, note));

        Assert.Null((await t.Db.Matches.SingleAsync()).Note);
        Assert.Null((await RequestFrom(t, anna, bruno)).Note);
    }

    [Fact]
    public async Task A_note_of_the_maximum_length_is_kept_whole_and_padding_does_not_count()
    {
        using var t = new TestDb();
        var (anna, bruno) = (t.AddVerifiedUser("anna"), t.AddVerifiedUser("bruno"));
        var note = new string('a', Limits.Note);

        Assert.IsType<OkObjectResult>(await Ask(t, bruno, anna, $"  {note}  "));

        Assert.Equal(note, (await RequestFrom(t, anna, bruno)).Note);
    }

    [Fact]
    public async Task A_note_one_character_too_long_is_refused_and_nothing_is_asked()
    {
        using var t = new TestDb();
        var (anna, bruno) = (t.AddVerifiedUser("anna"), t.AddVerifiedUser("bruno"));

        var result = await Ask(t, bruno, anna, new string('a', Limits.Note + 1));

        Assert.Equal(StatusCodes.Status400BadRequest, Assert.IsType<ObjectResult>(result).StatusCode);
        Assert.Equal("invalid_request", Code(result));
        Assert.Equal(0, await t.Db.Matches.CountAsync());
    }

    /// Discovery, the asker's sent list and the asker's own requests never carry it.
    [Fact]
    public async Task Nobody_but_the_person_asked_sees_the_note()
    {
        using var t = new TestDb();
        var (anna, bruno, carla) = (t.AddVerifiedUser("anna"), t.AddVerifiedUser("bruno"), t.AddVerifiedUser("carla"));
        await Ask(t, bruno, anna, "Hello Anna");

        var discovery = new List<ProfileCard>();
        foreach (var me in new[] { anna, bruno, carla })
            discovery.AddRange((await new DiscoveryController(t.Db).As(me)
                .Search("Milano", null, null, null, null, null, null)).Value!.Items);
        Assert.Contains(discovery, c => c.Id == bruno);
        Assert.All(discovery, c => Assert.Null(c.Note));

        var sent = (await Matches(t, bruno).Sent()).Value!.Items;
        Assert.Equal([anna], sent.Select(c => c.Id));
        Assert.All(sent, c => Assert.Null(c.Note));
        Assert.Empty((await Matches(t, bruno).Requests()).Value!.Items);
        Assert.Empty((await Matches(t, carla).Requests()).Value!.Items);

        // Nor does the JSON of a card that has none.
        var json = JsonSerializer.Serialize(sent[0], new JsonSerializerOptions(JsonSerializerDefaults.Web));
        Assert.DoesNotContain("Hello Anna", json);
    }

    [Fact]
    public async Task A_yes_opens_the_chat_with_the_note_as_the_askers_first_message()
    {
        using var t = new TestDb();
        var (anna, bruno) = (t.AddVerifiedUser("anna"), t.AddVerifiedUser("bruno"));
        await Ask(t, bruno, anna, "Sauna on Friday?");

        // My own note on a yes is ignored: the chat opens from their request.
        var yes = Assert.IsType<CreatedResult>(await Ask(t, anna, bruno, "Yes please!"));
        var chat = Assert.IsType<InterestResult>(yes.Value).ConversationId!.Value;

        var message = await t.Db.Messages.SingleAsync();
        Assert.Equal((chat, bruno, "Sauna on Friday?"), (message.ConversationId, message.SenderId, message.Content));
        Assert.Null((await t.Db.Matches.SingleAsync(m => m.InitiatorId == anna)).Note);

        var conversations = new ConversationsController(t.Db, TestPush.For(t.Db));
        var mine = (await conversations.As(anna).One(chat)).Value!;
        Assert.Equal(("Sauna on Friday?", 1), (mine.LastMessage, mine.UnreadCount));
        Assert.Equal(0, (await conversations.As(bruno).One(chat)).Value!.UnreadCount);
    }

    [Fact]
    public async Task A_yes_to_a_request_without_a_note_opens_an_empty_chat()
    {
        using var t = new TestDb();
        var (anna, bruno) = (t.AddVerifiedUser("anna"), t.AddVerifiedUser("bruno"));
        await Matches(t, bruno).Interest(anna);

        Assert.IsType<CreatedResult>(await Ask(t, anna, bruno, "Hi!"));

        Assert.Equal(1, await t.Db.Conversations.CountAsync());
        Assert.Equal(0, await t.Db.Messages.CountAsync());
    }

    [Fact]
    public async Task A_note_changes_none_of_the_rules_about_who_can_be_asked()
    {
        using var t = new TestDb();
        var (anna, bruno, carla, dario) =
            (t.AddVerifiedUser("anna"), t.AddVerifiedUser("bruno"), t.AddVerifiedUser("carla"), t.AddVerifiedUser("dario"));
        t.Db.Blocks.Add(new Block { Id = Guid.NewGuid(), BlockerId = carla, BlockedId = anna });
        (await t.Db.Users.FindAsync(dario))!.BannedAt = DateTime.UtcNow;
        await t.Db.SaveChangesAsync();

        Assert.Equal("self_target", Code(await Ask(t, anna, anna, "me")));
        Assert.Equal("blocked", Code(await Ask(t, anna, carla, "hi")));
        Assert.IsType<NotFoundResult>(await Ask(t, anna, dario, "hi"));
        Assert.IsType<OkObjectResult>(await Ask(t, anna, bruno, "first"));
        Assert.Equal("already_responded", Code(await Ask(t, anna, bruno, "second")));

        Assert.Equal("first", (await t.Db.Matches.SingleAsync()).Note);
    }

    // ---- The trip on a request: why they are asking, even without a note ---------------------

    static void AddTrip(TestDb t, Guid who, string city, int from, int to) =>
        t.Db.Trips.Add(new Trip
        {
            Id = Guid.CreateVersion7(), UserId = who, City = city,
            From = Trip.Today.AddDays(from), To = Trip.Today.AddDays(to)
        });

    [Fact]
    public async Task A_request_carries_the_askers_trip_to_my_city_or_to_one_I_am_visiting()
    {
        using var t = new TestDb();
        // Everybody lives in Milano (TestDb); anna, the person asked, is going to Helsinki.
        var anna = t.AddVerifiedUser("anna");
        var (bruno, carla, dario, elena) =
            (t.AddVerifiedUser("bruno"), t.AddVerifiedUser("carla"), t.AddVerifiedUser("dario"), t.AddVerifiedUser("elena"));
        foreach (var who in new[] { bruno, carla, dario, elena })
            (await t.Db.Users.FindAsync(who))!.City = "Sevilla";
        AddTrip(t, anna, "Helsinki", 2, 5);
        AddTrip(t, bruno, "Roma", 1, 3);       // unrelated, and earlier than the one that counts
        AddTrip(t, bruno, "milano", 10, 12);   // my city, matched whatever the case
        AddTrip(t, carla, "Helsinki", 0, 8);   // a city I am visiting too
        AddTrip(t, dario, "Roma", 1, 4);       // unrelated
        AddTrip(t, elena, "Milano", -6, -1);   // over
        await t.Db.SaveChangesAsync();
        foreach (var who in new[] { bruno, carla, dario, elena }) await Matches(t, who).Interest(anna);

        var cards = (await Matches(t, anna).Requests()).Value!.Items.ToDictionary(c => c.Id);

        Assert.Equal(new PublicTrip("milano", Trip.Today.AddDays(10), Trip.Today.AddDays(12)), cards[bruno].Trip);
        Assert.Equal(new PublicTrip("Helsinki", Trip.Today, Trip.Today.AddDays(8)), cards[carla].Trip);
        Assert.Null(cards[dario].Trip);
        Assert.Null(cards[elena].Trip);
    }

    [Fact]
    public async Task Of_two_trips_that_count_the_earliest_is_shown()
    {
        using var t = new TestDb();
        var (anna, bruno) = (t.AddVerifiedUser("anna"), t.AddVerifiedUser("bruno"));
        (await t.Db.Users.FindAsync(bruno))!.City = "Sevilla";
        AddTrip(t, anna, "Helsinki", 20, 25);
        AddTrip(t, bruno, "Helsinki", 21, 24);
        AddTrip(t, bruno, "Milano", 3, 6);
        await t.Db.SaveChangesAsync();
        await Matches(t, bruno).Interest(anna);

        Assert.Equal("Milano", (await RequestFrom(t, anna, bruno)).Trip?.City);
        // The sent list stays as it was: no trip, no note.
        Assert.Null((await Matches(t, bruno).Sent()).Value!.Items.Single().Trip);
    }
}

/// Over HTTP, because the binding is the risk: apps that predate the note send no body and no
/// content type at all, and must get exactly the answer they got before.
public class InterestBodyTests(WebApplicationFactory<Program> app) : IClassFixture<WebApplicationFactory<Program>>
{
    [Fact]
    public async Task No_body_a_json_note_and_a_note_too_long_all_bind()
    {
        using var connection = new SqliteConnection("Filename=:memory:");
        connection.Open();
        using var host = app.WithWebHostBuilder(b => b.ConfigureTestServices(s =>
        {
            s.RemoveAll<DbContextOptions<LocalBuddyDbContext>>();
            s.RemoveAll<IDbContextOptionsConfiguration<LocalBuddyDbContext>>();
            s.AddDbContext<LocalBuddyDbContext>(o => o.UseSqlite(connection));
        }));

        Guid anna, bruno, carla, dario;
        using (var scope = host.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<LocalBuddyDbContext>();
            db.Database.EnsureCreated();
            Guid Add(string name)
            {
                var user = new User
                {
                    Id = Guid.NewGuid(), UserName = $"{name}@test.local", Email = $"{name}@test.local",
                    Name = name, City = "Milano", IdentityVerified = true, SecurityStamp = Guid.NewGuid().ToString()
                };
                db.Users.Add(user);
                return user.Id;
            }
            (anna, bruno, carla, dario) = (Add("anna"), Add("bruno"), Add("carla"), Add("dario"));
            db.SaveChanges();
        }

        var client = host.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer",
            host.Services.GetRequiredService<TokenService>().Create(new User { Id = anna }, []));

        var bare = await client.PostAsync($"/api/v1/users/{bruno}/interest", null);
        Assert.Equal(HttpStatusCode.OK, bare.StatusCode);
        Assert.Equal(new InterestResult(false, null), await bare.Content.ReadFromJsonAsync<InterestResult>());

        var noted = await client.PostAsJsonAsync($"/api/v1/users/{carla}/interest", new { note = " Hello Carla " });
        Assert.Equal(HttpStatusCode.OK, noted.StatusCode);

        var tooLong = await client.PostAsJsonAsync($"/api/v1/users/{dario}/interest", new { note = new string('a', Limits.Note + 1) });
        Assert.Equal(HttpStatusCode.BadRequest, tooLong.StatusCode);
        var problem = await tooLong.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("invalid_request", problem.GetProperty("code").GetString());

        using (var scope = host.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<LocalBuddyDbContext>();
            var notes = await db.Matches.ToDictionaryAsync(m => m.TargetId, m => m.Note);
            Assert.Equal(2, notes.Count);
            Assert.Null(notes[bruno]);
            Assert.Equal("Hello Carla", notes[carla]);
        }
    }
}
