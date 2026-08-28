using Microsoft.EntityFrameworkCore;

namespace LocalBuddy.Api.Data;

/// Blocking is symmetric — neither side may reach the other, whoever pressed the button.
/// Defined once here because the rule was previously copied into three controllers, one of
/// them in a subtly different form.
public static class BlockQueries
{
    public static Task<bool> IsBlockedBetweenAsync(this LocalBuddyDbContext db, Guid a, Guid b)
        => db.Blocks.AnyAsync(x => (x.BlockerId == a && x.BlockedId == b) ||
                                   (x.BlockerId == b && x.BlockedId == a));

    /// Every user id that must stay invisible to <paramref name="me"/>, in either direction.
    public static IQueryable<Guid> BlockedIdsFor(this LocalBuddyDbContext db, Guid me)
        => db.Blocks.Where(x => x.BlockerId == me || x.BlockedId == me)
                    .Select(x => x.BlockerId == me ? x.BlockedId : x.BlockerId);
}
