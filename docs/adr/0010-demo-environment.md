# ADR-0010: A Demo environment for a hosted showcase

**Date**: 2026-10-27
**Status**: proposed
**Deciders**: solo developer

## Context

The app has to be shown from a phone, away from the development machine, before Stripe exists.
ADR-0002 makes the API refuse to start anywhere but Development, because the fakes would
otherwise accept fake money and approve every identity check in silence. Running the demo
server as Development is not an answer either: Development carries a signing key committed to
the repository (anyone who has read it can mint a token for any account), an any-origin CORS
policy and the OpenAPI document. The demo runs on a public host, behind Caddy, from Docker.

## Decision

A third environment, `ASPNETCORE_ENVIRONMENT=Demo`, run only from `deploy/demo/compose.yaml`.
Demo registers the same fakes as Development and nothing else of Development: the JWT key comes
from the environment and the app refuses to boot without one, with one under 32 characters, or
with the committed development key; CORS is closed unless `Cors:AllowedOrigins` names an origin;
no OpenAPI. Forwarded headers are believed from the compose network (`KnownNetworks`), the
schema is applied by a one-shot `migrate` container running the EF bundle before the API starts,
and photos stay on local disk (ADR-0003), on a named Docker volume.

## Alternatives Considered

### Alternative 1: Run the server as Development
- **Pros**: no code change at all.
- **Cons**: the public repository key signs tokens, every browser origin is allowed, the API
  document is published, and nothing on the server says it is not the developer's laptop.
- **Why not**: the key alone is an account takeover for anyone who reads the repository.

### Alternative 2: The `Payments:UseFakes` flag that ADR-0002 rejected
- **Pros**: any environment could opt into the fakes, a future staging included.
- **Cons**: a flag that can be set in production by mistake, the silent failure ADR-0002 exists
  to prevent.
- **Why not**: an environment name is chosen once in `compose.yaml`; a flag travels with
  configuration and is copied along with it.

### Alternative 3: Migrate at startup in Demo
- **Pros**: one container fewer.
- **Cons**: the API would carry a second path to the schema that the real deploy does not use
  (README, "Applying migrations on deploy").
- **Why not**: the bundle already exists and is the deploy path; Demo exercises it.

## Consequences

### Positive
- The demo boots from an empty Postgres with `docker compose up -d --build`.
- A missing or reused signing key stops the server at boot, not at the first forged token.
- Outside Development and Demo nothing changed: the app still refuses to start.

### Negative
- Demo is **not** a staging environment. It is not for real users or real personal data, it
  takes no real payments (no Stripe), it sends no push notifications, and identity checks always
  pass. Anyone who registers on it is "verified".
- Single instance only: photos on one disk, the rate limiter in one process.
- The guarded development key is a constant in `JwtOptions` that has to match
  `appsettings.Development.json`; a test fails if the two drift apart.

### Risks
- Someone points real users at the demo. Mitigation: the name, this record and the README say
  what it is; the signal is any account on it that is not `@demo.localbuddy.test` or the owner's.
- `DEMO_SUBNET` set to a range wider than the compose network makes other hosts' forwarded
  headers believed. Mitigation: it is used for both the network and `KnownNetworks`, so the two
  cannot differ unless edited by hand.
