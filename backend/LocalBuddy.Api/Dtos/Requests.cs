using System.ComponentModel.DataAnnotations;
using LocalBuddy.Api.Models;

namespace LocalBuddy.Api.Dtos;

// Request bodies, kept out of the controllers so the whole wire contract is one greppable
// surface. Every free-text field is bounded here and again in the database: without a limit
// a caller can store half a megabyte in a profile, which we verified they could.

public record RegisterRequest(
    [Required, EmailAddress, StringLength(Limits.Email)] string Email,
    [Required, StringLength(Limits.Password, MinimumLength = 8)] string Password,
    [Required, StringLength(Limits.Name)] string Name,
    [Required, StringLength(Limits.City)] string City,
    [Required, StringLength(Limits.Role)] string Role);

public record LoginRequest(
    [Required, StringLength(Limits.Email)] string Email,
    [Required, StringLength(Limits.Password)] string Password);

public record ProfileUpdate(
    [Required, StringLength(Limits.Name)] string Name,
    [Required, StringLength(Limits.City)] string City,
    [Required, StringLength(Limits.Role)] string Role,
    [StringLength(Limits.Prompt)] string WhatWeWillDo,
    [StringLength(Limits.Prompt)] string WhyIHost,
    [StringLength(Limits.Languages)] string LanguagesSpoken,
    bool HasCar,
    bool Smokes,
    bool HasPets,
    bool ProfileVisibleToAnonymous);

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

