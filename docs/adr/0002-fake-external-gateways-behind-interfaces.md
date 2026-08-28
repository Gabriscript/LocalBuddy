# ADR-0002: Fake external gateways behind interfaces, Development only

**Date**: 2026-08-27 (backfilled and amended 2026-08-28)
**Status**: accepted
**Deciders**: solo developer

## Context

Payments and identity verification both go through Stripe, and both need a live Stripe account
that does not exist yet. The unlock flow, the subscription flow and the age check all have to
be buildable and testable before that account exists. Age and identity verification are not
cosmetic here: GUIDELINES section 9 makes the platform responsible for confirming that a user
is a real adult, and hosting overnight guests carries legal obligations on top.

## Decision

`IPaymentGateway` and `IIdentityVerifier` define the contracts; `FakePaymentGateway` and
`FakeIdentityVerifier` implement them for local work. `Program.cs` registers the fakes **only**
when the environment is Development. Outside Development, with no real implementation
registered, the application throws at startup and refuses to run.

## Alternatives Considered

### Alternative 1: Register the fakes unconditionally
- **Pros**: one line, works everywhere, no environment branch.
- **Cons**: a production deployment silently accepts fake payments and approves every identity
  and age check, with no error anywhere.
- **Why not**: this was the original shape and it is the reason this ADR was amended. A silent
  pass on age verification is the worst possible failure mode for this product.

### Alternative 2: Call Stripe test mode instead of writing fakes
- **Pros**: exercises the real client library and the real error shapes.
- **Cons**: still needs an account and keys, adds a network dependency to every local run.
- **Why not**: it does not remove the need for the account, which was the whole problem.

### Alternative 3: Feature flag such as `Payments:UseFakes`
- **Pros**: a staging environment could opt into fakes deliberately.
- **Cons**: a flag that can be set wrong is a flag that will be set wrong, and the failure is
  silent again.
- **Why not**: speculative. Add it when a staging environment actually exists and asks for it.

## Consequences

### Positive
- Local development needs no Stripe account and no network.
- Swapping in the real gateways is a registration change in `Program.cs`; no caller changes.
- A deployment that forgets Stripe fails loudly at boot instead of taking fake money.

### Negative
- The application cannot be started outside Development at all until Stripe is wired up, which
  includes any staging or demo environment.
- The fakes always succeed, so no caller has exercised a declined payment or a failed check.

### Risks
- Real Stripe behaviour differs from the fakes in ways no test will catch until integration:
  webhooks, asynchronous verification results, declines and retries. The subscription flow in
  particular currently assumes the charge succeeds synchronously.
