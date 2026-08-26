using Microsoft.EntityFrameworkCore;
using LocalBuddy.Api.Models;

namespace LocalBuddy.Api.Data;

public class LocalBuddyDbContext(DbContextOptions<LocalBuddyDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
}
