using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace LocalBuddy.Api.Data;

/// A transaction that holds a Postgres advisory lock until it ends, so two requests about the
/// same thing run one after the other and the second sees what the first wrote. All keys share
/// one space: a collision only makes a request wait for an unrelated one, and since no request
/// takes two of these locks, nothing can deadlock on them.
public static class AdvisoryLocks
{
    public static async Task<IDbContextTransaction> BeginLockedAsync(this LocalBuddyDbContext db, long key)
    {
        var transaction = await db.Database.BeginTransactionAsync();

        // Advisory locks are Postgres-only; the SQLite unit tests do not exercise concurrency.
        if (db.Database.IsNpgsql())
            await db.Database.ExecuteSqlAsync($"SELECT pg_advisory_xact_lock({key})");

        return transaction;
    }

    /// One member's key: the two halves of the id folded into the lock's 64 bits.
    public static long KeyOf(Guid id)
    {
        Span<byte> bytes = stackalloc byte[16];
        id.TryWriteBytes(bytes);
        return BitConverter.ToInt64(bytes) ^ BitConverter.ToInt64(bytes[8..]);
    }
}
