using System.Text.Json;
using LocalBuddy.Api.Dtos;
using LocalBuddy.Api.Models;
using LocalBuddy.Api.Services;

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
