using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using LocalBuddy.Api.Controllers;
using LocalBuddy.Api.Dtos;
using LocalBuddy.Api.Models;
using LocalBuddy.Api.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace LocalBuddy.Api.Tests;

public class JwtOptionsTests
{
    const string LongEnoughKey = "a-signing-key-long-enough-for-hmac-sha256";

    [Theory]
    [InlineData("", LongEnoughKey)]        // no issuer
    [InlineData("localbuddy", "")]         // no key
    [InlineData("localbuddy", "too-short")] // key below the HMAC minimum
    public void Refuses_an_incomplete_configuration(string issuer, string key)
        => Assert.Throws<InvalidOperationException>(
            () => new JwtOptions { Issuer = issuer, Key = key }.Validated());

    [Fact]
    public void Accepts_a_complete_configuration()
    {
        var options = new JwtOptions { Issuer = "localbuddy", Key = LongEnoughKey };
        Assert.Same(options, options.Validated());
    }
}

public class PublicProfileTests
{
    static User Alice() => new()
    {
        Id = Guid.NewGuid(),
        Email = "alice@test.local",
        UserName = "alice@test.local",
        PasswordHash = "hashed",
        Name = "Alice",
        City = "Milano",
        Role = "host",
        WhatWeWillDo = "Un giro nei bar di quartiere",
        WhyIHost = "Per fare pratica di mandarino",
        LanguagesSpoken = "it, en",
        CreditsBalance = 7,
        IdentityVerified = true,
        AgeVerified = true
    };

