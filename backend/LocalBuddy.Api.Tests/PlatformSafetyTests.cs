using System.Security.Claims;
using LocalBuddy.Api.Controllers;
using LocalBuddy.Api.Dtos;
using LocalBuddy.Api.Models;
using LocalBuddy.Api.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;

namespace LocalBuddy.Api.Tests;

/// Always reports the same person, whichever account asks — which is exactly the case the real
/// provider is there to detect and the fake in Development deliberately cannot produce.
file class StubVerifier(string subjectHash) : IIdentityVerifier
{
    public Task<IdentityCheck> VerifyAsync(Guid userId)
        => Task.FromResult(new IdentityCheck(true, true, subjectHash));
}

file class UnusedStorage : IPhotoStorage
{
    public Task<string> SaveJpegAsync(Stream jpeg, CancellationToken ct = default) => Task.FromResult("");
    public Task<Stream?> OpenReadAsync(string key, CancellationToken ct = default) => Task.FromResult<Stream?>(null);
    public Task DeleteAsync(string key, CancellationToken ct = default) => Task.CompletedTask;
}

public class IdentityBanTests
{
    static UsersController ControllerFor(TestDb t, Guid caller, string subjectHash) =>
        new(t.Db, new StubVerifier(subjectHash), new UnusedStorage())
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(
                        [new Claim(ClaimTypes.NameIdentifier, caller.ToString())], "test"))
                }
            }
        };

    /// The whole reason IIdentityVerifier returns a handle rather than a boolean.
    [Fact]
    public async Task A_banned_person_cannot_start_over_with_a_new_account()
    {
        using var t = new TestDb();
        const string SamePerson = "subject-hash-A";
        var (first, second) = (t.AddUser("evader"), t.AddUser("evadertwo"));

        await ControllerFor(t, first, SamePerson).Verify();
        var original = await t.Db.Users.FindAsync(first);
        original!.BannedAt = DateTime.UtcNow;
        original.BanReason = "Rules";
        await t.Db.SaveChangesAsync();

        var result = await ControllerFor(t, second, SamePerson).Verify();

        Assert.Equal(StatusCodes.Status403Forbidden, Assert.IsType<ObjectResult>(result).StatusCode);
        var fresh = await t.Db.Users.FindAsync(second);
        Assert.NotNull(fresh!.BannedAt);
        Assert.False(fresh.IdentityVerified);
    }

    [Fact]
    public async Task Somebody_else_verifies_normally_even_after_a_ban()
    {
        using var t = new TestDb();
        var (banned, newcomer) = (t.AddUser("banned"), t.AddUser("newcomer"));

        await ControllerFor(t, banned, "subject-hash-A").Verify();
        var original = await t.Db.Users.FindAsync(banned);
        original!.BannedAt = DateTime.UtcNow;
        await t.Db.SaveChangesAsync();

        var result = await ControllerFor(t, newcomer, "subject-hash-B").Verify();

        Assert.IsType<OkObjectResult>(result);
        var fresh = await t.Db.Users.FindAsync(newcomer);
        Assert.Null(fresh!.BannedAt);
        Assert.True(fresh.IdentityVerified);
    }
}

public class ProfileVisibilityTests
{
    static ClaimsPrincipal Anonymous() => new(new ClaimsIdentity());

    static ClaimsPrincipal SignedIn() => new(new ClaimsIdentity(
        [new Claim(ClaimTypes.NameIdentifier, Guid.CreateVersion7().ToString())], "test"));

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public void Signed_in_visitors_see_a_profile_whatever_the_host_chose(bool hostAllowsAnonymous)
        => Assert.True(SignedIn().CanSeeProfileOf(new User { ProfileVisibleToAnonymous = hostAllowsAnonymous }));

    [Fact]
    public void Anonymous_visitors_see_only_the_hosts_who_opted_in()
    {
        Assert.True(Anonymous().CanSeeProfileOf(new User { ProfileVisibleToAnonymous = true }));
        Assert.False(Anonymous().CanSeeProfileOf(new User { ProfileVisibleToAnonymous = false }));
    }

    /// The default has to be the private side of the choice.
    [Fact]
    public void A_new_account_is_not_visible_to_anonymous_visitors()
        => Assert.False(new User().ProfileVisibleToAnonymous);
}

