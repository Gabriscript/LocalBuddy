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
/// <param name="Pending">
/// No verdict yet: somebody else decides later (a moderator in the pilot, ADR-0011; Stripe
/// Identity answers asynchronously too). Verified and IsAdult mean nothing while it is true.
/// </param>
public record IdentityCheck(bool Verified, bool IsAdult, string? SubjectHash, bool Pending = false);

public interface IIdentityVerifier
{
    Task<IdentityCheck> VerifyAsync(Guid userId);
}

/// One notification for one device. Url is the app route a tap opens.
public record PushMessage(string To, string Title, string Body, string Url);

public interface IPushSender
{
    /// Returns the tokens the push service says no longer reach a device, so they can be dropped.
    Task<IReadOnlyList<string>> SendAsync(IReadOnlyList<PushMessage> messages, CancellationToken cancellationToken);
}
