using LocalBuddy.Api.Controllers;
using LocalBuddy.Api.Data;
using LocalBuddy.Api.Dtos;
using LocalBuddy.Api.Models;
using LocalBuddy.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Testcontainers.PostgreSql;

namespace LocalBuddy.Api.Tests;

/// One real Postgres for the whole class, schema built by the real migrations. SQLite serialises
/// writes and has no advisory locks, so races can only be tested here. Needs Docker; skip with
/// dotnet test --filter "Category!=Integration".
public sealed class PostgresFixture : IAsyncLifetime
{
    readonly PostgreSqlContainer container = new PostgreSqlBuilder("postgres:16").Build();

    public DbContextOptions<LocalBuddyDbContext> Options { get; private set; } = null!;

    public async Task InitializeAsync()
    {
        await container.StartAsync();
        Options = new DbContextOptionsBuilder<LocalBuddyDbContext>().UseNpgsql(container.GetConnectionString()).Options;
        await using var db = new LocalBuddyDbContext(Options);
        await db.Database.MigrateAsync();
    }

    public Task DisposeAsync() => container.DisposeAsync().AsTask();
}

[Trait("Category", "Integration")]
public class ConcurrencyTests(PostgresFixture postgres) : IClassFixture<PostgresFixture>
{
    const int Rounds = 20;

    async Task<Guid> Member(string name, int credits = 0)
    {
        var id = Guid.CreateVersion7();
        await using var db = new LocalBuddyDbContext(postgres.Options);
        db.Users.Add(new User { Id = id, UserName = $"{name}-{id}", Email = $"{name}-{id}@test.local", IdentityVerified = true, CreditsBalance = credits });
        await db.SaveChangesAsync();
        return id;
    }

    /// Starts every action at the same instant, each on its own context and connection, the way
    /// separate HTTP requests would arrive.
    async Task<T[]> AllAtOnce<T>(params Func<LocalBuddyDbContext, Task<T>>[] actions)
    {
        using var go = new ManualResetEventSlim();
        var tasks = actions.Select(action => Task.Run(async () =>
        {
            go.Wait();
            await using var db = new LocalBuddyDbContext(postgres.Options);
            return await action(db);
        })).ToArray();
        go.Set();
        return await Task.WhenAll(tasks);
    }

    static PaymentsController Payments(LocalBuddyDbContext db, Guid caller) =>
        new PaymentsController(db, new FakePaymentGateway(), new ConversationService(db)).As(caller);

    [Fact]
    public async Task A_double_tap_on_unlock_charges_once_and_opens_one_chat()
    {
        for (var i = 0; i < Rounds; i++)
        {
            var (anna, bruno) = (await Member("anna"), await Member("bruno"));

            await AllAtOnce(
                db => Payments(db, anna).Unlock(bruno),
                db => Payments(db, anna).Unlock(bruno));

            await using var check = new LocalBuddyDbContext(postgres.Options);
            Assert.Equal(1, await check.Payments.CountAsync(p => p.UnlockedUserId == bruno));
            Assert.Equal(1, await check.Conversations.CountAsync(c => c.UserBId == bruno || c.UserAId == bruno));
        }
    }

    [Fact]
    public async Task Two_people_tapping_interest_together_end_up_matched()
    {
        for (var i = 0; i < Rounds; i++)
        {
            var (gino, hana) = (await Member("gino"), await Member("hana"));

            await AllAtOnce(
                db => new MatchesController(db, new ConversationService(db)).As(gino).Interest(hana),
                db => new MatchesController(db, new ConversationService(db)).As(hana).Interest(gino));

            await using var check = new LocalBuddyDbContext(postgres.Options);
            var statuses = await check.Matches.Where(m => m.InitiatorId == gino || m.InitiatorId == hana)
                                              .Select(m => m.Status).ToListAsync();
            Assert.Equal([MatchStatus.Matched, MatchStatus.Matched], statuses);
            Assert.Equal(1, await check.Conversations.CountAsync(c => c.UserAId == gino || c.UserBId == gino));
        }
    }

    [Fact]
    public async Task The_last_credit_cannot_pay_for_two_unlocks_at_once()
    {
        for (var i = 0; i < Rounds; i++)
        {
            var (anna, bruno, carla) = (await Member("anna", credits: 1), await Member("bruno"), await Member("carla"));

            var results = await AllAtOnce(
                db => Payments(db, anna).Unlock(bruno),
                db => Payments(db, anna).Unlock(carla));

            var charged = results.Select(r => Assert.IsType<UnlockResult>(Assert.IsType<CreatedResult>(r).Value).Charged).Order();
            Assert.Equal(["credits", "one-time"], charged);

            await using var check = new LocalBuddyDbContext(postgres.Options);
            Assert.Equal(0, await check.Users.Where(u => u.Id == anna).Select(u => u.CreditsBalance).SingleAsync());
        }
    }
}
