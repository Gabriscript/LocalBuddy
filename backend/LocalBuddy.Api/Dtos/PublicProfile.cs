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
    bool IdentityVerified, bool HasCar, bool Smokes, bool HasPets)
{
    public static PublicProfile From(User u) =>
        new(u.Id, u.Name, u.City, u.Role, u.WhatWeWillDo, u.WhyIHost, u.LanguagesSpoken,
            u.IdentityVerified, u.HasCar, u.Smokes, u.HasPets);
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
}

/// Discovery result: the same public fields, plus what a swipe card needs.
public record ProfileCard : PublicProfile
{
    public ProfileCard(PublicProfile p, string? photoUrl, double? rating) : base(p)
        => (PhotoUrl, Rating) = (photoUrl, rating);

    public string? PhotoUrl { get; init; }
    public double? Rating { get; init; }
}
