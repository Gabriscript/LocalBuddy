# ADR-0009: Front-end — Expo dev build, API client generated from the OpenAPI document

**Date**: 2026-08-28
**Status**: accepted
**Deciders**: solo developer

## Context

The v1 API is finished and honestly documented: `AddOpenApi()` serves a document where every
operation declares its status codes and its response schema (ADR-0008), photos are read through
the API rather than as static files (ADR-0006), and the access token is a 30-day JWT with no
refresh flow. No client exists yet, and CORS is not configured — nothing but a mobile app is
expected to call this API.

GUIDELINES.md §12 already fixes React Native as the framework, for reasons outside architecture:
proximity to HTML/CSS/JS and employability. What is still open is everything around it — build
tooling, how the client learns the API contract, and where state lives. Onboarding needs identity
verification (Stripe Identity), an image picker and secure token storage from step 2, and push
notifications later: native modules on day one.

## Decision

1. **Expo with a development build** (EAS Build), not Expo Go and not the bare RN CLI.
2. **The API client is generated** from `/openapi/v1.json` into TypeScript types and fetch
   functions, committed to the repo and regenerated when the backend changes. No hand-written DTOs.
3. **TanStack Query owns server state.** No global store until something that is not a copy of a
   server row needs one.
4. **The token lives in `expo-secure-store`**, attached by one fetch wrapper that signs out on 401.

## Alternatives Considered

### Alternative 1: Bare React Native CLI
- **Pros**: no Expo layer; any native module works without waiting for a config plugin.
- **Cons**: Xcode and Android Studio projects maintained by hand; RN upgrades are the part people
  quit over.
- **Why not**: a solo developer learning the framework. `expo prebuild` stays available as the
  escape hatch if the layer ever gets in the way.

### Alternative 2: Expo Go
- **Pros**: no build step at all.
- **Cons**: only the native modules Expo Go ships with — Stripe Identity is not one of them.
- **Why not**: identity verification is onboarding step 2, so the ceiling is hit immediately.

### Alternative 3: Hand-written API client
- **Pros**: no codegen in the toolchain; types shaped exactly as the screens want them.
- **Cons**: two definitions of every DTO, drifting silently; a backend rename becomes a runtime bug.
- **Why not**: ADR-0008 paid the full cost of an accurate OpenAPI document precisely so this would
  be free.

### Alternative 4: Redux or Zustand as the primary state layer
- **Pros**: one familiar place for all state.
- **Cons**: caching, retries, invalidation and loading flags rewritten by hand, badly.
- **Why not**: nearly all state here is a copy of a server row. What is left — form drafts, the
  filter panel — is component state until proven otherwise.

## Consequences

### Positive
- Request and response types come from the backend: a breaking change surfaces as a TypeScript
  error at generation time, not as a blank screen in a simulator.
- Native modules can be added without leaving the managed workflow, and EAS builds iOS without a
  Mac in the room.
- The generated client and the Query hooks port to a React web app if one is ever wanted.

### Negative
- A development build must be installed on each test device, and reinstalled whenever a native
  dependency changes — slower than scanning a QR code.
- Codegen is a step someone has to remember to run; a stale client still compiles.
- Expo pins its own React Native and SDK module versions: upgrades happen on Expo's calendar.

### Risks
- `GET /api/v1/photos/{id}/content` is `AllowAnonymous` but filters on the caller's identity, so a
  bare `<Image>` URL returns 404 for any host who restricted visibility. Every image must go
  through one component that sends the `Authorization` header.
- The 30-day JWT cannot be revoked and has no refresh flow. A lost device keeps its session past
  logout. Revisit together with refresh tokens on the backend side.