    /// GUIDELINES §3. PublicProfile exists because this used to be enforced by two
    /// hand-written projections that could drift apart.
    [Theory]
    [InlineData("email")]
    [InlineData("credits")]
    [InlineData("passwordHash")]
    [InlineData("ageVerified")]
    public void Never_exposes_owner_only_fields(string forbidden)
    {
        var profile = PublicProfile.From(Alice());
        var options = new JsonSerializerOptions(JsonSerializerDefaults.Web);
        var detail = JsonSerializer.Serialize(new ProfileDetail(profile, [], [], null, 4.5), options);
        var card = JsonSerializer.Serialize(new ProfileCard(profile, "/api/v1/photos/1/content", 4.5), options);

        Assert.DoesNotContain(forbidden, detail, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain(forbidden, card, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Keeps_the_public_fields_flat_on_the_wire()
    {
        var json = JsonSerializer.Serialize(
            new ProfileCard(PublicProfile.From(Alice()), "/api/v1/photos/1/content", 4.5),
            new JsonSerializerOptions(JsonSerializerDefaults.Web));

        Assert.Contains("\"name\":\"Alice\"", json);
        Assert.Contains("\"photoUrl\":\"/api/v1/photos/1/content\"", json);
    }
}

public class ChatOrderTests
{
    /// The client opens a chat on page 0 and renders it in an inverted FlatList, which expects
    /// the newest message first. Oldest-first showed the chat upside down and froze it at 20.
    [Fact]
    public async Task Page_zero_opens_on_the_newest_messages()
    {
        using var t = new TestDb();
        var (anna, carla) = (t.AddVerifiedUser("anna"), t.AddVerifiedUser("carla"));
        var chat = new Conversation { Id = Guid.CreateVersion7(), UserAId = anna, UserBId = carla };
        t.Db.Conversations.Add(chat);
        var start = DateTime.UtcNow;
        for (var i = 1; i <= 25; i++)
            t.Db.Messages.Add(new Message
            {
                Id = Guid.CreateVersion7(), ConversationId = chat.Id, SenderId = anna,
                Content = $"m{i:00}", SentAt = start.AddSeconds(i)
            });
        await t.Db.SaveChangesAsync();

        var page = (await new ConversationsController(t.Db).As(carla).Messages(chat.Id, null)).Value!;

        Assert.Equal("m25", page.Items[0].Content);
        Assert.Equal("m06", page.Items[^1].Content);
        Assert.True(page.HasMore);
    }
}

public class RequestValidationTests
{
    static UsersController Users(TestDb t, Guid caller) =>
        new UsersController(t.Db, new FakeIdentityVerifier(), new NoPhotos()).As(caller);

    [Fact]
    public async Task Availability_is_capped()
    {
        using var t = new TestDb();
        var slots = Enumerable.Repeat(new AvailabilitySlot(TimeOfDay.Evening, null, null), 3000).ToList();

        Assert.IsType<ObjectResult>(await Users(t, t.AddUser("anna")).SetAvailability(slots));
        Assert.Equal(0, await t.Db.Availabilities.CountAsync());
    }

    [Theory]
    [InlineData(99, null, null)]                       // not a time of day
    [InlineData(0, "2026-12-31", "2026-01-01")]        // season ends before it starts
    public async Task A_nonsensical_slot_is_refused(int timeOfDay, string? start, string? end)
    {
        using var t = new TestDb();
        var slot = new AvailabilitySlot((TimeOfDay)timeOfDay,
            start is null ? null : DateOnly.Parse(start), end is null ? null : DateOnly.Parse(end));

        Assert.IsType<ObjectResult>(await Users(t, t.AddUser("anna")).SetAvailability([slot]));
    }

    [Fact]
    public async Task Valid_availability_replaces_the_old_one()
    {
        using var t = new TestDb();
        var anna = t.AddUser("anna");
        await Users(t, anna).SetAvailability([new(TimeOfDay.Morning, null, null), new(TimeOfDay.Night, null, null)]);
        await Users(t, anna).SetAvailability([new(TimeOfDay.Evening, null, null)]);

        Assert.Equal([TimeOfDay.Evening], await t.Db.Availabilities.Select(a => a.TimeOfDay).ToListAsync());
    }

    [Fact]
    public async Task A_second_active_subscription_is_refused()
    {
        using var t = new TestDb();
        var bruno = t.AddUser("bruno");
        var payments = new PaymentsController(t.Db, new FakePaymentGateway(), new ConversationService(t.Db)).As(bruno);

        await payments.Subscribe(new SubscribeRequest("monthly"));
        var second = Assert.IsType<ObjectResult>(await payments.Subscribe(new SubscribeRequest("yearly")));

        Assert.Equal(StatusCodes.Status409Conflict, second.StatusCode);
        Assert.Equal(1, await t.Db.Payments.CountAsync());
    }

    /// Discovery filters on these exact values; anything else makes a member invisible to it.
    [Theory]
    [InlineData("host", true)]
    [InlineData("guest", true)]
    [InlineData("entrambi", true)]
    [InlineData("Host", false)]
    [InlineData("admin", false)]
    public void Role_is_one_of_the_known_values(string role, bool valid)
    {
        // Positional record attributes sit on the constructor parameter, not the property.
        var parameter = typeof(RegisterRequest).GetConstructors()[0].GetParameters().Single(p => p.Name == "Role");
        var attributes = parameter.GetCustomAttributes(typeof(ValidationAttribute), true).Cast<ValidationAttribute>();

        Assert.Equal(valid, Validator.TryValidateValue(role, new ValidationContext(role), null, attributes));
    }
}

public class ErrorShapeTests
{
    /// ADR-0008: one error shape with a stable code. The client switches on it to send the member
    /// to /verify; the old ad-hoc body came through as code "unknown".
    [Fact]
    public async Task The_verification_gate_answers_with_a_coded_problem()
    {
        using var t = new TestDb();
        var http = new DefaultHttpContext
        {
            RequestServices = new ServiceCollection().AddSingleton(t.Db).BuildServiceProvider(),
            User = TestCaller.For(t.AddUser("unverified"))
        };
        var context = new AuthorizationFilterContext(new ActionContext(http, new RouteData(), new ActionDescriptor()), []);

        await new RequiresVerifiedIdentityAttribute().OnAuthorizationAsync(context);

        var problem = Assert.IsType<ProblemDetails>(Assert.IsType<ObjectResult>(context.Result).Value);
        Assert.Equal("identity_verification_required", problem.Extensions["code"]);
    }
}

/// The price a member is about to pay has one definition, in Pricing, and travels to the client
/// from there. These are about who pays what, not about the numbers themselves.
public class PaymentOptionsTests
{
    static PaymentsController Payments(TestDb t, Guid caller) =>
        new PaymentsController(t.Db, new FakePaymentGateway(), new ConversationService(t.Db)).As(caller);

    [Fact]
    public async Task Without_credits_or_a_subscription_the_next_unlock_costs_money()
    {
        using var t = new TestDb();
        var options = (await Payments(t, t.AddVerifiedUser("anna")).Options()).Value!;

        Assert.False(options.Subscribed);
        Assert.Equal(0, options.Credits);
        Assert.Equal(Pricing.Unlock, options.UnlockPrice);
        Assert.Equal("EUR", options.Currency);
    }

    [Fact]
    public async Task Credits_and_an_active_subscription_are_both_reported()
    {
        using var t = new TestDb();
        var anna = t.AddVerifiedUser("anna");
        (await t.Db.Users.FindAsync(anna))!.CreditsBalance = 3;
        t.Db.Subscriptions.Add(new Subscription
        {
            Id = Guid.CreateVersion7(),
            UserId = anna,
            PlanType = "monthly",
            Status = "active",
            ExpiresAt = DateTime.UtcNow.AddDays(20)
        });
        await t.Db.SaveChangesAsync();

        var options = (await Payments(t, anna).Options()).Value!;

        Assert.True(options.Subscribed);
        Assert.Equal(3, options.Credits);
    }

    [Fact]
    public async Task An_expired_subscription_is_not_an_active_one()
    {
        using var t = new TestDb();
        var anna = t.AddVerifiedUser("anna");
        t.Db.Subscriptions.Add(new Subscription
        {
            Id = Guid.CreateVersion7(),
            UserId = anna,
            PlanType = "monthly",
            Status = "active",
            ExpiresAt = DateTime.UtcNow.AddDays(-1)
        });
        await t.Db.SaveChangesAsync();

        Assert.False((await Payments(t, anna).Options()).Value!.Subscribed);
    }
}

file class NoPhotos : IPhotoStorage
{
    public Task<string> SaveJpegAsync(Stream jpeg, CancellationToken ct = default) => Task.FromResult("");
    public Task<Stream?> OpenReadAsync(string key, CancellationToken ct = default) => Task.FromResult<Stream?>(null);
    public Task DeleteAsync(string key, CancellationToken ct = default) => Task.CompletedTask;
}
