using System.ComponentModel.DataAnnotations;
using LocalBuddy.Api.Controllers;
using LocalBuddy.Api.Data;
using LocalBuddy.Api.Dtos;
using LocalBuddy.Api.Models;
using LocalBuddy.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;

namespace LocalBuddy.Api.Tests;

/// ADR-0012: who gets a push, where a tap leads, and that a push never costs the request.
public class PushTests
{
    static readonly FakePushSender Unused = new(NullLogger<FakePushSender>.Instance);

    static UsersController Users(TestDb t, Guid caller) => new UsersController(t.Db, null!, new NoFiles()).As(caller);

    static MatchesController Matches(TestDb t, Guid caller, IPushSender sender) =>
        new MatchesController(t.Db, new ConversationService(t.Db), TestPush.For(t.Db, sender)).As(caller);

    static ConversationsController Chats(TestDb t, Guid caller, IPushSender sender) =>
        new ConversationsController(t.Db, TestPush.For(t.Db, sender)).As(caller);

    static string Token(string name) => $"ExponentPushToken[{name}]";

    static async Task<Guid> Member(TestDb t, string name, string language = "en")
    {
        var id = t.AddVerifiedUser(name);
        Assert.IsType<NoContentResult>(await Users(t, id).RegisterPushToken(new PushTokenRegistration(Token(name), language)));
        return id;
    }

    [Fact]
    public async Task A_token_is_registered_moved_to_the_last_account_and_removed_idempotently()
    {
        using var t = new TestDb();
        var anna = await Member(t, "anna");
        var bruno = t.AddUser("bruno");

        // Same phone, bruno signs in: the token is his now, with his language.
        await Users(t, bruno).RegisterPushToken(new PushTokenRegistration(Token("anna"), "it"));
        var row = await t.Db.PushTokens.SingleAsync();
        Assert.Equal((bruno, "it"), (row.UserId, row.Language));

        // Anna cannot remove what is no longer hers; bruno can, twice.
        await Users(t, anna).RemovePushToken(new PushTokenRemoval(Token("anna")));
        Assert.Equal(1, await t.Db.PushTokens.CountAsync());
        Assert.IsType<NoContentResult>(await Users(t, bruno).RemovePushToken(new PushTokenRemoval(Token("anna"))));
        Assert.IsType<NoContentResult>(await Users(t, bruno).RemovePushToken(new PushTokenRemoval(Token("anna"))));
        Assert.Equal(0, await t.Db.PushTokens.CountAsync());
    }

    [Theory]
    [InlineData("ExponentPushToken[abc-123_X]", "en", true)]
    [InlineData("ExpoPushToken[abc]", "de", true)]
    [InlineData("not-a-token", "en", false)]
    [InlineData("ExponentPushToken[a b]", "en", false)]
    [InlineData("ExponentPushToken[abc]", "pt", false)]
    [InlineData("ExponentPushToken[abc]", "EN", false)]
    public void Only_expo_tokens_and_the_apps_languages_validate(string token, string language, bool valid)
    {
        // The attributes sit on the record's parameters, which is where MVC validation reads them.
        var ok = typeof(PushTokenRegistration).GetConstructors().Single().GetParameters()
            .Zip([token, language])
            .All(p => p.First.GetCustomAttributes(true).OfType<ValidationAttribute>().All(a => a.IsValid(p.Second)));
        Assert.Equal(valid, ok);
    }

    [Fact]
    public async Task A_request_reaches_the_target_and_a_match_the_one_who_asked_first()
    {
        using var t = new TestDb();
        var (anna, bruno) = (await Member(t, "anna"), await Member(t, "bruno", "it"));
        var sent = new FakePushSender(NullLogger<FakePushSender>.Instance);

        await Matches(t, anna, sent).Interest(bruno);
        var request = Assert.Single(sent.Sent);
        Assert.Equal((Token("bruno"), "/requests"), (request.To, request.Url));
        Assert.Equal("anna vorrebbe conoscerti.", request.Body); // bruno's language, anna's name

        sent.Sent.Clear();
        await Matches(t, bruno, sent).Interest(anna);
        var match = Assert.Single(sent.Sent);
        var chat = await t.Db.Conversations.SingleAsync();
        Assert.Equal((Token("anna"), $"/chat/{chat.Id}"), (match.To, match.Url));
    }

