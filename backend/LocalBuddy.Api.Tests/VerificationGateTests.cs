using System.Security.Claims;
using LocalBuddy.Api.Data;
using LocalBuddy.Api.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace LocalBuddy.Api.Tests;

/// ADR-0007: reaching another member takes a verified identity. This is also what makes a ban
/// stick, so it is worth a test of its own rather than trusting the attribute is still there.
public class VerificationGateTests
{
    static AuthorizationFilterContext ContextFor(TestDb t, Guid caller)
    {
        var services = new ServiceCollection();
        services.AddSingleton(t.Db);

        var http = new DefaultHttpContext
        {
            RequestServices = services.BuildServiceProvider(),
            User = new ClaimsPrincipal(new ClaimsIdentity(
                [new Claim(ClaimTypes.NameIdentifier, caller.ToString())], "test"))
        };

        return new AuthorizationFilterContext(
            new ActionContext(http, new RouteData(), new ActionDescriptor()), []);
    }

    [Fact]
    public async Task An_unverified_member_cannot_reach_anybody()
    {
        using var t = new TestDb();
        var context = ContextFor(t, t.AddUser("unverified"));

        await new RequiresVerifiedIdentityAttribute().OnAuthorizationAsync(context);

        Assert.Equal(StatusCodes.Status403Forbidden,
            Assert.IsType<ObjectResult>(context.Result).StatusCode);
    }

    [Fact]
    public async Task A_verified_member_passes_through()
    {
        using var t = new TestDb();
        var id = t.AddUser("verified");
        var user = await t.Db.Users.FindAsync(id);
        user!.IdentityVerified = true;
        await t.Db.SaveChangesAsync();

        var context = ContextFor(t, id);
        await new RequiresVerifiedIdentityAttribute().OnAuthorizationAsync(context);

        Assert.Null(context.Result);
    }

    [Fact]
    public async Task An_anonymous_caller_is_refused_rather_than_crashing()
    {
        using var t = new TestDb();
        var services = new ServiceCollection();
        services.AddSingleton(t.Db);
        var http = new DefaultHttpContext { RequestServices = services.BuildServiceProvider() };
        var context = new AuthorizationFilterContext(
            new ActionContext(http, new RouteData(), new ActionDescriptor()), []);

        await new RequiresVerifiedIdentityAttribute().OnAuthorizationAsync(context);

        Assert.Equal(StatusCodes.Status403Forbidden,
            Assert.IsType<ObjectResult>(context.Result).StatusCode);
    }
}
