using Microsoft.AspNetCore.Identity;

namespace LocalBuddy.Api.Models;

// Identity gives us Id, Email, PasswordHash, lockout, etc. Everything below is LocalBuddy own.
public class User : IdentityUser<Guid>
{
    public string Name { get; set; } = "";
    public string City { get; set; } = "";
    public string Role { get; set; } = ""; // host / guest / entrambi — domain role, unrelated to Identity roles

    // Guided prompts rather than one free-text bio: they give a stranger the three things they
    // actually need to judge an invitation, and they are far harder to turn into an advert.
    public string WhatWeWillDo { get; set; } = "";
    public string WhyIHost { get; set; } = "";
    public string LanguagesSpoken { get; set; } = "";

    public bool IdentityVerified { get; set; }
    public bool AgeVerified { get; set; }
    public int CreditsBalance { get; set; }

    // traits (GUIDELINES §9)
    public bool HasCar { get; set; }
    public bool Smokes { get; set; }
    public bool HasPets { get; set; }

    /// Each host decides whether their public profile is readable by visitors who are not
    /// signed in. Default is app users only: the safe side of the choice. ADR-0006.
    public bool ProfileVisibleToAnonymous { get; set; }

    /// Set by a moderator when the account breaks the platform rules. A ban stops the account
    /// from using the service; it does not hide the site. See ADR-0005.
    public DateTime? BannedAt { get; set; }
    public string? BanReason { get; set; }

    /// Stable handle for the human behind the document, as returned by the identity provider
    /// and stored hashed. It is what lets a banned person be recognised on a second account.
    /// Null until identity verification has run. We never see or store the document (GUIDELINES §9).
    public string? IdentitySubjectHash { get; set; }

    public List<Photo> Photos { get; set; } = [];
    public List<Availability> Availabilities { get; set; } = [];
    public Listing? Listing { get; set; }
}
