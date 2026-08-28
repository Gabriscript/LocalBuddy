# ADR-0005: Platform ban enforced per request, with identity continuity

**Date**: 2026-08-28
**Status**: accepted
**Deciders**: product owner, solo developer

## Context

Until now the only sanction was one user blocking another, which is a personal preference, not
a safety mechanism. The platform needs to remove people who break its rules — racism,
blackmail, asking to be paid for the exchange, false identity — and that is a different act
with a different scope: a ban stops someone using the service, it does not stop them looking
at the site. The hard part is what happens next. A ban that can be shrugged off by registering
again is theatre, and hosts are letting these people into their homes.

## Decision

A moderator sets `BannedAt` and `BanReason` on the account. Every authenticated request checks
the flag, so a ban takes effect immediately despite 30-day tokens. `IIdentityVerifier` returns
a stable `SubjectHash` for the person behind the document; when a verification matches the
handle of a banned account, the new account is banned on the spot.

## Alternatives Considered

### Alternative 1: Check the ban only at sign-in
- **Pros**: no per-request cost.
- **Cons**: tokens last 30 days and carry no revocation, so a banned user keeps full access for
  up to a month.
- **Why not**: that window is exactly when the person is most motivated to do harm.

### Alternative 2: Short tokens plus refresh, checking the ban at refresh
- **Pros**: the standard answer; removes the per-request lookup.
- **Cons**: needs a refresh flow, refresh-token storage and rotation, none of which exists.
- **Why not**: correct destination, too much to build for this. The per-request check is the
  thing to delete once refresh tokens land.

### Alternative 3: Ban by email address or device
- **Pros**: no dependency on the identity provider.
- **Cons**: a new address takes ten seconds.
- **Why not**: it would not survive the first determined evader, which is the whole point.

### Alternative 4: Store the document, or a hash of the document itself
- **Pros**: no dependency on the provider keeping handles stable.
- **Cons**: turns us into a holder of identity documents, with everything that implies.
- **Why not**: GUIDELINES §9 is explicit that we never see or store the document. The provider
  handle gives the same continuity with none of the custody.

## Consequences

### Positive
- A ban bites on the next request, not at the next sign-in.
- Coming back with a new email does not work: the ban follows the person through verification.
- The reason is on the record and returned at login, so the person knows what happened.
- Banned accounts drop out of discovery, so nobody is matched with someone already removed.

### Negative
- One indexed lookup on every authenticated request, marked with a ponytail comment naming the
  upgrade path.
- Roles live in the token, so granting moderator only takes effect at the next sign-in.
- Enforcement depends on the person having verified at all: someone banned before verifying can
  still open a fresh account. Requiring verification before interacting would close that, and
  is a separate product decision.

### Risks
- The provider handle must be stable for the same human across checks, and we cannot confirm
  that until the real integration exists. The fake in Development deliberately returns a
  per-account handle, so this path is exercised only by `IdentityBanTests`.
- A hashed identity handle is personal data under GDPR. It is stored hashed and never
  displayed, but it lives as long as the account row does.
