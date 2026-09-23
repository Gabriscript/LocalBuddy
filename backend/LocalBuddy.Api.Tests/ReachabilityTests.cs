using LocalBuddy.Api.Controllers;
using LocalBuddy.Api.Data;
using LocalBuddy.Api.Dtos;
using LocalBuddy.Api.Models;
using LocalBuddy.Api.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;

namespace LocalBuddy.Api.Tests;

/// Who may still reach whom once a block, a ban or a missing verification is involved.
/// Every test here was a confirmed hole in the review of 2026-09-22.
public class ReachabilityTests
{
    static async Task<Guid> Chat(TestDb t, Guid a, Guid b, bool bothWrote = false)
    {
        var c = new Conversation { Id = Guid.CreateVersion7(), UserAId = a, UserBId = b };
        t.Db.Conversations.Add(c);
        if (bothWrote)
            t.Db.Messages.AddRange(
                new Message { Id = Guid.CreateVersion7(), ConversationId = c.Id, SenderId = a, Content = "ciao" },
                new Message { Id = Guid.CreateVersion7(), ConversationId = c.Id, SenderId = b, Content = "ciao!" });
        await t.Db.SaveChangesAsync();
        return c.Id;
    }

    static async Task Block(TestDb t, Guid blocker, Guid blocked)
    {
        t.Db.Blocks.Add(new Block { Id = Guid.NewGuid(), BlockerId = blocker, BlockedId = blocked });
        await t.Db.SaveChangesAsync();
    }

    static async Task Ban(TestDb t, Guid id)
    {
        (await t.Db.Users.FindAsync(id))!.BannedAt = DateTime.UtcNow;
        await t.Db.SaveChangesAsync();
    }

    static string? Code(IActionResult result) =>
        (Assert.IsType<ObjectResult>(result).Value as ProblemDetails)?.Extensions["code"]?.ToString();

    static PaymentsController Payments(TestDb t, Guid caller) =>
        new PaymentsController(t.Db, new FakePaymentGateway(), new ConversationService(t.Db)).As(caller);

    // ---- Blocks ----------------------------------------------------------------------------

    [Fact]
    public async Task A_block_stops_messages_in_both_directions()
    {
        using var t = new TestDb();
        var (anna, bruno) = (t.AddVerifiedUser("anna"), t.AddVerifiedUser("bruno"));
        var chat = await Chat(t, anna, bruno);
        await Block(t, anna, bruno);

        Assert.Equal("blocked", Code(await new ConversationsController(t.Db).As(bruno).Send(chat, new SendMessage("ancora qui"))));
        Assert.Equal("blocked", Code(await new ConversationsController(t.Db).As(anna).Send(chat, new SendMessage("ciao"))));
        Assert.Equal(0, await t.Db.Messages.CountAsync());
    }

    [Fact]
    public async Task A_blocked_chat_leaves_both_inboxes()
    {
        using var t = new TestDb();
        var (anna, bruno, carla) = (t.AddVerifiedUser("anna"), t.AddVerifiedUser("bruno"), t.AddVerifiedUser("carla"));
        await Chat(t, anna, bruno);
        var kept = await Chat(t, anna, carla);
        await Block(t, bruno, anna);

        var annas = (await new ConversationsController(t.Db).As(anna).List()).Value!;
        var brunos = (await new ConversationsController(t.Db).As(bruno).List()).Value!;
        Assert.Equal([kept], annas.Items.Select(c => c.Id));
        Assert.Empty(brunos.Items);
    }

    /// The chat screen asks for its one conversation rather than scanning the paged inbox for
    /// it. Everything the screen hangs off that answer — the other member's name, and the
    /// report and block controls — used to vanish once the inbox grew past its first page.
    [Fact]
    public async Task One_conversation_is_reachable_without_walking_the_inbox()
    {
        using var t = new TestDb();
        var (anna, bruno, carla) = (t.AddVerifiedUser("anna"), t.AddVerifiedUser("bruno"), t.AddVerifiedUser("carla"));
        var chat = await Chat(t, anna, bruno);

        var mine = (await new ConversationsController(t.Db).As(anna).One(chat)).Value!;
        Assert.Equal(bruno, mine.OtherUserId);

        // Whichever side asks, the other member is the one they are not.
        var theirs = (await new ConversationsController(t.Db).As(bruno).One(chat)).Value!;
        Assert.Equal(anna, theirs.OtherUserId);

        // A stranger is refused rather than told whether the conversation exists.
        Assert.IsType<ForbidResult>((await new ConversationsController(t.Db).As(carla).One(chat)).Result);
    }

