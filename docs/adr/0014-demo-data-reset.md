# ADR-0014: Demo data seeded by the API, reset from the app

**Date**: 2026-11-16
**Status**: proposed
**Deciders**: product owner, solo developer

## Context

The owner shows the app from an Android phone to different people on different days. Every showing
has to start from the same state: the same chats, the same requests, the same people in each city.
Today the demo cast is created by `backend/scripts/seed-demo.sh`, which drives the HTTP API from a
laptop, needs `docker exec` for what no endpoint grants (verified identity, credits) and is slowed
to ten accounts a minute by the auth rate limit. A phone cannot run it, and its account password is
written in a public repository while the same server hosts the pilot's real members (ADR-0011).

## Decision

The API seeds the demo cast itself, and the presenter resets it from the app.

- **Data**: the cast lives in `backend/LocalBuddy.Api/DemoData/demo-seed.json` (people, trips as
  day offsets from today, matches, messages, pending requests). `DemoSeeder` writes it through EF
  Core. Every account is `<key>@demo.localbuddy.test` with an id derived from that address, so a
  reset recreates the same ids and a signed-in presenter stays signed in.
- **Reset** is one transaction: delete every `@demo.localbuddy.test` account (the database cascades
  what they own; payments, subscriptions and reports of those ids, which carry no foreign key by
  ADR-0004, are deleted by id), then insert the cast again with dates anchored to today. Photo files
  are replaced around it. Nothing belonging to any other account is touched, except rows it shares
  with a demo account (a match or a conversation with one), which go with that account.
- **Switch**: `Demo:ResetEnabled`, false by default and absent from every committed settings file.
  When false the route answers 404 and nothing is seeded. When true the app refuses to boot unless
  `Demo:AccountPassword` is at least 12 characters and, outside Development, is not the password the
  old script published. At boot, an enabled server with no presenter account seeds once.
- **Route** (additive): `POST /api/v1/demo/reset` answers 204. Only the presenter account named in
  the seed file may call it; anyone else gets 403 `demo_reset_forbidden`. Idempotent.
- **Declaring the mode** (additive): `MyProfile.canResetDemo`, true only for the presenter on a
  server with the switch on. The app shows its "Reset demo data" row on that field alone; an older
  server omits it and the row never appears.
- **Photos** are portraits of adults from Pexels, read from `Demo:PhotosPath`. They are not
  committed: the repository is public and they show real people under invented names. On the demo
  server the folder is copied once by hand and mounted read-only. A missing file seeds the profile
  without a photo.
- `seed-demo.sh` shrinks to a sign-in as the presenter and a call to the route. It prints status
  codes and the problem `code`, never a token or a header.

Discovery is not filtered by date (ADR-0013), so a city shows its residents and every visitor with
a trip still running or ahead, whatever dates the presenter saves for their own trip. The cast
relies on that: two hosts live in each seeded city and visitors hold wide, overlapping trips.

## Alternatives Considered

### Alternative 1: Keep the script, run it from a laptop before each showing
- **Pros**: no new route, no server-side seeding.
- **Cons**: no reset on the phone, minutes of rate-limit waits for forty accounts, `docker exec`
  against the server's database, the password in the repository.
- **Why not**: the requirement is a reset from the app, between two people, without a laptop.

### Alternative 2: Reset allowed to moderators
- **Pros**: reuses `RequiresModerator`.
- **Cons**: the presenter would need moderator powers over real pilot members, or the owner would
  sign in twice for every reset.
- **Why not**: the presenter account needs exactly one power. Naming it in the seed file grants
  that and nothing else.

### Alternative 3: Wipe the whole database and seed again
- **Pros**: simplest reset, no domain filter.
- **Cons**: deletes the pilot's real members and their messages.
- **Why not**: Demo is also the pilot (ADR-0011).

### Alternative 4: Commit the portraits and bake them into the image
- **Pros**: no manual copy on deploy.
- **Cons**: identifiable people published as invented members in a public repository.
- **Why not**: Pexels does not check model releases; keeping the files private limits the exposure
  to the people shown the demo.

## Consequences

### Positive
- One tap returns the demo to its first state, with trips and message times realigned to today.
- The demo password is a server secret; the published one stops working on Demo.
- No `docker exec`, no rate-limit waits, and the script can no longer print a token.

### Negative
- A second route to user data that bypasses the controllers' validation. The seed tests hold the
  cast to the same limits (trip length, trips per member).
- A pilot member's match or chat with a demo account disappears on reset.
- Deploying the demo gains one manual step: copying the photo folder.
- The owner's rule "Pexels never shows a member profile" (product-priorities, 2026-11-12) now has
  one exception: the invented demo cast.

### Risks
- The switch is turned on in an environment with a weak password. Mitigation: the boot check.
- Someone in a portrait objects to being shown as a member. Mitigation: adults only, no sensitive
  context in the bios, files never published; replace the file and reset.
- The presenter's push tokens are deleted with the account. Mitigation: the app registers for push
  again right after a reset.
