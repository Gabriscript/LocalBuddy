using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using LocalBuddy.Api.Models;

namespace LocalBuddy.Api.Services;

/// DemoData/demo-seed.json, the demo cast (ADR-0014). Read once, never written.
public record DemoSeed(
    string Presenter,
    List<string> Cities,
    List<DemoPerson> People,
    List<DemoMatch> Matches,
    List<DemoRequest> Requests,
    List<DemoReference> References)
{
    public const string Domain = "demo.localbuddy.test";

    static readonly Lazy<DemoSeed> file = new(() => Read(Path.Combine(AppContext.BaseDirectory, "DemoData", "demo-seed.json")));

    public static DemoSeed Current => file.Value;

    public static DemoSeed Read(string path) =>
        JsonSerializer.Deserialize<DemoSeed>(File.ReadAllText(path), new JsonSerializerOptions(JsonSerializerDefaults.Web)
        {
            Converters = { new JsonStringEnumConverter(JsonNamingPolicy.CamelCase) }
        }) ?? throw new InvalidOperationException($"{path} is empty.");

    public static string EmailOf(string key) => $"{key}@{Domain}";

    /// Derived from the address, so a reset recreates the same id and a signed-in presenter's
    /// token still names an existing account afterwards.
    public static Guid IdOf(string key) =>
        new(SHA256.HashData(Encoding.UTF8.GetBytes(EmailOf(key)))[..16]);

    public Guid PresenterId => IdOf(Presenter);
}

/// `role` is host | guest | entrambi, as on the profile.
public record DemoPerson(
    string Key,
    string Name,
    string City,
    string Role,
    string WhatWeWillDo,
    string WhyIHost,
    string Languages,
    bool HasCar,
    bool Smokes,
    bool HasPets,
    List<DayOfWeek> UsualDays,
    ActivityStyle? ActivityStyle,
    Lifestyle? Lifestyle,
    List<TimeOfDay> TimesOfDay,
    bool OffersOvernight,
    string? Photo,
    string? HomePhoto,
    List<DemoTrip> Trips)
{
    public string PhotoFile => Photo ?? $"{Key}.jpg";
}

/// `from` and `to` are days from today; negative for a trip already running.
public record DemoTrip(string City, int From, int To);

/// `a` asked to meet first and `b` said yes, which is what opened the chat.
public record DemoMatch(string A, string B, List<DemoMessage> Messages);

public record DemoMessage(string From, string Text, int MinutesAgo);

/// An "ask to meet" still waiting for an answer from `to`, with the note `from` sent, if any (ADR-0015).
public record DemoRequest(string From, string To, string? Note = null);

/// A reference `from` wrote about `to` (ADR-0017), `context` from the author's side, `daysAgo` days old.
public record DemoReference(string From, string To, bool Recommend, ReferenceContext Context, string Text, int DaysAgo);
