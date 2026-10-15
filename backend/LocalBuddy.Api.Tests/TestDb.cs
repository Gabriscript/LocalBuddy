using System.Security.Claims;
using LocalBuddy.Api.Data;
using LocalBuddy.Api.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace LocalBuddy.Api.Tests;

public static class TestCaller
{
    public static ClaimsPrincipal For(Guid id) =>
        new(new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, id.ToString())], "test"));

    /// Runs a controller as the given signed-in member.
    public static T As<T>(this T controller, Guid caller) where T : ControllerBase
    {
        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext { User = For(caller) } };
        return controller;
    }
}

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
            // As Identity's own normalizer writes it, so UserManager.FindByEmailAsync finds it.
            NormalizedEmail = $"{name}@test.local".ToUpperInvariant(),
            Name = name,
            City = "Milano",
            // UserManager refuses to update an account without one, the way a registration never
            // leaves it null.
            SecurityStamp = Guid.NewGuid().ToString()
        };
        Db.Users.Add(user);
        Db.SaveChanges();
        return user.Id;
    }

    public Guid AddVerifiedUser(string name)
    {
        var id = AddUser(name);
        Db.Users.Find(id)!.IdentityVerified = true;
        Db.SaveChanges();
        return id;
    }

    public void Dispose()
    {
        Db.Dispose();
        connection.Dispose();
    }
}

/// Identity over the same test database, for the paths that go through UserManager instead of
/// the DbContext: roles and password hashing.
public sealed class TestIdentity : IDisposable
{
    readonly ServiceProvider services;

    public TestIdentity(LocalBuddyDbContext db)
    {
        var collection = new ServiceCollection();
        collection.AddLogging();
        collection.AddSingleton(db);
        collection.AddHttpContextAccessor();
        collection.AddAuthentication();
        collection.AddIdentityCore<User>()
                  .AddRoles<IdentityRole<Guid>>()
                  .AddEntityFrameworkStores<LocalBuddyDbContext>()
                  .AddSignInManager();
        services = collection.BuildServiceProvider();
    }

    public UserManager<User> Users => services.GetRequiredService<UserManager<User>>();
    public RoleManager<IdentityRole<Guid>> Roles => services.GetRequiredService<RoleManager<IdentityRole<Guid>>>();
    public SignInManager<User> SignIn => services.GetRequiredService<SignInManager<User>>();

    public void Dispose() => services.Dispose();
}
