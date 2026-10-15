using System.Security.Claims;
using LocalBuddy.Api.Controllers;
using LocalBuddy.Api.Dtos;
using LocalBuddy.Api.Models;
using LocalBuddy.Api.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;
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

/// A token says what was true when it was issued, and says it for 30 days. Moderation asks the
/// database instead.
public class ModeratorGateTests
{
    static AuthorizationFilterContext ContextFor(TestDb t, ClaimsPrincipal caller)
    {
        var http = new DefaultHttpContext
        {
            RequestServices = new ServiceCollection().AddSingleton(t.Db).BuildServiceProvider(),
            User = caller
        };
        return new AuthorizationFilterContext(new ActionContext(http, new RouteData(), new ActionDescriptor()), []);
    }

    static ClaimsPrincipal WithModeratorClaim(Guid id) =>
        new(new ClaimsIdentity(
            [new Claim(ClaimTypes.NameIdentifier, id.ToString()), new Claim(ClaimTypes.Role, Roles.Moderator)], "test"));

    static void GrantModerator(TestDb t, Guid id)
    {
        var role = new IdentityRole<Guid>(Roles.Moderator) { Id = Guid.CreateVersion7() };
        t.Db.Add(role);
        t.Db.Add(new IdentityUserRole<Guid> { UserId = id, RoleId = role.Id });
        t.Db.SaveChanges();
    }

    /// The whole point: the role was taken away, the token still carries it.
    [Fact]
    public async Task A_moderator_claim_in_the_token_is_not_enough()
    {
        using var t = new TestDb();
        var context = ContextFor(t, WithModeratorClaim(t.AddUser("stoodDown")));

        await new RequiresModeratorAttribute().OnAuthorizationAsync(context);

        var problem = Assert.IsType<ProblemDetails>(Assert.IsType<ObjectResult>(context.Result).Value);
        Assert.Equal(StatusCodes.Status403Forbidden, problem.Status);
        Assert.Equal("moderator_only", problem.Extensions["code"]);
    }

    /// And the other way round: the role granted since the token was issued already counts.
    [Fact]
    public async Task The_role_in_the_database_lets_the_request_through()
    {
        using var t = new TestDb();
        var anna = t.AddUser("anna");
        GrantModerator(t, anna);
        var context = ContextFor(t, TestCaller.For(anna)); // no role claim in the token

        await new RequiresModeratorAttribute().OnAuthorizationAsync(context);

        Assert.Null(context.Result);
    }
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

file class OnePhoto : IPhotoStorage
{
    public Task<string> SaveJpegAsync(Stream jpeg, CancellationToken ct = default) => Task.FromResult("key");
    public Task<Stream?> OpenReadAsync(string key, CancellationToken ct = default)
        => Task.FromResult<Stream?>(new MemoryStream([1, 2, 3]));
    public Task DeleteAsync(string key, CancellationToken ct = default) => Task.CompletedTask;
}

/// Discovery hides blocked and banned members, but the profile, the photo bytes and the reviews
/// are all reachable by id — from an old screenshot, a saved link, a client that kept the id.
/// The rules have to hold on these reads too.
public class ProfileSurfaceTests
{
    static UsersController Users(TestDb t, Guid caller) =>
        new UsersController(t.Db, new StubVerifier("unused"), new UnusedStorage()).As(caller);

    static Task BlockBetween(TestDb t, Guid blocker, Guid blocked) =>
        new SafetyController(t.Db).As(blocker).Block(blocked);

    static void AddReview(TestDb t, Guid author, Guid subject)
    {
        t.Db.Reviews.Add(new Review
        {
            Id = Guid.CreateVersion7(), AuthorId = author, SubjectId = subject, Rating = 5, Comment = "Ottimo"
        });
        t.Db.SaveChanges();
    }

    [Fact]
    public async Task A_block_hides_the_profile_from_both_sides()
    {
        using var t = new TestDb();
        var (anna, bruno) = (t.AddVerifiedUser("anna"), t.AddVerifiedUser("bruno"));
        await BlockBetween(t, anna, bruno);

        Assert.IsType<NotFoundResult>((await Users(t, bruno).GetById(anna)).Result);
        Assert.IsType<NotFoundResult>((await Users(t, anna).GetById(bruno)).Result);
    }

    [Fact]
    public async Task A_block_hides_the_reviews_with_the_profile()
    {
        using var t = new TestDb();
        var (anna, bruno, carla) = (t.AddVerifiedUser("anna"), t.AddVerifiedUser("bruno"), t.AddVerifiedUser("carla"));
        AddReview(t, carla, anna);
        await BlockBetween(t, anna, bruno);

        Assert.IsType<NotFoundResult>((await new ReviewsController(t.Db).As(bruno).ForUser(anna)).Result);
        // Everyone else still reads them.
        Assert.Single((await new ReviewsController(t.Db).As(carla).ForUser(anna)).Value!.Items);
    }

    [Fact]
    public async Task A_banned_members_reviews_go_with_the_profile()
    {
        using var t = new TestDb();
        var (anna, carla) = (t.AddVerifiedUser("anna"), t.AddVerifiedUser("carla"));
        AddReview(t, carla, anna);
        (await t.Db.Users.FindAsync(anna))!.BannedAt = DateTime.UtcNow;
        await t.Db.SaveChangesAsync();

        Assert.IsType<NotFoundResult>((await new ReviewsController(t.Db).As(carla).ForUser(anna)).Result);
    }

    /// The profile stopped showing home photos the moment overnight hosting went off; the bytes
    /// kept coming to anyone holding the URL.
    [Fact]
    public async Task A_home_photo_is_served_only_while_the_host_offers_overnight()
    {
        using var t = new TestDb();
        var (anna, bruno) = (t.AddVerifiedUser("anna"), t.AddVerifiedUser("bruno"));
        var photo = new Photo { Id = Guid.CreateVersion7(), UserId = anna, Type = PhotoType.Home, Url = "key" };
        var listing = new Listing
        {
            Id = Guid.CreateVersion7(), UserId = anna, OffersOvernight = true, OvernightComplianceAck = true
        };
        t.Db.Photos.Add(photo);
        t.Db.Listings.Add(listing);
        await t.Db.SaveChangesAsync();
        var photos = new PhotosController(t.Db, new OnePhoto()).As(bruno);

        Assert.IsType<FileStreamResult>(await photos.Content(photo.Id));

        listing.OffersOvernight = false;
        await t.Db.SaveChangesAsync();

        Assert.IsType<NotFoundResult>(await photos.Content(photo.Id));
    }

    [Fact]
    public async Task A_block_hides_the_photo_bytes()
    {
        using var t = new TestDb();
        var (anna, bruno) = (t.AddVerifiedUser("anna"), t.AddVerifiedUser("bruno"));
        var photo = new Photo { Id = Guid.CreateVersion7(), UserId = anna, Type = PhotoType.Profile, Url = "key" };
        t.Db.Photos.Add(photo);
        await t.Db.SaveChangesAsync();
        await BlockBetween(t, bruno, anna);

        Assert.IsType<NotFoundResult>(await new PhotosController(t.Db, new OnePhoto()).As(bruno).Content(photo.Id));
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
