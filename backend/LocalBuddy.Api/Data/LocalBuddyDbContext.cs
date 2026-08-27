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

        // One listing per user, one interest row per direction, one review per author/subject pair.
        b.Entity<Listing>().HasIndex(x => x.UserId).IsUnique();
        b.Entity<Match>().HasIndex(x => new { x.InitiatorId, x.TargetId }).IsUnique();
        b.Entity<Block>().HasIndex(x => new { x.BlockerId, x.BlockedId }).IsUnique();
        b.Entity<Review>().HasIndex(x => new { x.AuthorId, x.SubjectId }).IsUnique();

        // Discovery filters on city constantly.
        b.Entity<User>().HasIndex(x => x.City);
    }
}
