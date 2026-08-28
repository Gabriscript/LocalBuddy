# ADR-0007: A verified identity is required to contact another member

**Date**: 2026-08-28
**Status**: accepted
**Deciders**: product owner, solo developer

## Context

ADR-0005 made a ban follow the person rather than the account, but only from the moment they
verify their identity. Someone banned before ever verifying could open a fresh account and
carry on, which left the ban avoidable by simply never finishing the check. Underneath that
mechanic sits the product question it answers: a host is deciding whether to let a stranger
into their home, and is entitled to know that the platform has established who that stranger
is. Requiring verification to read the site would be a different and much heavier thing.

## Decision

Verification is required to reach another member: expressing interest, unlocking a contact and
sending a message. Reading the site, browsing discovery, reporting and blocking stay open to
any account. Enforced by `[RequiresVerifiedIdentityAttribute]` on those three actions.

## Alternatives Considered

### Alternative 1: Require verification to register
- **Pros**: the simplest rule to state, and no unverified accounts exist at all.
- **Cons**: a document check before someone has seen a single profile; most people will leave.
- **Why not**: it charges the highest-friction step to visitors who have not decided anything
  yet, and it makes the site unusable for browsing, which is explicitly meant to stay open.

### Alternative 2: Require it only for overnight stays
- **Pros**: targets the highest-risk interaction and leaves day meetings frictionless.
- **Cons**: leaves the ban avoidable for everyone who never hosts overnight, and meeting a
  stranger in person is not risk-free just because nobody sleeps over.
- **Why not**: it would reopen the hole this ADR exists to close.

### Alternative 3: Carry the verified flag in the token
- **Pros**: no database lookup on the gated endpoints.
- **Cons**: tokens last 30 days, so somebody who verifies would stay locked out until their
  next sign-in, and would blame us for it.
- **Why not**: the freshness matters more than one indexed lookup on three endpoints.

## Consequences

### Positive
- The ban in ADR-0005 becomes hard to avoid: reaching anybody requires the check that
  recognises you.
- Every conversation on the platform is between two identified people, which is the promise
  being made to hosts.
- Verification takes effect immediately, with no sign-out.

### Negative
- One indexed lookup per request on the three gated endpoints.
- A member can build a whole profile and only discover the wall when they first reach out. The
  client should surface the requirement well before that point.
- The Development fake approves everybody, so the friction is invisible locally and only real
  once Stripe Identity is wired up.

### Risks
- Reporting and blocking are deliberately left ungated: a safety action must never depend on
  the reporter having finished their paperwork. That means unverified accounts can file
  reports, so report spam is now a moderation-queue problem rather than an access one.
- If verification turns out to have a poor completion rate, the pressure will be to weaken this
  rule. Weakening it also weakens the ban, and the two have to move together.
