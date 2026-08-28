namespace LocalBuddy.Api.Services;

/// Every amount the platform charges or credits, in one place — previously these numbers were
/// scattered across PaymentsController and ReviewsController with no single definition.
/// GUIDELINES §2: unlocking a contact is the only thing that may ever be charged for.
public static class Pricing
{
    public const decimal Unlock = 4.99m;
    public const decimal MonthlySubscription = 9.99m;
    public const decimal YearlySubscription = 79.99m;

    /// GUIDELINES §4: credits are earned by hosting and spent instead of cash.
    public const int UnlockCreditCost = 1;
    public const int HostReviewReward = 1;
}
