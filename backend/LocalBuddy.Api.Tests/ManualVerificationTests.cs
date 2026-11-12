using System.Reflection;
using LocalBuddy.Api.Controllers;
using LocalBuddy.Api.Dtos;
using LocalBuddy.Api.Services;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;

namespace LocalBuddy.Api.Tests;

file class NoStorage : IPhotoStorage
{
    public Task<string> SaveJpegAsync(Stream jpeg, CancellationToken ct = default) => Task.FromResult("");
    public Task<Stream?> OpenReadAsync(string key, CancellationToken ct = default) => Task.FromResult<Stream?>(null);
    public Task DeleteAsync(string key, CancellationToken ct = default) => Task.CompletedTask;
}

/// ADR-0011: in the pilot on Demo a member's verification request waits for a moderator, who
/// approves identity and age by hand; Development keeps approving everybody at once.
public class ManualVerificationTests
{
    static UsersController Users(TestDb t, Guid caller, IIdentityVerifier verifier) =>
        new UsersController(t.Db, verifier, new NoStorage()).As(caller);

    static ModerationController Moderation(TestDb t, Guid moderator) =>
        new ModerationController(t.Db, NullLogger<ModerationController>.Instance).As(moderator);

    static async Task<VerificationResult> Ask(TestDb t, Guid member, IIdentityVerifier verifier) =>
        Assert.IsType<VerificationResult>(Assert.IsType<OkObjectResult>(await Users(t, member, verifier).Verify()).Value);

    static async Task<IActionResult?> Gate(TestDb t, Guid caller)
    {
        var http = new DefaultHttpContext
        {
            RequestServices = new ServiceCollection().AddSingleton(t.Db).BuildServiceProvider(),
            User = TestCaller.For(caller)
        };
        var context = new AuthorizationFilterContext(new ActionContext(http, new RouteData(), new ActionDescriptor()), []);
        await new RequiresVerifiedIdentityAttribute().OnAuthorizationAsync(context);
        return context.Result;
    }

    [Fact]
    public async Task On_the_pilot_a_request_leaves_the_member_pending()
    {
        using var t = new TestDb();
        var anna = t.AddUser("anna");

        var result = await Ask(t, anna, new ManualIdentityVerifier());

        Assert.Equal(new VerificationResult(false, false, true), result);
        var user = (await t.Db.Users.FindAsync(anna))!;
        Assert.False(user.IdentityVerified);
        Assert.Null(user.IdentitySubjectHash);
        Assert.True((await Users(t, anna, new ManualIdentityVerifier()).Me()).Value!.IdentityVerificationPending);
        Assert.NotNull(await Gate(t, anna)); // still cannot reach anybody

        var queue = (await Moderation(t, t.AddUser("mod")).PendingVerifications()).Value!;
        Assert.Equal([anna], queue.Items.Select(p => p.UserId));
    }

    [Fact]
    public async Task Asking_again_keeps_the_place_in_the_queue()
    {
        using var t = new TestDb();
        var anna = t.AddUser("anna");
        await Ask(t, anna, new ManualIdentityVerifier());
        var first = (await t.Db.Users.FindAsync(anna))!.IdentityVerificationRequestedAt;

        await Ask(t, anna, new ManualIdentityVerifier());

        Assert.Equal(first, (await t.Db.Users.FindAsync(anna))!.IdentityVerificationRequestedAt);
    }

    [Fact]
    public async Task Moderator_approval_verifies_and_unlocks_contact()
    {
        using var t = new TestDb();
        var anna = t.AddUser("anna");
        var mod = t.AddUser("mod");
        await Ask(t, anna, new ManualIdentityVerifier());

        Assert.IsType<NoContentResult>(await Moderation(t, mod).Verify(anna));

        var user = (await t.Db.Users.FindAsync(anna))!;
        Assert.True(user.IdentityVerified);
        Assert.True(user.AgeVerified);
        Assert.Null(await Gate(t, anna));
        Assert.Empty((await Moderation(t, mod).PendingVerifications()).Value!.Items);
        Assert.False((await Users(t, anna, new ManualIdentityVerifier()).Me()).Value!.IdentityVerificationPending);
        // Asking again after approval reports the approval, not a new wait.
        Assert.Equal(new VerificationResult(true, true, false), await Ask(t, anna, new ManualIdentityVerifier()));
    }

