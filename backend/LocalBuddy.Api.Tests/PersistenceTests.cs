using LocalBuddy.Api.Data;
using LocalBuddy.Api.Models;
using LocalBuddy.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace LocalBuddy.Api.Tests;

public class ConversationServiceTests
{
    [Fact]
    public async Task Opens_a_conversation_the_first_time()
    {
        using var t = new TestDb();
        var (a, b) = (t.AddUser("alice"), t.AddUser("bob"));

        var (conversation, created) = await new ConversationService(t.Db).OpenAsync(a, b, false);
        await t.Db.SaveChangesAsync();

        Assert.True(created);
        Assert.Equal(1, await t.Db.Conversations.CountAsync());
        Assert.False(conversation.UnlockedByPayment);
    }

    /// The bug this service exists to prevent: a paid unlock and a mutual match each opening
    /// a chat for the same pair.
    [Fact]
    public async Task Never_opens_a_second_conversation_for_the_same_pair()
    {
        using var t = new TestDb();
        var (a, b) = (t.AddUser("alice"), t.AddUser("bob"));
        var service = new ConversationService(t.Db);

        var first = await service.OpenAsync(a, b, unlockedByPayment: false);
        await t.Db.SaveChangesAsync();

        var second = await service.OpenAsync(a, b, unlockedByPayment: true);
        await t.Db.SaveChangesAsync();

        Assert.False(second.Created);
        Assert.Equal(first.Conversation.Id, second.Conversation.Id);
        Assert.Equal(1, await t.Db.Conversations.CountAsync());
    }

    [Fact]
    public async Task Finds_the_existing_conversation_whichever_side_asks()
    {
        using var t = new TestDb();
        var (a, b) = (t.AddUser("alice"), t.AddUser("bob"));
        var service = new ConversationService(t.Db);

        var opened = await service.OpenAsync(a, b, false);
        await t.Db.SaveChangesAsync();

        var reversed = await service.OpenAsync(b, a, false);

        Assert.False(reversed.Created);
        Assert.Equal(opened.Conversation.Id, reversed.Conversation.Id);
    }
}

public class BlockQueriesTests
{
    [Fact]
    public async Task A_block_applies_in_both_directions()
    {
        using var t = new TestDb();
        var (a, b, c) = (t.AddUser("alice"), t.AddUser("bob"), t.AddUser("carol"));
        t.Db.Blocks.Add(new Block { Id = Guid.NewGuid(), BlockerId = a, BlockedId = b });
        await t.Db.SaveChangesAsync();

        Assert.True(await t.Db.IsBlockedBetweenAsync(a, b));
        Assert.True(await t.Db.IsBlockedBetweenAsync(b, a)); // the blocked side is blocked too
        Assert.False(await t.Db.IsBlockedBetweenAsync(a, c));
    }

    [Fact]
    public async Task Blocked_ids_are_listed_for_both_participants()
    {
        using var t = new TestDb();
        var (a, b) = (t.AddUser("alice"), t.AddUser("bob"));
        t.Db.Blocks.Add(new Block { Id = Guid.NewGuid(), BlockerId = a, BlockedId = b });
        await t.Db.SaveChangesAsync();

        Assert.Equal([b], await t.Db.BlockedIdsFor(a).ToListAsync());
        Assert.Equal([a], await t.Db.BlockedIdsFor(b).ToListAsync());
    }
}

public class ErasureTests
{
    /// GDPR erasure relies entirely on the database cascade now that UsersController no longer
    /// lists the tables by hand. Add an entity without a foreign key and this test fails.
    [Fact]
    public async Task Deleting_a_user_takes_their_whole_footprint_with_them()
    {
        using var t = new TestDb();
        var (a, b) = (t.AddUser("alice"), t.AddUser("bob"));

        var conversation = new Conversation { Id = Guid.NewGuid(), UserAId = a, UserBId = b };
        t.Db.Conversations.Add(conversation);
        t.Db.Messages.Add(new Message { Id = Guid.NewGuid(), ConversationId = conversation.Id, SenderId = a, Content = "ciao" });
        t.Db.Matches.Add(new Match { Id = Guid.NewGuid(), InitiatorId = a, TargetId = b, Status = MatchStatus.Pending });
        t.Db.Reviews.Add(new Review { Id = Guid.NewGuid(), AuthorId = b, SubjectId = a, Rating = 5, Comment = "great" });
        t.Db.Blocks.Add(new Block { Id = Guid.NewGuid(), BlockerId = a, BlockedId = b });
        t.Db.Photos.Add(new Photo { Id = Guid.NewGuid(), UserId = a, Type = PhotoType.Profile, Url = "/uploads/x.jpg" });
        t.Db.Listings.Add(new Listing { Id = Guid.NewGuid(), UserId = a });
        t.Db.Subscriptions.Add(new Subscription { Id = Guid.NewGuid(), UserId = a, PlanType = "monthly", Status = "active" });
        await t.Db.SaveChangesAsync();

        t.Db.Users.Remove(await t.Db.Users.FindAsync(a) ?? throw new InvalidOperationException());
        await t.Db.SaveChangesAsync();

        Assert.Equal(0, await t.Db.Conversations.CountAsync());
        Assert.Equal(0, await t.Db.Messages.CountAsync());
        Assert.Equal(0, await t.Db.Matches.CountAsync());
        Assert.Equal(0, await t.Db.Reviews.CountAsync());
        Assert.Equal(0, await t.Db.Blocks.CountAsync());
        Assert.Equal(0, await t.Db.Photos.CountAsync());
        Assert.Equal(0, await t.Db.Listings.CountAsync());
        Assert.Equal(0, await t.Db.Subscriptions.CountAsync());
    }

    /// The deliberate exception: accounting and abuse history outlive the account (ADR-0004).
    [Fact]
    public async Task Payments_and_reports_survive_the_deletion()
    {
        using var t = new TestDb();
        var (a, b) = (t.AddUser("alice"), t.AddUser("bob"));

        t.Db.Payments.Add(new Payment { Id = Guid.NewGuid(), UserId = a, Type = PaymentType.OneTimeUnlock, Amount = 4.99m, StripeId = "pi_1" });
        t.Db.Reports.Add(new Report { Id = Guid.NewGuid(), ReporterId = b, ReportedId = a, Reason = "spam", Status = ReportStatus.Open });
        await t.Db.SaveChangesAsync();

        t.Db.Users.Remove(await t.Db.Users.FindAsync(a) ?? throw new InvalidOperationException());
        await t.Db.SaveChangesAsync();

        Assert.Equal(1, await t.Db.Payments.CountAsync());
        Assert.Equal(1, await t.Db.Reports.CountAsync());
    }
}
