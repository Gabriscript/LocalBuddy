using System.Security.Claims;
using LocalBuddy.Api.Controllers;
using LocalBuddy.Api.Models;
using LocalBuddy.Api.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

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
