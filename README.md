# LocalBuddy

**Meet locals. Share cultures.**

A cultural exchange platform connecting travelers with locals who want to show them their city — not tour guides, not paid experiences, just real people sharing where they live.

Marco (Milan) shows Wei the bar only locals know about. Marco gets to practice his Mandarin and makes a new friend; Wei gets a local contact and an afternoon no guidebook could offer.

Inspired by long-standing reciprocal hospitality models like Servas International (1949) and early Couchsurfing — zero payment for the experience itself, by design.

## Stack
- Backend: C#, ASP.NET Core, EF Core, PostgreSQL
- Mobile: React Native on Expo (dev build), API client generated from the OpenAPI document

Full product spec, legal constraints, and build plan: [GUIDELINES.md](GUIDELINES.md)

## Running the backend locally

```bash
docker compose up -d                       # Postgres on :5434
cd backend/LocalBuddy.Api
dotnet ef database update                  # apply pending migrations
dotnet run --urls http://localhost:5200
bash ../../smoke-test.sh                   # from the repo root
```

Tests: `dotnet test` from `backend/`. They run against in-memory SQLite and need no Postgres.

## Running the mobile app

```bash
cd mobile
npm install
npm start                 # then open the dev build on a device or simulator
```

The TypeScript API client is generated from the running backend, not written by hand:
`npm run api:gen` with the API up on :5200. See [mobile/README.md](mobile/README.md).

## Where the work stands

The backend v1 is complete: every endpoint the product needs exists, and the reasoning behind
the shape of it is recorded in [docs/adr](docs/adr/README.md).

The mobile client covers the paths a member walks every day — sign in, register, the discovery
feed, the expanded profile, interest and pass, the conversation list and a chat. What is left,
in the order that keeps each piece on working foundations:

1. **Onboarding steps 3 to 5** — guided prompts, photo upload, availability, and the TULPS /
   Alloggiati Web acknowledgement before overnight hosting can be switched on.
2. **The filter sheet.** The role chips work and write route params; city, time of day and the
   three-state traits are not exposed yet.
3. **Stripe Identity** in `/verify` — the first native module, and what forces the EAS dev build.
4. **The paid unlock.** The control is already placed on the expanded profile, deliberately quiet
   and apart from the free actions, and calls nothing.
5. **Reviews, reports and blocking** — the endpoints exist, the screens do not.

One deliberate loose end: the access token is a 30-day JWT with no refresh flow and no way to
revoke it, so a lost device keeps its session past logout. The backend half and the client half
of that are worth doing together.

`Program.cs` carries a **Development-only CORS policy** so the Expo web target can reach the API
during a browser preview. Nothing outside Development registers it; delete it the day the web
preview stops being useful.

## Applying migrations on deploy

The application deliberately does **not** migrate at startup: with more than one instance,
concurrent migrations race. Applying the schema is a separate, explicit deploy step that must
run to completion before the new version starts serving.

Build a migration bundle once per release — a standalone executable that needs no .NET SDK and
no source on the target machine:

```bash
cd backend/LocalBuddy.Api
dotnet ef migrations bundle --self-contained -r linux-x64 -o efbundle
```

Then, as the first step of the deploy:

```bash
./efbundle --connection "$DATABASE_URL"
```

It is idempotent: already-applied migrations are skipped. If it fails, stop the deploy — the
old version keeps running against the old schema.

Without a bundle the equivalent from a source checkout is `dotnet ef database update`, which
needs the SDK on the machine doing the deploy.

### Writing a migration that is safe on a populated table

EF generates `CREATE INDEX` and `ADD CONSTRAINT` in their blocking forms, which is fine on an
empty database and an outage on a large one. Once a table carries real traffic, hand-edit the
generated migration:

```csharp
migrationBuilder.Sql("""CREATE INDEX CONCURRENTLY "IX_x" ON "T" ("c");""", suppressTransaction: true);
migrationBuilder.Sql("""ALTER TABLE "T" ADD CONSTRAINT "FK_x" FOREIGN KEY ... NOT VALID;""");
migrationBuilder.Sql("""ALTER TABLE "T" VALIDATE CONSTRAINT "FK_x";""");
```

`CONCURRENTLY` cannot run inside a transaction, hence `suppressTransaction: true`. Keep schema
changes and data backfills in separate migrations, and never edit a migration that has already
been applied anywhere.

## Moderators

Moderator access is granted from configuration, not by editing the database:

```json
{ "Moderators": ["someone@example.com"] }
```

Listed addresses are given the `moderator` role at startup, once the account exists. The role
is baked into the access token, so it takes effect at their next sign-in. Moderators reach
`/api/v1/moderation/*`: the open report queue, and banning or unbanning an account with a reason
on the record. See [ADR-0005](docs/adr/0005-platform-ban-with-identity-continuity.md).
