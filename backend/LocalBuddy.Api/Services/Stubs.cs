namespace LocalBuddy.Api.Services;

// Stripe (payments + Stripe Identity) needs a live account, so the flows run against
// these until keys exist. Swap the registrations in Program.cs for real implementations —
// nothing else changes.

public interface IPaymentGateway
{
    Task<string> ChargeOneTimeAsync(Guid userId, decimal amount);
    Task<string> StartSubscriptionAsync(Guid userId, string planType);
}

public interface IIdentityVerifier
{
    /// Returns (verified, isAdult). GUIDELINES §9: we never see or store the document itself.
    Task<(bool Verified, bool IsAdult)> VerifyAsync(Guid userId);
}

public class FakePaymentGateway : IPaymentGateway
{
    public Task<string> ChargeOneTimeAsync(Guid userId, decimal amount)
        => Task.FromResult($"fake_pi_{Guid.NewGuid():N}");

    public Task<string> StartSubscriptionAsync(Guid userId, string planType)
        => Task.FromResult($"fake_sub_{Guid.NewGuid():N}");
}

public class FakeIdentityVerifier : IIdentityVerifier
{
    public Task<(bool, bool)> VerifyAsync(Guid userId) => Task.FromResult((true, true));
}
