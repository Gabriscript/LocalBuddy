using LocalBuddy.Api.Data;
using LocalBuddy.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace LocalBuddy.Api.Services;

/// A conversation can be opened two ways — a mutual match, or a paid unlock — so opening one
/// lives here instead of being written twice, once per controller, with different invariants.
public class ConversationService(LocalBuddyDbContext db)
{
    /// Opens a transaction that holds a lock on this pair of members until it ends. Two requests
    /// about the same pair — a double tap on unlock, or both people expressing interest at the
    /// same moment — then run one after the other, and the second sees what the first wrote.
    /// Without it a double tap charged twice, and a simultaneous match stayed pending forever.
    public async Task<IDbContextTransaction> BeginPairAsync(Guid a, Guid b)
    {
        var transaction = await db.Database.BeginTransactionAsync();

        // Advisory locks are Postgres-only; the SQLite unit tests do not exercise concurrency.
        if (db.Database.IsNpgsql())
            await db.Database.ExecuteSqlAsync($"SELECT pg_advisory_xact_lock({PairKey(a, b)})");

        return transaction;
    }

    /// Idempotent: a pair of users never ends up with two conversations, provided the caller
    /// holds the pair lock from BeginPairAsync. The conversation is only added to the change
    /// tracker; the caller owns the SaveChanges and its unit of work.
    public async Task<(Conversation Conversation, bool Created)> OpenAsync(
        Guid userA, Guid userB, bool unlockedByPayment)
    {
        var existing = await db.Conversations.FirstOrDefaultAsync(c =>
            (c.UserAId == userA && c.UserBId == userB) ||
            (c.UserAId == userB && c.UserBId == userA));
        if (existing is not null) return (existing, false);

        var conversation = new Conversation
        {
            Id = Guid.CreateVersion7(),
            UserAId = userA,
            UserBId = userB,
            UnlockedByPayment = unlockedByPayment
        };
        db.Conversations.Add(conversation);
        return (conversation, true);
    }

    /// Order-independent, so (a, b) and (b, a) take the same lock. A collision between two
    /// unrelated pairs only makes one wait for the other; it cannot break anything.
    static long PairKey(Guid a, Guid b)
    {
        Span<byte> x = stackalloc byte[16], y = stackalloc byte[16];
        a.TryWriteBytes(x);
        b.TryWriteBytes(y);
        return BitConverter.ToInt64(x) ^ BitConverter.ToInt64(x[8..]) ^
               BitConverter.ToInt64(y) ^ BitConverter.ToInt64(y[8..]);
    }
}