/// Counts the password hashes a sign-in pays for, which is what the timing leak was made of.
file class CountingHasher : IPasswordHasher<User>
{
    readonly PasswordHasher<User> real = new();

    public int Calls { get; private set; }

    public string HashPassword(User user, string password)
    {
        Calls++;
        return real.HashPassword(user, password);
    }

    public PasswordVerificationResult VerifyHashedPassword(User user, string hashed, string provided)
    {
        Calls++;
        return real.VerifyHashedPassword(user, hashed, provided);
    }
}

/// A refusal used to cost a PBKDF2 pass for a registered address and nothing at all for an
/// unknown one, so the response time said which addresses have an account here — the same thing
/// register and login refuse to say in words.
public class LoginTests
{
    static AuthController Auth(TestIdentity identity) =>
        new(identity.Users, identity.SignIn,
            new TokenService(new JwtOptions { Issuer = "test", Key = "a-signing-key-long-enough-for-hmac-sha256" }),
            NullLogger<AuthController>.Instance)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };

    [Theory]
    [InlineData("anna@test.local")]   // has an account
    [InlineData("nobody@test.local")] // has none
    public async Task Every_refusal_costs_one_password_hash(string address)
    {
        using var t = new TestDb();
        using var identity = new TestIdentity(t.Db);
        var anna = new User { UserName = "anna@test.local", Email = "anna@test.local", Name = "Anna", City = "Milano" };
        Assert.True((await identity.Users.CreateAsync(anna, "Password123!")).Succeeded);

        var hasher = new CountingHasher();
        identity.Users.PasswordHasher = hasher;
        var result = await Auth(identity).Login(new LoginRequest(address, "not-the-password"));

        Assert.Equal(StatusCodes.Status401Unauthorized, Assert.IsType<ObjectResult>(result).StatusCode);
        Assert.Equal(1, hasher.Calls);
    }
}

/// Moderator powers are granted to an account, never to an address: registration does not check
/// that the person typing an address owns it.
public class ModeratorSeedTests
{
    static readonly ILogger Log = NullLogger.Instance;

    [Fact]
    public async Task A_configured_account_id_becomes_a_moderator()
    {
        using var t = new TestDb();
        using var identity = new TestIdentity(t.Db);
        var anna = t.AddUser("anna");

        await ModeratorSeed.ApplyAsync([anna.ToString()], identity.Users, identity.Roles, Log);

        var seeded = await identity.Users.FindByIdAsync(anna.ToString());
        Assert.Equal([Roles.Moderator], await identity.Users.GetRolesAsync(seeded!));
    }

    /// The old seeding looked the address up: whoever registered it first got the powers.
    [Fact]
    public async Task An_address_in_the_list_grants_nothing()
    {
        using var t = new TestDb();
        using var identity = new TestIdentity(t.Db);
        const string Address = "impostor@test.local";
        var impostor = t.AddUser("impostor"); // registered as impostor@test.local

        await ModeratorSeed.ApplyAsync([Address], identity.Users, identity.Roles, Log);

        // The address does resolve to that account — the lookup the old code did. It is the rule
        // that changed, not the fixture.
        Assert.Equal(impostor, (await identity.Users.FindByEmailAsync(Address))!.Id);
        Assert.Empty(await identity.Users.GetRolesAsync((await identity.Users.FindByIdAsync(impostor.ToString()))!));
    }
}

/// Blocking is reversible in the API and unreachable everywhere else: a blocked member is gone
/// from discovery, from the inbox and from every profile lookup. This list is the way back.
public class BlockListTests
{
    [Fact]
    public async Task My_blocks_are_listed_to_me_alone_and_can_be_undone()
    {
        using var t = new TestDb();
        var (anna, bruno, carla) = (t.AddVerifiedUser("anna"), t.AddVerifiedUser("bruno"), t.AddVerifiedUser("carla"));
        var safety = new SafetyController(t.Db).As(anna);

        await safety.Block(bruno);
        await safety.Block(carla);

        var blocked = (await safety.Blocks()).Value!;
        Assert.Equal(2, blocked.Items.Count);
        Assert.Contains(blocked.Items, c => c.Id == bruno);
        Assert.Contains(blocked.Items, c => c.Id == carla);

        await safety.Unblock(bruno);
        Assert.Equal([carla], (await safety.Blocks()).Value!.Items.Select(c => c.Id));

        // Being blocked is not the same as blocking: Bruno's own list stays empty.
        Assert.Empty((await new SafetyController(t.Db).As(bruno).Blocks()).Value!.Items);
    }
}
