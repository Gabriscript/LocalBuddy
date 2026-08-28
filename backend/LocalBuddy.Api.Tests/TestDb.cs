using LocalBuddy.Api.Data;
using LocalBuddy.Api.Models;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace LocalBuddy.Api.Tests;

/// A real relational database per test, in memory. SQLite rather than the InMemory provider
/// because these tests are about foreign keys and cascades, which InMemory does not enforce.
public sealed class TestDb : IDisposable
{
    readonly SqliteConnection connection;
    public LocalBuddyDbContext Db { get; }

    public TestDb()
    {
        connection = new SqliteConnection("Filename=:memory:");
        connection.Open();
        Db = new LocalBuddyDbContext(
            new DbContextOptionsBuilder<LocalBuddyDbContext>().UseSqlite(connection).Options);
        Db.Database.EnsureCreated();
    }

    public Guid AddUser(string name)
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            UserName = $"{name}@test.local",
            NormalizedUserName = $"{name}@TEST.LOCAL",
            Email = $"{name}@test.local",
            Name = name,
            City = "Milano"
        };
        Db.Users.Add(user);
        Db.SaveChanges();
        return user.Id;
    }

    public void Dispose()
    {
        Db.Dispose();
        connection.Dispose();
    }
}
