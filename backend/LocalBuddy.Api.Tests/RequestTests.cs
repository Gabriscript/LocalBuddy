using LocalBuddy.Api.Controllers;
using LocalBuddy.Api.Models;
using LocalBuddy.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace LocalBuddy.Api.Tests;

/// Received requests: somebody's pending interest in me that I have not answered yet. Accepting
/// is an interest back, declining a pass, and either one takes the request off the list.
public class RequestTests
{
    static MatchesController Matches(TestDb t, Guid caller) =>
        new MatchesController(t.Db, new ConversationService(t.Db)).As(caller);

    static async Task<List<Guid>> RequestsOf(TestDb t, Guid me)
    {
        var page = (await Matches(t, me).Requests()).Value!;
        var count = (await Matches(t, me).RequestsCount()).Count;
        // The badge and the screen come from one query, so they must never disagree.
        Assert.Equal(page.Items.Count, count);
        return page.Items.Select(card => card.Id).ToList();
    }

    [Fact]
    public async Task A_pending_interest_shows_up_newest_first()
    {
        using var t = new TestDb();
        var (anna, bruno, carla) = (t.AddVerifiedUser("anna"), t.AddVerifiedUser("bruno"), t.AddVerifiedUser("carla"));
        await Matches(t, bruno).Interest(anna);
        await Matches(t, carla).Interest(anna);

        Assert.Equal([carla, bruno], await RequestsOf(t, anna));
        var card = (await Matches(t, anna).Requests()).Value!.Items[0];
        Assert.Equal("carla", card.Name);
    }

    [Fact]
    public async Task Accepting_matches_and_takes_the_request_away()
    {
        using var t = new TestDb();
        var (anna, bruno) = (t.AddVerifiedUser("anna"), t.AddVerifiedUser("bruno"));
        await Matches(t, bruno).Interest(anna);

        await Matches(t, anna).Interest(bruno);

        Assert.Empty(await RequestsOf(t, anna));
        Assert.Equal(1, await t.Db.Conversations.CountAsync());
    }

    [Fact]
    public async Task Declining_takes_the_request_away_without_a_match()
    {
        using var t = new TestDb();
        var (anna, bruno) = (t.AddVerifiedUser("anna"), t.AddVerifiedUser("bruno"));
        await Matches(t, bruno).Interest(anna);

        await Matches(t, anna).Pass(bruno);

        Assert.Empty(await RequestsOf(t, anna));
        Assert.Equal(0, await t.Db.Conversations.CountAsync());
        // The requester's side is untouched: nothing tells them about the decline.
        Assert.Equal(MatchStatus.Pending, (await t.Db.Matches.SingleAsync(m => m.InitiatorId == bruno)).Status);
    }

    [Fact]
    public async Task A_block_in_either_direction_or_a_ban_hides_the_requester()
    {
        using var t = new TestDb();
        var (anna, bruno, carla, dario) =
            (t.AddVerifiedUser("anna"), t.AddVerifiedUser("bruno"), t.AddVerifiedUser("carla"), t.AddVerifiedUser("dario"));
        foreach (var requester in new[] { bruno, carla, dario }) await Matches(t, requester).Interest(anna);

        t.Db.Blocks.AddRange(
            new Block { Id = Guid.NewGuid(), BlockerId = anna, BlockedId = bruno },
            new Block { Id = Guid.NewGuid(), BlockerId = carla, BlockedId = anna });
        (await t.Db.Users.FindAsync(dario))!.BannedAt = DateTime.UtcNow;
        await t.Db.SaveChangesAsync();

        Assert.Empty(await RequestsOf(t, anna));
    }

    [Fact]
    public async Task My_own_interest_is_not_a_request_to_me()
    {
        using var t = new TestDb();
        var (anna, bruno) = (t.AddVerifiedUser("anna"), t.AddVerifiedUser("bruno"));
        await Matches(t, anna).Interest(bruno);

        Assert.Empty(await RequestsOf(t, anna));
        Assert.Equal([anna], await RequestsOf(t, bruno));
    }

    [Fact]
    public async Task An_existing_match_is_not_a_request()
    {
        using var t = new TestDb();
        var (anna, bruno) = (t.AddVerifiedUser("anna"), t.AddVerifiedUser("bruno"));
        await Matches(t, anna).Interest(bruno);
        await Matches(t, bruno).Interest(anna);

        Assert.Empty(await RequestsOf(t, anna));
        Assert.Empty(await RequestsOf(t, bruno));
    }
}
