using LocalBuddy.Api.Models;

namespace LocalBuddy.Api.Dtos;

// Response shapes. Entities are never returned directly: the wire contract should not move
// every time a column does.

public record AvailabilityDto(TimeOfDay TimeOfDay, DateOnly? SeasonStart, DateOnly? SeasonEnd)
{
    public static AvailabilityDto From(Availability a) => new(a.TimeOfDay, a.SeasonStart, a.SeasonEnd);
}

public record ListingDto(bool OffersExperience, bool OffersOvernight, bool OvernightComplianceAck)
{
    public static ListingDto? From(Listing? l) =>
        l is null ? null : new(l.OffersExperience, l.OffersOvernight, l.OvernightComplianceAck);
}

public record MessageDto(Guid Id, Guid ConversationId, Guid SenderId, string Content, DateTime SentAt)
{
    public static MessageDto From(Message m) => new(m.Id, m.ConversationId, m.SenderId, m.Content, m.SentAt);
}

public record ConversationSummary(
    Guid Id, Guid OtherUserId, bool UnlockedByPayment, DateTime CreatedAt, string? LastMessage);

public record ReviewDto(Guid Id, Guid AuthorId, Guid SubjectId, int Rating, string Comment, DateTime CreatedAt)
{
    public static ReviewDto From(Review r) => new(r.Id, r.AuthorId, r.SubjectId, r.Rating, r.Comment, r.CreatedAt);
}

public record ReportDto(
    Guid Id, Guid ReporterId, Guid ReportedId, string Reason, ReportStatus Status, DateTime CreatedAt)
{
    public static ReportDto From(Report r) =>
        new(r.Id, r.ReporterId, r.ReportedId, r.Reason, r.Status, r.CreatedAt);
}

public record SubscriptionDto(Guid Id, string PlanType, string Status, DateTime ExpiresAt)
{
    public static SubscriptionDto From(Subscription s) => new(s.Id, s.PlanType, s.Status, s.ExpiresAt);
}

/// What the owner sees about themselves: the only place email and credit balance appear.
public record MyProfile(
    Guid Id, string? Email, string Name, string City, string Role,
    string WhatWeWillDo, string WhyIHost, string LanguagesSpoken,
    bool IdentityVerified, bool AgeVerified, int CreditsBalance,
    bool HasCar, bool Smokes, bool HasPets, bool ProfileVisibleToAnonymous,
    List<PhotoDto> Photos, List<AvailabilityDto> Availability, ListingDto? Listing);

/// Result of an authentication attempt.
public record AuthResult(string Token, Guid UserId);

/// Outcome of expressing interest in somebody.
public record InterestResult(bool Matched, Guid? ConversationId);

/// Outcome of a paid unlock. `Charged` is a fixed token, never prose:
/// one-time | credits | subscription | none.
public record UnlockResult(Guid ConversationId, string Charged);

/// Verification verdict returned to the member.
public record VerificationResult(bool IdentityVerified, bool AgeVerified);
