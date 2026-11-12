using LocalBuddy.Api.Controllers;
using LocalBuddy.Api.Dtos;
using LocalBuddy.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace LocalBuddy.Api.Tests;

/// Unread = what the other member wrote since I last had the chat open.
public class UnreadTests
{
    static ConversationsController Chats(TestDb t, Guid caller) => new ConversationsController(t.Db, TestPush.For(t.Db)).As(caller);

    static async Task<int> UnreadOf(TestDb t, Guid me)
    {
        var listed = (await Chats(t, me).List()).Value!.Items.Single();
        // The inbox and the chat screen read the same number.
        Assert.Equal(listed.UnreadCount, (await Chats(t, me).One(listed.Id)).Value!.UnreadCount);
        return listed.UnreadCount;
    }

    [Fact]
    public async Task Only_the_other_members_messages_since_my_last_read_count()
    {
        using var t = new TestDb();
        var (anna, bruno) = (t.AddVerifiedUser("anna"), t.AddVerifiedUser("bruno"));
        var matches = new MatchesController(t.Db, new ConversationService(t.Db), TestPush.For(t.Db));
        await matches.As(anna).Interest(bruno);
        await matches.As(bruno).Interest(anna);
        var chat = t.Db.Conversations.Single().Id;

        await Chats(t, bruno).Send(chat, new SendMessage("ciao"));
        await Chats(t, bruno).Send(chat, new SendMessage("ci sei?"));
        Assert.Equal(2, await UnreadOf(t, anna));
        Assert.Equal(0, await UnreadOf(t, bruno)); // my own messages are never unread to me

        Assert.IsType<NoContentResult>(await Chats(t, anna).Read(chat));
        Assert.Equal(0, await UnreadOf(t, anna));

        await Chats(t, anna).Send(chat, new SendMessage("eccomi"));
        await Chats(t, bruno).Send(chat, new SendMessage("a dopo"));
        Assert.Equal(1, await UnreadOf(t, anna));
        Assert.Equal(1, await UnreadOf(t, bruno)); // anna reading did not mark bruno's side
    }

    [Fact]
    public async Task A_stranger_cannot_mark_a_chat_read()
    {
        using var t = new TestDb();
        var (anna, bruno, carla) = (t.AddVerifiedUser("anna"), t.AddVerifiedUser("bruno"), t.AddVerifiedUser("carla"));
        var matches = new MatchesController(t.Db, new ConversationService(t.Db), TestPush.For(t.Db));
        await matches.As(anna).Interest(bruno);
        await matches.As(bruno).Interest(anna);
        var chat = t.Db.Conversations.Single();

        Assert.IsType<ForbidResult>(await Chats(t, carla).Read(chat.Id));
        await t.Db.Entry(chat).ReloadAsync();
        Assert.Null(chat.UserAReadAt);
        Assert.Null(chat.UserBReadAt);
    }
}