    [Fact]
    public async Task Nobody_hears_of_a_request_they_already_passed_on()
    {
        using var t = new TestDb();
        var (anna, bruno) = (await Member(t, "anna"), await Member(t, "bruno"));
        var sent = new FakePushSender(NullLogger<FakePushSender>.Instance);

        await Matches(t, bruno, Unused).Pass(anna);
        await Matches(t, anna, sent).Interest(bruno);

        Assert.Empty(sent.Sent);
    }

    [Fact]
    public async Task Only_the_first_unread_message_pushes_until_the_chat_is_read()
    {
        using var t = new TestDb();
        var (anna, bruno) = (await Member(t, "anna"), await Member(t, "bruno"));
        await Matches(t, anna, Unused).Interest(bruno);
        await Matches(t, bruno, Unused).Interest(anna);
        var chat = (await t.Db.Conversations.SingleAsync()).Id;
        var sent = new FakePushSender(NullLogger<FakePushSender>.Instance);

        await Chats(t, anna, sent).Send(chat, new SendMessage("ciao"));
        await Chats(t, anna, sent).Send(chat, new SendMessage("ci sei?"));
        var first = Assert.Single(sent.Sent);
        Assert.Equal((Token("bruno"), $"/chat/{chat}"), (first.To, first.Url));
        Assert.DoesNotContain("ciao", first.Body); // never the content

        await Chats(t, bruno, Unused).Read(chat);
        await Chats(t, anna, sent).Send(chat, new SendMessage("a dopo"));
        Assert.Equal(2, sent.Sent.Count);
    }

    [Fact]
    public async Task A_message_sent_at_the_same_moment_does_not_silence_the_push()
    {
        using var t = new TestDb();
        var (anna, bruno) = (await Member(t, "anna"), await Member(t, "bruno"));
        await Matches(t, anna, Unused).Interest(bruno);
        await Matches(t, bruno, Unused).Interest(anna);
        var chat = (await t.Db.Conversations.SingleAsync()).Id;
        // Anna's other phone, committed just before but stamped later: it is not earlier.
        t.Db.Messages.Add(new Message { Id = Guid.CreateVersion7(DateTimeOffset.UtcNow.AddSeconds(1)), SentAt = DateTime.UtcNow.AddSeconds(1), ConversationId = chat, SenderId = anna, Content = "eccomi" });
        await t.Db.SaveChangesAsync();
        var sent = new FakePushSender(NullLogger<FakePushSender>.Instance);

        await Chats(t, anna, sent).Send(chat, new SendMessage("ciao"));

        Assert.Single(sent.Sent);
    }

    [Fact]
    public async Task A_banned_member_gets_no_push()
    {
        using var t = new TestDb();
        var (anna, bruno) = (await Member(t, "anna"), await Member(t, "bruno"));
        var sent = new FakePushSender(NullLogger<FakePushSender>.Instance);
        (await t.Db.Users.FindAsync(bruno))!.BannedAt = DateTime.UtcNow;
        await t.Db.SaveChangesAsync();

        await TestPush.For(t.Db, sent).NotifyAsync(bruno, anna, PushKind.Request, "/requests");
        Assert.Empty(sent.Sent);

        await TestPush.For(t.Db, sent).NotifyAsync(anna, bruno, PushKind.Request, "/requests");
        Assert.Single(sent.Sent); // control: a member in good standing still gets it
    }

