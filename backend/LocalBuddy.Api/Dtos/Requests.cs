using System.ComponentModel.DataAnnotations;
using LocalBuddy.Api.Models;

namespace LocalBuddy.Api.Dtos;

// Request bodies, kept out of the controllers so the whole wire contract is one greppable
// surface. Every free-text field is bounded here and again in the database: without a limit
// a caller can store half a megabyte in a profile, which we verified they could.

static class DomainRoles
{
    /// Discovery filters on these exact values, so "Host" would make a member invisible.
    public const string Pattern = "host|guest|entrambi";
}

public record RegisterRequest(
    [Required, EmailAddress, StringLength(Limits.Email)] string Email,
    [Required, StringLength(Limits.Password, MinimumLength = 8)] string Password,
    [Required, StringLength(Limits.Name)] string Name,
    [Required, StringLength(Limits.City)] string City,
    [Required, StringLength(Limits.Role), RegularExpression(DomainRoles.Pattern)] string Role);

public record LoginRequest(
    [Required, StringLength(Limits.Email)] string Email,
    [Required, StringLength(Limits.Password)] string Password);

public record ProfileUpdate(
    [Required, StringLength(Limits.Name)] string Name,
    [Required, StringLength(Limits.City)] string City,
    [Required, StringLength(Limits.Role), RegularExpression(DomainRoles.Pattern)] string Role,
    [StringLength(Limits.Prompt)] string WhatWeWillDo,
    [StringLength(Limits.Prompt)] string WhyIHost,
    [StringLength(Limits.Languages)] string LanguagesSpoken,
    bool HasCar,
    bool Smokes,
    bool HasPets,
    bool ProfileVisibleToAnonymous,
    // Optional so a client that predates them still validates; it clears them, as a PUT does.
    List<DayOfWeek>? UsualDays = null,
    ActivityStyle? ActivityStyle = null,
    Lifestyle? Lifestyle = null);

/// The instant "Free today" ends; the server accepts at most 24 hours ahead.
public record FreeToday(DateTime Until);

public record NewTrip(
    [Required, StringLength(Limits.City)] string City,
    DateOnly From,
    DateOnly To);

static class PushPatterns
{
    /// What expo-notifications' getExpoPushTokenAsync returns, e.g. ExponentPushToken[xxxx].
    public const string Token = @"(Exponent|Expo)PushToken\[[^\[\]\s]+\]";
    /// The app's languages. fi, sv and de arrive with the languages step and are accepted already.
    public const string Language = "en|it|es|fr|fi|sv|de";
}

/// The device's Expo push token and the language the app shows on it.
public record PushTokenRegistration(
    [Required, StringLength(Limits.PushToken), RegularExpression(PushPatterns.Token)] string Token,
    [Required, RegularExpression(PushPatterns.Language)] string Language);

public record PushTokenRemoval([Required, StringLength(Limits.PushToken)] string Token);

public record AvailabilitySlot(TimeOfDay TimeOfDay, DateOnly? SeasonStart, DateOnly? SeasonEnd);

public record ListingUpdate(bool OffersExperience, bool OffersOvernight, bool OvernightComplianceAck);

public record NewReview(
    Guid SubjectId,
    [Range(1, 5)] int Rating,
    [StringLength(Limits.Comment)] string Comment);

public record NewReport(
    Guid ReportedId,
    [Required, StringLength(Limits.Reason, MinimumLength = 1)] string Reason);

public record SendMessage(
    [Required, StringLength(Limits.Message, MinimumLength = 1)] string Content);

public record SubscribeRequest([Required, StringLength(Limits.Role)] string PlanType);

public record BanRequest([Required, StringLength(Limits.Reason, MinimumLength = 1)] string Reason);

