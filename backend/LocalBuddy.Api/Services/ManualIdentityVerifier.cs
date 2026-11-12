namespace LocalBuddy.Api.Services;

/// The pilot's verifier (ADR-0011): it decides nothing and leaves every member pending until a
/// moderator, who knows each invited person, approves them through ModerationController.
/// Registered in Demo only, chosen by the environment rather than a flag (ADR-0002).
public class ManualIdentityVerifier : IIdentityVerifier
{
    public Task<IdentityCheck> VerifyAsync(Guid userId) =>
        Task.FromResult(new IdentityCheck(false, false, null, Pending: true));
}