    [Fact]
    public async Task A_blocked_conversation_cannot_be_fetched_one_by_one_either()
    {
        using var t = new TestDb();
        var (anna, bruno) = (t.AddVerifiedUser("anna"), t.AddVerifiedUser("bruno"));
        var chat = await Chat(t, anna, bruno);
        await Block(t, bruno, anna);

        // It left both inboxes; fetching it directly must not be the way back in.
        Assert.IsType<NotFoundResult>((await new ConversationsController(t.Db).As(anna).One(chat)).Result);
        Assert.IsType<NotFoundResult>((await new ConversationsController(t.Db).As(bruno).One(chat)).Result);
    }

    [Fact]
    public async Task A_block_rules_out_a_review()
    {
        using var t = new TestDb();
        var (anna, fabio) = (t.AddVerifiedUser("anna"), t.AddVerifiedUser("fabio"));
        await Chat(t, anna, fabio, bothWrote: true);
        await Block(t, fabio, anna);

        Assert.Equal("blocked", Code(await new ReviewsController(t.Db).As(anna).Create(new NewReview(fabio, 1, "pessimo"))));
    }

    // ---- Reviews need a real exchange -----------------------------------------------------

    [Fact]
    public async Task A_paid_unlock_alone_does_not_earn_the_right_to_review()
    {
        using var t = new TestDb();
        var (anna, fabio) = (t.AddVerifiedUser("anna"), t.AddVerifiedUser("fabio"));
        await Payments(t, anna).Unlock(fabio);   // fabio never answers

        Assert.Equal("no_exchange", Code(await new ReviewsController(t.Db).As(anna).Create(new NewReview(fabio, 1, "pessimo"))));
    }

    [Fact]
    public async Task Once_both_have_written_a_review_goes_through_and_rewards_the_host()
    {
        using var t = new TestDb();
        var (guest, host) = (t.AddVerifiedUser("guest"), t.AddVerifiedUser("host"));
        t.Db.Listings.Add(new Listing { Id = Guid.NewGuid(), UserId = host, OffersExperience = true });
        await Chat(t, guest, host, bothWrote: true);

        Assert.IsType<CreatedResult>(await new ReviewsController(t.Db).As(guest).Create(new NewReview(host, 5, "splendido")));
        Assert.Equal(Pricing.HostReviewReward,
            await t.Db.Users.Where(u => u.Id == host).Select(u => u.CreditsBalance).SingleAsync());
    }

    // ---- Unlocks ---------------------------------------------------------------------------

    [Fact]
    public async Task A_banned_member_cannot_be_unlocked_or_charged_for()
    {
        using var t = new TestDb();
        var (anna, elena) = (t.AddVerifiedUser("anna"), t.AddVerifiedUser("elena"));
        await Ban(t, elena);

        Assert.IsType<NotFoundResult>(await Payments(t, anna).Unlock(elena));
        Assert.Equal(0, await t.Db.Payments.CountAsync());
    }

    [Fact]
    public async Task An_unverified_member_cannot_be_unlocked_or_charged_for()
    {
        using var t = new TestDb();
        var (anna, ghost) = (t.AddVerifiedUser("anna"), t.AddUser("never-verifies"));

        Assert.Equal("target_not_verified", Code(await Payments(t, anna).Unlock(ghost)));
        Assert.Equal(0, await t.Db.Payments.CountAsync());
    }

    [Fact]
    public async Task The_last_credit_pays_for_one_unlock_and_is_gone()
    {
        using var t = new TestDb();
        var (anna, bruno, carla) = (t.AddVerifiedUser("anna"), t.AddVerifiedUser("bruno"), t.AddVerifiedUser("carla"));
        (await t.Db.Users.FindAsync(anna))!.CreditsBalance = 1;
        await t.Db.SaveChangesAsync();

        var first = Assert.IsType<CreatedResult>(await Payments(t, anna).Unlock(bruno));
        var second = Assert.IsType<CreatedResult>(await Payments(t, anna).Unlock(carla));

        Assert.Equal("credits", Assert.IsType<UnlockResult>(first.Value).Charged);
        Assert.Equal("one-time", Assert.IsType<UnlockResult>(second.Value).Charged);
    }

