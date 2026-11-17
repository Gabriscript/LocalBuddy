using LocalBuddy.Api.Data;
using LocalBuddy.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace LocalBuddy.Api.Services;

/// Puts the demo cast back in its first state (ADR-0014): every demo account is deleted and the
/// cast in DemoSeed is written again, with trips and message times anchored to the given day.
/// The rows are the ones the HTTP flow of the old seed script left behind, written directly.
public class DemoSeeder(
    LocalBuddyDbContext db,
    UserManager<User> users,
    IPhotoStorage storage,
    DemoOptions options,
    ILogger<DemoSeeder> log)
{
    /// One lock for every reset, so two of them run one after the other instead of interleaving.
    const long LockKey = 0x0D_E0_5E_ED;

    /// The script's accounts all came out of POST /users/me/verify and an 11-credit update.
    const int Credits = 11;

    public async Task ResetAsync(DateOnly today, DateTime now, CancellationToken ct = default)
    {
        var seed = DemoSeed.Current;

        // Decoding is the slow part, so it happens before the lock. The files are on disk from
        // here on: if the transaction fails they are removed again below.
        var photos = await StorePhotosAsync(seed, ct);
        List<string> oldFiles;
        try
        {
            await using var transaction = await db.BeginLockedAsync(LockKey);
            oldFiles = await DeleteDemoAccountsAsync(seed, ct);
            Insert(seed, photos, today, now);
            await db.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);
        }
        catch
        {
            foreach (var (_, key) in photos) await storage.DeleteAsync(key.Url, CancellationToken.None);
            throw;
        }

        // Rows first, files after, as DeleteMe does: a failed reset must not leave the old cast
        // pointing at photos that are gone.
        foreach (var key in oldFiles) await storage.DeleteAsync(key, CancellationToken.None);
    }

    /// Returns the storage keys of the deleted accounts' photos.
    async Task<List<string>> DeleteDemoAccountsAsync(DemoSeed seed, CancellationToken ct)
    {
        // Normalised, so a demo address registered in capitals through the app goes too.
        var domain = "@" + users.NormalizeEmail(DemoSeed.Domain);
        var demo = db.Users.Where(u => u.NormalizedEmail!.EndsWith(domain));

        // The seeded ids too: a report about a demo account outlives the account (ADR-0004).
        var ids = await demo.Select(u => u.Id).ToListAsync(ct);
        ids.AddRange(seed.People.Select(p => DemoSeed.IdOf(p.Key)));

        var files = await db.Photos.Where(p => ids.Contains(p.UserId)).Select(p => p.Url).ToListAsync(ct);

        // Payments and reports carry no foreign key (ADR-0004), so the cascade cannot reach them.
        await db.Payments.Where(p => ids.Contains(p.UserId) || (p.UnlockedUserId != null && ids.Contains(p.UnlockedUserId.Value)))
            .ExecuteDeleteAsync(ct);
        await db.Reports.Where(r => ids.Contains(r.ReporterId) || ids.Contains(r.ReportedId)).ExecuteDeleteAsync(ct);
        // Everything else they own, or share with another member, goes by the database cascade.
        await demo.ExecuteDeleteAsync(ct);

        // The deletes went past the change tracker: entities it still holds from an earlier reset
        // on this context would collide with the same ids inserted again.
        db.ChangeTracker.Clear();
        return files;
    }

    void Insert(DemoSeed seed, List<(DemoPerson Person, PhotoKey Key)> photos, DateOnly today, DateTime now)
    {
        // PBKDF2 is slow on purpose, and every demo account has the same password: one hash for
        // all of them (the salt is inside it, so it verifies for each).
        var hash = users.PasswordHasher.HashPassword(new User(), options.AccountPassword);

        foreach (var p in seed.People)
        {
            var email = DemoSeed.EmailOf(p.Key);
            var id = DemoSeed.IdOf(p.Key);
            db.Users.Add(new User
            {
                Id = id,
                UserName = email,
                NormalizedUserName = users.NormalizeName(email),
                Email = email,
                NormalizedEmail = users.NormalizeEmail(email),
                PasswordHash = hash,
                SecurityStamp = Guid.NewGuid().ToString("N"),
                LockoutEnabled = true, // as Identity's AllowedForNewUsers sets it at registration
                Name = p.Name,
                City = p.City,
                Role = p.Role,
                WhatWeWillDo = p.WhatWeWillDo,
                WhyIHost = p.WhyIHost,
                LanguagesSpoken = p.Languages,
                IdentityVerified = true,
                AgeVerified = true,
                CreditsBalance = Credits,
                HasCar = p.HasCar,
                Smokes = p.Smokes,
                HasPets = p.HasPets,
                ProfileVisibleToAnonymous = true,
                UsualDays = UsualDays.ToMask(p.UsualDays),
                ActivityStyle = p.ActivityStyle,
                Lifestyle = p.Lifestyle
            });

            db.Availabilities.AddRange(p.TimesOfDay.Select(t => new Availability
            {
                Id = Guid.CreateVersion7(), UserId = id, TimeOfDay = t
            }));

            if (p.Role != "guest")
                db.Listings.Add(new Listing
                {
                    Id = Guid.CreateVersion7(),
                    UserId = id,
                    OffersExperience = true,
                    OffersOvernight = p.OffersOvernight,
                    OvernightComplianceAck = p.OffersOvernight
                });

            db.Trips.AddRange(p.Trips.Select(t => new Trip
            {
                Id = Guid.CreateVersion7(), UserId = id, City = t.City, From = today.AddDays(t.From), To = today.AddDays(t.To)
            }));
        }

        db.Photos.AddRange(photos.Select(x => new Photo
        {
            Id = Guid.CreateVersion7(), UserId = DemoSeed.IdOf(x.Person.Key), Type = x.Key.Type, Url = x.Key.Url
        }));

        foreach (var m in seed.Matches)
        {
            var (a, b) = (DemoSeed.IdOf(m.A), DemoSeed.IdOf(m.B));
            // The chat opened when b said yes, a minute before its first message.
            var matchedAt = now.AddMinutes(-(m.Messages.Select(x => x.MinutesAgo).DefaultIfEmpty(0).Max() + 1));

            // Both directions, as MatchesController.Interest leaves them once b answers a.
            db.Matches.Add(new Match { Id = Guid.CreateVersion7(), InitiatorId = a, TargetId = b, Status = MatchStatus.Matched, MatchedAt = matchedAt });
            db.Matches.Add(new Match { Id = Guid.CreateVersion7(), InitiatorId = b, TargetId = a, Status = MatchStatus.Matched, MatchedAt = matchedAt });

            // ConversationService.OpenAsync(me: b, target: a). Nobody has opened it since, so both
            // read markers stay empty and every message from the other side counts as unread.
            var conversation = new Conversation { Id = Guid.CreateVersion7(), UserAId = b, UserBId = a, CreatedAt = matchedAt };
            db.Conversations.Add(conversation);
            db.Messages.AddRange(m.Messages.Select(x => new Message
            {
                Id = Guid.CreateVersion7(),
                ConversationId = conversation.Id,
                SenderId = DemoSeed.IdOf(x.From),
                Content = x.Text,
                SentAt = now.AddMinutes(-x.MinutesAgo)
            }));
        }

        // Version 7 ids order the requests list, newest first, so the last one in the file leads it.
        db.Matches.AddRange(seed.Requests.Select(r => new Match
        {
            Id = Guid.CreateVersion7(),
            InitiatorId = DemoSeed.IdOf(r.From),
            TargetId = DemoSeed.IdOf(r.To),
            Status = MatchStatus.Pending,
            Note = r.Note
        }));

        // The stored rating follows the thumb, as ReviewsController.Create does when only one comes.
        db.Reviews.AddRange(seed.References.Select(r => new Review
        {
            Id = Guid.CreateVersion7(),
            AuthorId = DemoSeed.IdOf(r.From),
            SubjectId = DemoSeed.IdOf(r.To),
            Rating = r.Recommend ? 5 : 1,
            Recommend = r.Recommend,
            Context = r.Context,
            Comment = r.Text,
            CreatedAt = now.AddDays(-r.DaysAgo)
        }));
    }

    async Task<List<(DemoPerson Person, PhotoKey Key)>> StorePhotosAsync(DemoSeed seed, CancellationToken ct)
    {
        var stored = new List<(DemoPerson, PhotoKey)>();
        if (string.IsNullOrWhiteSpace(options.PhotosPath))
        {
            log.LogWarning("Demo:PhotosPath is not set: the demo cast is seeded without photos.");
            return stored;
        }

        try
        {
            foreach (var p in seed.People)
            {
                if (await StoreAsync(p.PhotoFile, ct) is { } profile) stored.Add((p, new PhotoKey(PhotoType.Profile, profile)));
                if (p.HomePhoto is not null && await StoreAsync(p.HomePhoto, ct) is { } home)
                    stored.Add((p, new PhotoKey(PhotoType.Home, home)));
            }
        }
        catch
        {
            foreach (var (_, key) in stored) await storage.DeleteAsync(key.Url, CancellationToken.None);
            throw;
        }
        return stored;
    }

    /// The storage key, or null when the file is missing or not a photo: that person goes without it.
    async Task<string?> StoreAsync(string fileName, CancellationToken ct)
    {
        // Leaf name only: the seed file must not be able to point outside the photo folder.
        var path = Path.Combine(options.PhotosPath, Path.GetFileName(fileName));
        if (!File.Exists(path))
        {
            log.LogWarning("Demo photo {File} is missing; that profile is seeded without it.", fileName);
            return null;
        }

        MemoryStream? jpeg;
        string? refusal;
        try
        {
            (jpeg, refusal) = await PhotoProcessing.NormaliseAsync(() => File.OpenRead(path));
        }
        catch (Exception ex) when (ex is IOException or UnauthorizedAccessException)
        {
            log.LogWarning(ex, "Demo photo {File} could not be read; that profile is seeded without it.", fileName);
            return null;
        }
        if (jpeg is null)
        {
            log.LogWarning("Demo photo {File} was refused ({Refusal}); that profile is seeded without it.", fileName, refusal);
            return null;
        }
        await using (jpeg) return await storage.SaveJpegAsync(jpeg, ct);
    }

    record PhotoKey(PhotoType Type, string Url);
}
