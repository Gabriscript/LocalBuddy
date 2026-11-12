using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Text;

namespace LocalBuddy.Api.Services;

// Stripe (payments + Stripe Identity) needs a live account, so the flows run against these
// until keys exist. Program.cs registers them ONLY in Development: outside it, a missing real
// implementation stops the app at boot rather than silently approving payments and ID checks.
// See docs/adr/0002-fake-external-gateways-behind-interfaces.md.

public class FakePaymentGateway : IPaymentGateway
{
    public Task<string> ChargeOneTimeAsync(Guid userId, decimal amount)
        => Task.FromResult($"fake_pi_{Guid.NewGuid():N}");

    public Task<string> StartSubscriptionAsync(Guid userId, string planType)
        => Task.FromResult($"fake_sub_{Guid.NewGuid():N}");
}

public class FakeIdentityVerifier : IIdentityVerifier
{
    /// Derived from the account id, so in Development every account looks like a different
    /// person and nobody is ever refused. Ban evasion can only be exercised against the real
    /// provider, or against a stub in tests — see IdentityBanTests.
    public Task<IdentityCheck> VerifyAsync(Guid userId) => Task.FromResult(
        new IdentityCheck(true, true, Convert.ToHexString(SHA256.HashData(userId.ToByteArray()))));
}

/// Development and the tests: nothing leaves the machine. What would have been sent is logged
/// and kept, so a test can read it back (ADR-0012).
public class FakePushSender(ILogger<FakePushSender> log) : IPushSender
{
    public ConcurrentQueue<PushMessage> Sent { get; } = new();

    public Task<IReadOnlyList<string>> SendAsync(IReadOnlyList<PushMessage> messages, CancellationToken cancellationToken)
    {
        foreach (var message in messages)
        {
            Sent.Enqueue(message);
            // The body carries a member's name, so it stays out of the log.
            log.LogInformation("Fake push: {Title} -> {Url}", message.Title, message.Url);
        }
        return Task.FromResult<IReadOnlyList<string>>([]);
    }
}
