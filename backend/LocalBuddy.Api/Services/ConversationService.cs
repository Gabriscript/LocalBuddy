using LocalBuddy.Api.Data;
using LocalBuddy.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace LocalBuddy.Api.Services;

/// A conversation can be opened two ways — a mutual match, or a paid unlock — so opening one
/// lives here instead of being written twice, once per controller, with different invariants.
public class ConversationService(LocalBuddyDbContext db)
{
    /// Idempotent: a pair of users never ends up with two conversations. The conversation is
    /// only added to the change tracker; the caller owns the SaveChanges and its unit of work.
    public async Task<(Conversation Conversation, bool Created)> OpenAsync(
        Guid userA, Guid userB, bool unlockedByPayment)
    {
        var existing = await db.Conversations.FirstOrDefaultAsync(c =>
            (c.UserAId == userA && c.UserBId == userB) ||
            (c.UserAId == userB && c.UserBId == userA));
        if (existing is not null) return (existing, false);

        // ponytail: two simultaneous requests can still race into two conversations. Vanishingly
        // unlikely at MVP scale; add a unique index on the ordered pair if it ever bites.
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
}