    [Fact]
    public async Task Interest_in_a_banned_member_is_refused()
    {
        using var t = new TestDb();
        var (anna, elena) = (t.AddVerifiedUser("anna"), t.AddVerifiedUser("elena"));
        await Ban(t, elena);

        var result = await new MatchesController(t.Db, new ConversationService(t.Db)).As(anna).Interest(elena);
        Assert.IsType<NotFoundResult>(result);
    }

    // ---- Bans ------------------------------------------------------------------------------

    [Fact]
    public async Task A_ban_takes_down_every_account_of_the_same_person()
    {
        using var t = new TestDb();
        var (main, spare, stranger, moderator) =
            (t.AddUser("main"), t.AddUser("spare"), t.AddUser("stranger"), t.AddUser("mod"));
        foreach (var (id, hash) in new[] { (main, "person-A"), (spare, "person-A"), (stranger, "person-B") })
            (await t.Db.Users.FindAsync(id))!.IdentitySubjectHash = hash;
        await t.Db.SaveChangesAsync();

        await new ModerationController(t.Db, NullLogger<ModerationController>.Instance).As(moderator)
            .Ban(main, new BanRequest("rules"));

        var banned = await t.Db.Users.AsNoTracking().Where(u => u.BannedAt != null).Select(u => u.Id).ToListAsync();
        Assert.Equal(new[] { main, spare }.Order(), banned.Order());
    }

    [Fact]
    public async Task A_banned_profile_is_not_found()
    {
        using var t = new TestDb();
        var (viewer, elena) = (t.AddUser("viewer"), t.AddUser("elena"));
        await Ban(t, elena);

        var result = await new UsersController(t.Db, new FakeIdentityVerifier(), new NoStorage()).As(viewer).GetById(elena);
        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task Home_photos_leave_the_profile_when_overnight_is_switched_off()
    {
        using var t = new TestDb();
        var host = t.AddUser("host");
        t.Db.Listings.Add(new Listing { Id = Guid.NewGuid(), UserId = host, OffersOvernight = false });
        t.Db.Photos.AddRange(
            new Photo { Id = Guid.NewGuid(), UserId = host, Type = PhotoType.Home, Url = "/uploads/home.jpg" },
            new Photo { Id = Guid.NewGuid(), UserId = host, Type = PhotoType.Profile, Url = "/uploads/face.jpg" });
        await t.Db.SaveChangesAsync();

        var profile = (await new UsersController(t.Db, new FakeIdentityVerifier(), new NoStorage())
            .As(t.AddUser("viewer")).GetById(host)).Value!;
        Assert.Equal([PhotoType.Profile], profile.Photos.Select(p => p.Type));
    }

    // ---- Tokens that outlive their account -------------------------------------------------

    [Fact]
    public async Task A_deleted_accounts_token_is_refused()
    {
        using var t = new TestDb();
        var passedThrough = false;
        var middleware = new BanEnforcementMiddleware(_ => { passedThrough = true; return Task.CompletedTask; });
        var http = new DefaultHttpContext
        {
            User = TestCaller.For(Guid.NewGuid()),
            RequestServices = new ServiceCollection().AddLogging().BuildServiceProvider()
        };
        http.Response.Body = new MemoryStream();

        await middleware.InvokeAsync(http, t.Db);

        Assert.False(passedThrough);
        Assert.Equal(StatusCodes.Status401Unauthorized, http.Response.StatusCode);
    }
}

file class NoStorage : IPhotoStorage
{
    public Task<string> SaveJpegAsync(Stream jpeg, CancellationToken ct = default) => Task.FromResult("");
    public Task<Stream?> OpenReadAsync(string key, CancellationToken ct = default) => Task.FromResult<Stream?>(null);
    public Task DeleteAsync(string key, CancellationToken ct = default) => Task.CompletedTask;
}
