using LocalBuddy.Api.Models;

namespace LocalBuddy.Api.Dtos;

/// Photos are never linked to directly: the URL points at PhotosController, which applies the
/// same visibility rule as the profile itself. See ADR-0006.
public record PhotoDto(Guid Id, PhotoType Type, string Url)
{
    public static string UrlFor(Guid id) => $"/api/v1/photos/{id}/content";
    public static PhotoDto From(Photo p) => new(p.Id, p.Type, UrlFor(p.Id));
}

/// The single definition of what a profile exposes to anyone who is not its owner.
/// GUIDELINES §3: no email, no surname, no credit balance. Both public endpoints project
/// through here, so what counts as "public" cannot drift between them.
public record PublicProfile(
    Guid Id, string Name, string City, string Role,
    string WhatWeWillDo, string WhyIHost, string LanguagesSpoken,
    bool IdentityVerified, bool HasCar, bool Smokes, bool HasPets,
    List<DayOfWeek> UsualDays, ActivityStyle? ActivityStyle, Lifestyle? Lifestyle, bool FreeToday)
{
    public static PublicProfile From(User u) =>
        new(u.Id, u.Name, u.City, u.Role, u.WhatWeWillDo, u.WhyIHost, u.LanguagesSpoken,
            u.IdentityVerified, u.HasCar, u.Smokes, u.HasPets,
            Models.UsualDays.FromMask(u.UsualDays), u.ActivityStyle, u.Lifestyle, u.FreeUntil > DateTime.UtcNow);
}

/// Full profile page. Derives from PublicProfile so the JSON stays flat and the inherited
/// fields cannot be forgotten.
public record ProfileDetail : PublicProfile
{
    public ProfileDetail(PublicProfile p, List<PhotoDto> photos, List<AvailabilityDto> availability,
                         ListingDto? listing, double? rating) : base(p)
        => (Photos, Availability, Listing, Rating) = (photos, availability, listing, rating);

    public List<PhotoDto> Photos { get; init; }
    public List<AvailabilityDto> Availability { get; init; }
    public ListingDto? Listing { get; init; }
    public double? Rating { get; init; }
    /// ADR-0017: all references, those from people this member hosted, and from people who hosted them.
    public int References { get; init; }
    public int ReferencesAsHost { get; init; }
    public int ReferencesAsTraveller { get; init; }
}

/// What other members see of a trip: where and when, never its id.
public record PublicTrip(string City, DateOnly From, DateOnly To);

/// Discovery result: the same public fields, plus what a swipe card needs.
public record ProfileCard : PublicProfile
{
    public ProfileCard(PublicProfile p, string? photoUrl, double? rating, PublicTrip? trip = null) : base(p)
        => (PhotoUrl, Rating, Trip) = (photoUrl, rating, trip);

    public string? PhotoUrl { get; init; }
    public double? Rating { get; init; }
    /// As on ProfileDetail (ADR-0017); left at 0 on the blocks list, which carries no rating either.
    public int References { get; init; }
    public int ReferencesAsHost { get; init; }
    public int ReferencesAsTraveller { get; init; }
    /// The member's earliest active trip to the city searched for; null for residents and without a city.
    /// On my received requests: the asker's earliest active trip to my city or to a city I am visiting.
    public PublicTrip? Trip { get; init; }
    /// What the member wrote when asking me to meet; set on my received requests only (ADR-0015).
    public string? Note { get; init; }
}