    [Fact]
    public async Task A_banned_account_is_not_approved()
    {
        using var t = new TestDb();
        var anna = t.AddUser("anna");
        var mod = t.AddUser("mod");
        (await t.Db.Users.FindAsync(anna))!.BannedAt = DateTime.UtcNow;
        await t.Db.SaveChangesAsync();

        var result = Assert.IsType<ObjectResult>(await Moderation(t, mod).Verify(anna));

        Assert.Equal((409, "user_banned"), (result.StatusCode, (result.Value as ProblemDetails)?.Extensions["code"]?.ToString()));
        Assert.False((await t.Db.Users.FindAsync(anna))!.IdentityVerified);
    }

    [Fact]
    public async Task Approval_is_idempotent()
    {
        using var t = new TestDb();
        var anna = t.AddUser("anna");
        var mod = t.AddUser("mod");

        Assert.IsType<NoContentResult>(await Moderation(t, mod).Verify(anna));
        Assert.IsType<NoContentResult>(await Moderation(t, mod).Verify(anna));

        Assert.True((await t.Db.Users.FindAsync(anna))!.IdentityVerified);
        Assert.IsType<NotFoundResult>(await Moderation(t, mod).Verify(Guid.NewGuid()));
    }

    [Fact]
    public async Task A_member_who_is_not_a_moderator_is_refused()
    {
        using var t = new TestDb();
        var http = new DefaultHttpContext
        {
            RequestServices = new ServiceCollection().AddSingleton(t.Db).BuildServiceProvider(),
            User = TestCaller.For(t.AddVerifiedUser("anna"))
        };
        var context = new AuthorizationFilterContext(new ActionContext(http, new RouteData(), new ActionDescriptor()), []);

        // The approval and the queue sit behind the controller-wide gate.
        var gate = typeof(ModerationController).GetCustomAttribute<RequiresModeratorAttribute>();
        Assert.NotNull(gate);
        await gate.OnAuthorizationAsync(context);

        Assert.Equal(StatusCodes.Status403Forbidden, Assert.IsType<ObjectResult>(context.Result).StatusCode);
    }

    [Fact]
    public async Task Development_still_approves_at_once()
    {
        using var t = new TestDb();
        var anna = t.AddUser("anna");

        Assert.Equal(new VerificationResult(true, true, false), await Ask(t, anna, new FakeIdentityVerifier()));
        Assert.Null((await t.Db.Users.FindAsync(anna))!.IdentityVerificationRequestedAt);
        Assert.Null(await Gate(t, anna));
    }
}

/// The behaviour follows the environment, not a flag (ADR-0002, ADR-0011): this is the wiring.
public class VerifierWiringTests(WebApplicationFactory<Program> app) : IClassFixture<WebApplicationFactory<Program>>
{
    [Theory]
    [InlineData("Development", typeof(FakeIdentityVerifier))]
    [InlineData("Demo", typeof(ManualIdentityVerifier))]
    public void Each_environment_gets_its_verifier(string environment, Type expected)
    {
        using var host = app.WithWebHostBuilder(b => b
            .UseEnvironment(environment)
            // Demo takes these from deploy/demo/.env; nothing here connects or signs anything.
            .UseSetting("Jwt:Key", "a-test-only-signing-key-long-enough-for-hmac")
            .UseSetting("ConnectionStrings:Default", "Host=localhost;Database=unused"));

        Assert.IsType(expected, host.Services.GetRequiredService<IIdentityVerifier>());
    }
}
