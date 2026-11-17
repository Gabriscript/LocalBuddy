# ADR-0015: A note with a request, shown to the person asked

**Date**: 2026-11-17
**Status**: proposed
**Deciders**: product owner, solo developer

## Context

Two testers who had never seen the app (2026-11-17, one as a new traveller, one as a returning
member) both stopped at the same place. "Ask to meet" sends a bare request: the sender cannot say
why they are writing, and the person asked sees a profile card and nothing else. The only way to
write first is the paid unlock, which the pilot's "everything is free" rule contradicts. A host
deciding whether to say yes (and an investor watching the demo) needs the reason: who is this, when
are they here, what do they want from me.

## Decision

An optional note travels with the request, and the person asked sees it before answering.

- **Asking**: `POST /api/v1/users/{targetId}/interest` accepts an optional JSON body
  `{ "note": string | null }`. No body, or an empty note, means no note, exactly as today. The note
  is trimmed and at most `Limits.Note` (500) characters; longer answers 400 `invalid_request`. Every
  existing rule (verified identity, blocks, `already_responded`) is unchanged.
- **Stored** in `Match.Note`, a nullable column on the asker's row: one additive migration.
- **Shown**: `GET /api/v1/users/me/requests` returns, for each asker, `note` (new nullable field on
  `ProfileCard`, null everywhere else: discovery, sent requests) and `trip`: the asker's earliest
  active trip to a city where the asked person lives or has a trip of their own. The reason is then
  on the card even when the asker typed nothing ("In Helsinki, Nov 18 to 21").
- **Kept**: when the asked person says yes, the note becomes the first message of the new chat,
  sent by the asker, so the reason is still there once the request is gone.
- **Not shown**: push notification texts do not carry the note (lock screens). A decline never shows
  it again (the text stays in the row, as the pass itself does, so an undo brings the request back
  whole) and, as today, is never told. A chat that already exists (a paid unlock) gets no message.
  The length is checked after trimming, in the controller.
- **Clients**: an app that sends no body keeps working, and an older app ignores the new fields.
  The app asks for the note in a sheet, prefilled with a short sentence when the asker has a trip to
  the person's city, and shows it on the request card and above the profile.
- **Demo**: `demo-seed.json` requests may carry a `note`, so the investors' demo starts with
  requests that explain themselves.

## Alternatives Considered

### Alternative 1: Open a chat when the request is sent
- **Pros**: no new column; the existing message path carries the text.
- **Cons**: a conversation would exist for someone who has not agreed to it, which ADR-0007's gate
  and the "a no is never told" rule both avoid.
- **Why not**: the consent step is the point of a request.

### Alternative 2: Only derive the reason from trips, no free text
- **Pros**: no new input to abuse.
- **Cons**: a trip says where and when, not what the person wants ("sauna", "a coffee while the kids
  build Lego").
- **Why not**: kept as the automatic part of the answer, not as the whole of it.

### Alternative 3: A mandatory note
- **Pros**: every request explains itself.
- **Cons**: one more required step in the first-run path the app is trying to shorten.
- **Why not**: optional, with the sentence prefilled whenever the app can write it.

### Alternative 4: Put the note in the push notification
- **Pros**: the host reads it without opening the app.
- **Cons**: text from a stranger on a lock screen.
- **Why not**: the push still says that someone asked; the note waits inside the app.

## Consequences

### Positive
- The person asked can decide with the reason in front of them; the chat opens with it.
- The first-run path no longer needs the paid unlock to say hello.

### Negative
- Text from a stranger is shown before the person has agreed to anything. The cap, plain-text
  rendering, the verified-identity gate (ADR-0007), block and report are the only defences: there
  is no moderation queue for notes.
- One migration on the demo server (the `migrate` container applies it on the next deploy).
- `ProfileCard` gains a field that is null in all but one endpoint.

### Risks
- Harassment through notes. Signal: reports that quote a note. The fix would be a per-sender daily
  cap on requests, not built yet.
- The note is copied into a chat message at acceptance; a later edit of the note (none exists) would
  not follow it.
