# ADR-0001: Single project, controllers straight onto EF Core

**Date**: 2026-08-26 (backfilled 2026-08-28)
**Status**: accepted
**Deciders**: solo developer

## Context

The backend is an MVP of roughly a thousand lines behind a React Native client that does not
exist yet. The domain is small and well understood, and the schema is still moving. The usual
reflex at the start of an ASP.NET Core project is to lay down a layered structure up front:
repositories over EF Core, a service per controller, separate assemblies per layer.

## Decision

One project, `LocalBuddy.Api`, with the standard ASP.NET Core folder layout. Controllers take
`LocalBuddyDbContext` directly. A service class is extracted only when a rule is genuinely
shared, meaning a second caller appears or two controllers start to disagree about it.

## Alternatives Considered

### Alternative 1: Repository plus Unit of Work over EF Core
- **Pros**: familiar, swaps the persistence technology in theory, mocks easily.
- **Cons**: `DbContext` is already both a repository and a unit of work; the wrapper mostly
  forwards calls and blocks `IQueryable` composition.
- **Why not**: it adds a layer that carries no rule of its own. The persistence technology is
  not going to be swapped, and tests run against real SQLite instead of mocks.

### Alternative 2: Clean or hexagonal architecture in separate assemblies
- **Pros**: enforces direction of dependency at compile time; scales to a large team.
- **Cons**: four projects, interfaces with one implementation, mapping code between layers.
- **Why not**: the cost lands immediately, the benefit lands at a team size and codebase size
  this project does not have.

### Alternative 3: MediatR or CQRS handlers
- **Pros**: one class per operation, easy to locate behaviour.
- **Cons**: indirection through a dispatcher for what is currently a single database call.
- **Why not**: nothing in the domain needs commands and queries to diverge yet.

## Consequences

### Positive
- The path from route to SQL is one file, so a change is one place.
- No mapping code and no interfaces that exist only to be mocked.
- EF Core query composition stays available, which discovery filtering depends on.

### Negative
- Business rules live in controllers, so they are testable only through the HTTP surface or by
  extraction. Rules shared by two controllers must be noticed and pulled out deliberately.
- Nothing structural stops a controller from growing too much logic.

### Risks
- Duplication creeps in silently. It already happened once: opening a conversation and checking
  a block were each written twice, and the copies drifted. Mitigation is the rule above plus
  `ConversationService` and `BlockQueries`, which is what the first two extractions became.
- Trigger to revisit: a third caller for the same rule, or a controller past roughly 200 lines.
