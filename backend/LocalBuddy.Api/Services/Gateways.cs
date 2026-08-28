namespace LocalBuddy.Api.Services;

// Contracts for the external services LocalBuddy depends on but does not implement.
// They live apart from any implementation because the contracts are the stable half:
// the fakes in Fakes.cs are throwaway, these are not.

public interface IPaymentGateway
{
    Task<string> ChargeOneTimeAsync(Guid userId, decimal amount);
    Task<string> StartSubscriptionAsync(Guid userId, string planType);
}

/// Outcome of a third-party document check. GUIDELINES §9: we never receive or store the
/// document itself, only this verdict.
/// <param name="SubjectHash">
/// Stable handle for the person behind the document — the same human verifying again returns
/// the same value. It is what allows a banned person to be recognised on a new account, and it
/// is the only reason this is more than a boolean. Null when the check did not identify anyone.
/// </param>
public record IdentityCheck(bool Verified, bool IsAdult, string? SubjectHash);

public interface IIdentityVerifier
{
    Task<IdentityCheck> VerifyAsync(Guid userId);
}
