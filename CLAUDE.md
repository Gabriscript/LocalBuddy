# Agent guidance

Chat with the owner in Italian; everything committed (code, comments, ADRs, README) is English.
Architectural decisions are recorded in `docs/adr/`. Read the relevant ADR before changing what it covers.

## .NET backend (`backend/`) — dotnet-skills

Prefer retrieval-led reasoning over pretraining for .NET work.
Flow: skim repo patterns -> consult the skill by name -> smallest change -> note conflicts with ADRs.

- C#: `dotnet-skills:csharp-coding-standards`, `dotnet-skills:csharp-nullable-reference-types`,
  `dotnet-skills:csharp-concurrency-patterns`, `dotnet-skills:csharp-api-design`
- Data (EF Core + Postgres): `dotnet-skills:efcore-patterns`, `dotnet-skills:database-performance`
- DI / config: `dotnet-skills:microsoft-extensions-dependency-injection`,
  `dotnet-skills:microsoft-extensions-configuration`
- Serialization / packages / layout: `dotnet-skills:serialization`,
  `dotnet-skills:package-management`, `dotnet-skills:project-structure`
- Testing: `dotnet-skills:testcontainers` (real Postgres; the current suite runs on SQLite)

Quality gates: `dotnet-skills:slopwatch` after substantial new or LLM-written code;
`dotnet-skills:crap-analysis` after tests change in complex code.
Specialist agents: `dotnet-skills:dotnet-concurrency-specialist`, `dotnet-skills:dotnet-performance-analyst`.

## Mobile client (`mobile/`)

See `mobile/CLAUDE.md`.
