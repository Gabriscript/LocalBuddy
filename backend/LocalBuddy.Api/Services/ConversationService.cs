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
    public Task<IDbContextTransaction> BeginPairAsync(Guid a, Guid b) => db.BeginLockedAsync(PairKey(a, b));

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
    static long PairKey(Guid a, Guid b) => AdvisoryLocks.KeyOf(a) ^ AdvisoryLocks.KeyOf(b);
}
