using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using LocalBuddy.Api.Models;

namespace LocalBuddy.Api.Data;

public class LocalBuddyDbContext(DbContextOptions<LocalBuddyDbContext> options)
    : IdentityDbContext<User, IdentityRole<Guid>, Guid>(options)
{
    public DbSet<Photo> Photos => Set<Photo>();
    public DbSet<Availability> Availabilities => Set<Availability>();
    public DbSet<Listing> Listings => Set<Listing>();
    public DbSet<Match> Matches => Set<Match>();
    public DbSet<Conversation> Conversations => Set<Conversation>();
    public DbSet<Message> Messages => Set<Message>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Subscription> Subscriptions => Set<Subscription>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<Report> Reports => Set<Report>();
    public DbSet<Block> Blocks => Set<Block>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        base.OnModelCreating(b);

        // ---- Relationships -------------------------------------------------------------
        // Deleting a user must take their whole footprint with it (GDPR erasure), so the
        // cascade is declared here once instead of being re-listed by hand in a controller.
        // Every FK also gives us its index for free.

        b.Entity<User>().HasMany(u => u.Photos).WithOne()
            .HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        b.Entity<User>().HasMany(u => u.Availabilities).WithOne()
            .HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        b.Entity<User>().HasOne(u => u.Listing).WithOne()
            .HasForeignKey<Listing>(x => x.UserId).OnDelete(DeleteBehavior.Cascade);

        b.Entity<Match>().HasOne<User>().WithMany()
            .HasForeignKey(x => x.InitiatorId).OnDelete(DeleteBehavior.Cascade);
        b.Entity<Match>().HasOne<User>().WithMany()
            .HasForeignKey(x => x.TargetId).OnDelete(DeleteBehavior.Cascade);

        b.Entity<Conversation>().HasOne<User>().WithMany()
            .HasForeignKey(x => x.UserAId).OnDelete(DeleteBehavior.Cascade);
        b.Entity<Conversation>().HasOne<User>().WithMany()
            .HasForeignKey(x => x.UserBId).OnDelete(DeleteBehavior.Cascade);

        b.Entity<Message>().HasOne<Conversation>().WithMany()
            .HasForeignKey(x => x.ConversationId).OnDelete(DeleteBehavior.Cascade);
        b.Entity<Message>().HasOne<User>().WithMany()
            .HasForeignKey(x => x.SenderId).OnDelete(DeleteBehavior.Cascade);

        b.Entity<Review>().HasOne<User>().WithMany()
            .HasForeignKey(x => x.AuthorId).OnDelete(DeleteBehavior.Cascade);
        b.Entity<Review>().HasOne<User>().WithMany()
            .HasForeignKey(x => x.SubjectId).OnDelete(DeleteBehavior.Cascade);

        b.Entity<Block>().HasOne<User>().WithMany()
            .HasForeignKey(x => x.BlockerId).OnDelete(DeleteBehavior.Cascade);
        b.Entity<Block>().HasOne<User>().WithMany()
            .HasForeignKey(x => x.BlockedId).OnDelete(DeleteBehavior.Cascade);

        // A subscription is meaningless without its subscriber; the Payment rows below keep
        // the accounting trail.
        b.Entity<Subscription>().HasOne<User>().WithMany()
            .HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);

        // Payments and Reports deliberately have NO foreign key to User: accounting records and
        // abuse history have to outlive the account, and every alternative loses something —
        // Cascade destroys the record, Restrict blocks erasure outright, SetNull throws away the
        // link that lets several reports about the same person be correlated. The user id is
        // kept as a plain value. See docs/adr/0004-no-foreign-keys-on-payments-and-reports.md.
        b.Entity<Payment>().HasIndex(x => x.UserId);
        b.Entity<Report>().HasIndex(x => x.ReportedId);

        // ---- Uniqueness ----------------------------------------------------------------
        // One interest row per direction, one review per author/subject pair, one block per
        // pair. (Listing gets its unique index from the one-to-one above.)
        b.Entity<Match>().HasIndex(x => new { x.InitiatorId, x.TargetId }).IsUnique();
        b.Entity<Block>().HasIndex(x => new { x.BlockerId, x.BlockedId }).IsUnique();
        b.Entity<Review>().HasIndex(x => new { x.AuthorId, x.SubjectId }).IsUnique();

        // Identity enforces RequireUniqueEmail inside UserManager only, which two concurrent
        // registrations can both pass. This is the constraint that actually holds. It replaces
        // the non-unique EmailIndex that IdentityDbContext declares by convention.
        b.Entity<User>().HasIndex(x => x.NormalizedEmail).IsUnique().HasDatabaseName("EmailIndex");

        // ---- Query-shaped indexes ------------------------------------------------------
        // Both hot message queries order by SentAt within one conversation (the message list
        // and the LastMessage subquery), so the composite serves the sort as well as the
        // filter, and covers the ConversationId foreign key as its leading column.
        b.Entity<Message>().HasIndex(x => new { x.ConversationId, x.SentAt });

        // The evasion lookup in UsersController.Verify hits this on every verification.
        b.Entity<User>().HasIndex(x => x.IdentitySubjectHash);

        // Discovery compares city case-insensitively, so the index has to be on lower("City").
        // A plain index on the column is never used — confirmed with EXPLAIN. It is created as
        // raw SQL in the migration, because EF cannot express a functional index.

        // ---- Column widths --------------------------------------------------------------
        // The same numbers the request validation uses, so the database is a backstop and
        // not merely a DTO attribute somebody can forget.
        b.Entity<User>(u =>
        {
            u.Property(x => x.Name).HasMaxLength(Limits.Name);
            u.Property(x => x.City).HasMaxLength(Limits.City);
            u.Property(x => x.Role).HasMaxLength(Limits.Role);
            u.Property(x => x.WhatWeWillDo).HasMaxLength(Limits.Prompt);
            u.Property(x => x.WhyIHost).HasMaxLength(Limits.Prompt);
            u.Property(x => x.LanguagesSpoken).HasMaxLength(Limits.Languages);
            u.Property(x => x.BanReason).HasMaxLength(Limits.Reason);
            u.Property(x => x.IdentitySubjectHash).HasMaxLength(Limits.SubjectHash);
        });
        b.Entity<Message>().Property(x => x.Content).HasMaxLength(Limits.Message);
        b.Entity<Review>().Property(x => x.Comment).HasMaxLength(Limits.Comment);
        b.Entity<Report>().Property(x => x.Reason).HasMaxLength(Limits.Reason);
        b.Entity<Photo>().Property(x => x.Url).HasMaxLength(Limits.Url);
        b.Entity<Payment>().Property(x => x.StripeId).HasMaxLength(Limits.ExternalId);
        b.Entity<Subscription>(s =>
        {
            s.Property(x => x.PlanType).HasMaxLength(Limits.Role);
            s.Property(x => x.Status).HasMaxLength(Limits.Role);
        });

        // ---- Types ---------------------------------------------------------------------
        // Money gets two decimal places instead of unbounded numeric.
        b.Entity<Payment>().Property(x => x.Amount).HasPrecision(10, 2);
    }
}
