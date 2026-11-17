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

public record TripDto(Guid Id, string City, DateOnly From, DateOnly To);

public record MessageDto(Guid Id, Guid ConversationId, Guid SenderId, string Content, DateTime SentAt)
{
    public static MessageDto From(Message m) => new(m.Id, m.ConversationId, m.SenderId, m.Content, m.SentAt);
}

public record ConversationSummary(
    Guid Id, Guid OtherUserId, bool UnlockedByPayment, DateTime CreatedAt, string? LastMessage, int UnreadCount);

/// A reference (ADR-0017). The list on a profile names its authors, so they travel with it.
public record ReviewDto(
    Guid Id, Guid AuthorId, Guid SubjectId, int Rating, string Comment, DateTime CreatedAt,
    bool? Recommend, ReferenceContext? Context, string AuthorName, string? AuthorPhotoUrl)
{
    public static ReviewDto From(Review r, string authorName, Guid? authorPhotoId) =>
        new(r.Id, r.AuthorId, r.SubjectId, r.Rating, r.Comment, r.CreatedAt, r.Recommend, r.Context,
            authorName, authorPhotoId is null ? null : PhotoDto.UrlFor(authorPhotoId.Value));
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
    List<DayOfWeek> UsualDays, ActivityStyle? ActivityStyle, Lifestyle? Lifestyle,
    List<PhotoDto> Photos, List<AvailabilityDto> Availability, ListingDto? Listing,
    bool IdentityVerificationPending, DateTime? FreeUntil,
    // The app shows "Reset demo data" on this alone (ADR-0014).
    bool CanResetDemo);

/// Result of an authentication attempt.
public record AuthResult(string Token, Guid UserId);

/// Outcome of expressing interest in somebody.
public record InterestResult(bool Matched, Guid? ConversationId);

/// How many requests are waiting, for a badge that should not have to load the list.
public record RequestCount(int Count);

/// Outcome of a paid unlock. `Charged` is a fixed token, never prose:
/// one-time | credits | subscription | none.
public record UnlockResult(Guid ConversationId, string Charged);

/// Verification verdict returned to the member. Pending: asked, waiting for a moderator (ADR-0011).
public record VerificationResult(bool IdentityVerified, bool AgeVerified, bool Pending);

/// A member waiting for a moderator to approve their identity (ADR-0011). Name and email are
/// what the moderator, who knows every pilot member, recognises them by.
public record PendingVerificationDto(Guid UserId, string Name, string? Email, string City, DateTime RequestedAt);

/// What the next unlock will cost this member, and what the alternatives are. The client must
/// never carry its own copy of a price: the amounts live in Pricing and travel from here.
public record PaymentOptions(
    string Currency, decimal UnlockPrice, decimal MonthlyPrice, decimal YearlyPrice,
    int Credits, int CreditCost, bool Subscribed);
