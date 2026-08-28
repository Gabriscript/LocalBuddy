# ADR-0006: Per-host profile visibility, with photos served through the API

**Date**: 2026-08-28
**Status**: accepted
**Deciders**: product owner, solo developer

## Context

A guest has to be able to see the place before agreeing to stay there — the house, the room
they would sleep in — the way any hospitality platform works. That argues for open profiles.
Hosts publishing photographs of their own home to the open internet argues the other way, and
the two cannot be reconciled by simply picking one. Meanwhile the behaviour we had was neither:
`GET /api/Users/{id}` required a token, while the photos it pointed at were static files
readable by anyone, forever, blocked or not.

## Decision

Each host chooses, with `ProfileVisibleToAnonymous`, whether their public profile is readable
by visitors who are not signed in. The default is signed-in users only. Photos are no longer
served as static files: `PhotosController` streams them and applies the same rule, so the
setting cannot be bypassed with a bare URL.

## Alternatives Considered

### Alternative 1: One platform-wide answer, either open or closed
- **Pros**: nothing to build, nothing to explain, one behaviour to reason about.
- **Cons**: forces the same trade-off on a host renting a spare room and a host offering an
  afternoon walk, whose exposure is not remotely the same.
- **Why not**: the person carrying the risk should be the one making the call.

### Alternative 2: Keep static files and accept that photos are public
- **Pros**: no code, and putting a CDN in front later stays trivial.
- **Cons**: makes the setting a lie — the data is gated, the images are not.
- **Why not**: a privacy control that a URL walks around is worse than no control, because it
  is believed.

### Alternative 3: Signed, expiring URLs
- **Pros**: keeps image bytes off the application path; the usual answer at scale.
- **Cons**: needs a signing scheme and expiry handling in the client, and the local disk store
  has nothing to sign with.
- **Why not**: the right answer once photos live in object storage. Revisit together with
  ADR-0003.

## Consequences

### Positive
- The choice belongs to the host, and defaults to the private side.
- The rule is enforced in one place and applies identically to a profile and its photos.
- Anonymous refusals return NotFound, so they do not confirm that a profile exists.
- `Photo.Url` is now an internal storage key rather than a public address, which is what it
  should have been from the start.

### Negative
- Every image byte flows through the application instead of the static-file middleware. At MVP
  volume that costs nothing; it is what will eventually justify signed URLs.
- No caching headers on photo responses yet, so clients refetch every time.
- Existing `/uploads/...` links stop resolving. Nothing outside this repository holds any.

### Risks
- Home photographs stay visible to every signed-in account. That is the deliberate product
  choice recorded here, not an oversight. If abuse appears, the next step is gating home photos
  behind an open conversation rather than reversing this decision.