    [Fact]
    public async Task A_failing_push_does_not_fail_the_request()
    {
        using var t = new TestDb();
        var (anna, bruno) = (await Member(t, "anna"), await Member(t, "bruno"));

        var result = await Matches(t, anna, new Throwing()).Interest(bruno);

        Assert.IsType<OkObjectResult>(result);
        Assert.Equal(1, await t.Db.Matches.CountAsync());
    }

    [Fact]
    public async Task A_token_the_service_no_longer_knows_is_dropped()
    {
        using var t = new TestDb();
        var (anna, bruno) = (await Member(t, "anna"), await Member(t, "bruno"));

        await Matches(t, anna, new Unregistered()).Interest(bruno);

        Assert.Equal([Token("anna")], await t.Db.PushTokens.Select(x => x.Token).ToListAsync());
    }

    [Fact]
    public async Task Erasure_removes_the_tokens()
    {
        using var t = new TestDb();
        var anna = await Member(t, "anna");

        Assert.IsType<NoContentResult>(await Users(t, anna).DeleteMe());

        Assert.Equal(0, await t.Db.PushTokens.CountAsync());
    }

    sealed class Throwing : IPushSender
    {
        public Task<IReadOnlyList<string>> SendAsync(IReadOnlyList<PushMessage> messages, CancellationToken cancellationToken)
            => throw new HttpRequestException("exp.host is down");
    }

    sealed class Unregistered : IPushSender
    {
        public Task<IReadOnlyList<string>> SendAsync(IReadOnlyList<PushMessage> messages, CancellationToken cancellationToken)
            => Task.FromResult<IReadOnlyList<string>>(messages.Select(m => m.To).ToList());
    }

    sealed class NoFiles : IPhotoStorage
    {
        public Task<string> SaveJpegAsync(Stream jpeg, CancellationToken ct = default) => throw new NotSupportedException();
        public Task<Stream?> OpenReadAsync(string key, CancellationToken ct = default) => throw new NotSupportedException();
        public Task DeleteAsync(string key, CancellationToken ct = default) => Task.CompletedTask;
    }
}

/// The earlier-message check compares timestamps and uuids; this runs it on the real database.
[Trait("Category", "Integration")]
public class PushPostgresTests(PostgresFixture postgres) : IClassFixture<PostgresFixture>
{
    [Fact]
    public async Task Only_earlier_messages_hold_back_the_push_on_Postgres()
    {
        await using var db = new LocalBuddyDbContext(postgres.Options);
        User Member(string name) => new() { Id = Guid.CreateVersion7(), UserName = $"{name}-{Guid.NewGuid()}", Email = $"{name}@test.local", Name = name, IdentityVerified = true };
        var (anna, bruno) = (Member("anna"), Member("bruno"));
        var chat = new Conversation { Id = Guid.CreateVersion7(), UserAId = anna.Id, UserBId = bruno.Id };
        db.Users.AddRange(anna, bruno);
        db.Conversations.Add(chat);
        db.PushTokens.Add(new PushToken { Id = Guid.CreateVersion7(), UserId = bruno.Id, Token = $"ExponentPushToken[{bruno.Id}]" });
        // Sent from anna's other phone at the same moment, stamped later.
        db.Messages.Add(new Message { Id = Guid.CreateVersion7(DateTimeOffset.UtcNow.AddSeconds(1)), SentAt = DateTime.UtcNow.AddSeconds(1), ConversationId = chat.Id, SenderId = anna.Id, Content = "eccomi" });
        await db.SaveChangesAsync();
        var sent = new FakePushSender(NullLogger<FakePushSender>.Instance);
        var chats = new ConversationsController(db, TestPush.For(db, sent)).As(anna.Id);

        await chats.Send(chat.Id, new SendMessage("ciao"));    // nothing earlier unread: pushes
        await chats.Send(chat.Id, new SendMessage("ci sei?")); // "ciao" is earlier: does not

        Assert.Single(sent.Sent);
    }
}
