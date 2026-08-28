# ADR-0008: API conventions — versioned paths, one error shape, paged collections

**Date**: 2026-08-28
**Status**: accepted
**Deciders**: solo developer

## Context

The API grew endpoint by endpoint and picked up the inconsistencies that come with that. The
generated OpenAPI document declared exactly one status code, `200`, on all 29 operations, and
carried a response schema for two of them: a generated client would have had typed requests
and untyped responses. Failures came back in five different shapes. Four of the five list
endpoints returned a bare array with no way to tell whether more rows existed. And nothing
carried a version, while the document titled itself `v1`.

None of this had cost anything yet, because the React Native client does not exist. That is
precisely why it had to be fixed now: every one of these is a breaking change, and the price of
making them goes from zero to a coordinated two-repository release the day a client ships.

## Decision

Four conventions, applied across every endpoint:

1. **Versioned paths.** Every route is `api/v1/...`, written literally and in lowercase rather
   than derived from the controller name.
2. **One error shape.** Every deliberate failure returns RFC 7807 `ProblemDetails` with a stable
   machine-readable `code`, built through `ApiProblem`. The prose in `detail` may change; the
   code may not.
3. **Paged collections.** Every list endpoint returns `Page<T>` — `items`, `pageNumber`,
   `pageSize`, `hasMore` — computed by fetching one row more than the page and dropping it.
4. **Honest status codes, declared.** Creations answer 201 with a `Location` where a URL exists
   to point at, and every action carries `[ProducesResponseType]` so the document matches
   reality.

## Alternatives Considered

### Alternative 1: Header or media-type versioning
- **Pros**: clean URLs, no duplication when a version changes.
- **Cons**: invisible in a browser, in a log, and in a curl command somebody pastes into chat.
- **Why not**: the client is one mobile app written in-house. Discoverability beats elegance.

### Alternative 2: Wait to add versioning until a second version is needed
- **Pros**: no churn today.
- **Cons**: by then a shipped client is pinned to unversioned paths, and the migration has to
  be coordinated across two repositories and an app-store review.
- **Why not**: this is the last moment it is free.

### Alternative 3: A `data` / `meta` / `links` envelope on every response
- **Pros**: the convention most public APIs use; room for links and metadata later.
- **Cons**: wraps every single-resource response in a level of nesting that buys nothing for a
  first-party client.
- **Why not**: the envelope earns its place on collections, where `hasMore` has to live
  somewhere. Single resources are returned flat.

### Alternative 4: Cursor pagination
- **Pros**: stable under concurrent inserts, constant cost at any depth.
- **Cons**: opaque cursors, and no jumping to a page.
- **Why not**: correct for the discovery feed eventually, overkill for five endpoints whose
  largest table has a few hundred rows. `hasMore` keeps the client contract unchanged if we
  swap the mechanism later.

## Consequences

### Positive
- The OpenAPI document is usable: 200/201/202/204/400/401/403/404/409 all declared, and every
  success has a response schema. A generated client is typed on both sides.
- A client parses one error shape and switches on `code` rather than on English prose.
- Every list endpoint can be paged; none of them can silently truncate.
- 429 answers carry `Retry-After` and the same problem shape.

### Negative
- `[ProducesResponseType]` is repetition on every action, and nothing enforces that it stays
  true. It is only as honest as the next person to edit an endpoint.
- `Page<T>` fetches one row more than it needs. Cheap, and invisible to callers.
- Two controllers share the `api/v1/users` prefix so that interest, pass, unlock, reviews and
  block hang off the member they act on. The templates do not collide, but the routes for one
  resource are no longer all in one file.

### Risks
- `X-RateLimit-Limit` / `-Remaining` / `-Reset` are **not** emitted. The built-in
  `PartitionedRateLimiter` does not surface remaining permits without replacing the limiter,
  and `Retry-After` on rejection is the part a client can act on. Revisit if a client needs to
  pace itself proactively.
- `429` is produced by middleware, so it is absent from the OpenAPI document even though every
  endpoint can return it. Worth a documented note to client authors.
