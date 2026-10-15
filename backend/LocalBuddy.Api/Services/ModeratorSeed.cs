using LocalBuddy.Api.Models;
using Microsoft.AspNetCore.Identity;

namespace LocalBuddy.Api.Services;

/// Moderators are bootstrapped from configuration rather than edited into the database by hand.
/// Idempotent, and safe to run from several instances at once.
public static class ModeratorSeed
{
    /// Entries are account ids. Never addresses: registration does not verify that the person
    /// typing an address owns it, so a configured address handed moderator powers to whoever
    /// signed up with it first.
    public static async Task ApplyAsync(
        IReadOnlyList<string> entries,
        UserManager<User> users,
        RoleManager<IdentityRole<Guid>> roles,
        ILogger log)
    {
        if (entries.Count == 0) return;

        try
        {
            if (!await roles.RoleExistsAsync(Roles.Moderator))
                await roles.CreateAsync(new IdentityRole<Guid>(Roles.Moderator));

            foreach (var entry in entries)
            {
                if (!Guid.TryParse(entry, out var id))
                {
                    log.LogWarning("A Moderators entry is not an account id and grants nothing.");
                    continue;
                }

                var user = await users.FindByIdAsync(id.ToString());
                if (user is null)
                {
                    log.LogWarning("Configured moderator has no account yet: the role is granted at the first start after they register.");
                    continue;
                }

                if (!await users.IsInRoleAsync(user, Roles.Moderator))
                    await users.AddToRoleAsync(user, Roles.Moderator);
            }
        }
        catch (Exception ex)
        {
            // Losing a race with another instance is fine; the winner did the same work.
            log.LogWarning(ex, "Moderator seeding did not complete.");
        }
    }
}
