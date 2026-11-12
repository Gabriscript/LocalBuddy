# ADR-0013: Trips, "free today" and date-aware discovery

**Date**: 2026-11-12
**Status**: accepted
**Deciders**: solo developer (owner interview, architecture review)

## Context

The pilot runs in Florence and Helsinki with few members, so the feed is short. Its weak point
is timing: nobody can see who will be in a city, or when.

The owner wants two things (docs/intent/product-priorities.md):
- a traveller says "I'll be in Florence Dec 12–19";
- anyone, host or traveller, says "I'm free today, fancy a coffee?".

Anyone may contact anyone, as on Couchsurfing.

## Decision

**Trips.** A trip is a `Trip { UserId, City, From, To }` row with `DateOnly` dates.
- Created, listed and deleted under `api/v1/trips`.
- At most 30 days long, starting within 365 days, at most 5 upcoming per member.
- Ended trips are deleted the next time the member adds one: they are location history nobody needs.

**Free today** is one `User.FreeUntil` instant.
- The phone sends its own next local midnight, at most 24 hours ahead.
- Every read tests `FreeUntil > now`, so no job ever clears it.

**Discovery with a city set**:
- **Who appears**: the city's residents plus its visitors (members with an active trip there).
- **`role=guest`** includes every visitor, because a host from Helsinki is a traveller in Florence.
- **`role=host`** means residents only, because a visitor has no home there to offer.
- **Order**, in one paged feed:
  1. in town now;
  2. arriving, by date;
  3. free today;
  4. credits, then id.
- **The card** carries the visitor's trip. The app draws the section headings where the label changes.

**Without a city**, discovery is unchanged.

## Alternatives Considered

### Alternative 1: Separate "arriving" and "in town" endpoints or sections
- **Pros**: each section can page on its own.
- **Cons**: offset paging across several result sets breaks or duplicates rows.
- **Why not**: one ordered feed with client-drawn headings gives the same screen with one query.

### Alternative 2: An availability calendar per member
- **Pros**: precise hours and days.
- **Cons**: a schedule to keep up to date, which nobody does.
- **Why not**: the owner asked for an indication, not a rule. Usual days (a bitmask), trips and
  "free today" cover it.

### Alternative 3: Store each member's time zone
- **Pros**: "today" and "midnight" become exact for everyone.
- **Cons**: one more field to collect and keep right.
- **Why not**: the server's "today" is the UTC date, at most about 3 hours off in Europe. The
  phone computes midnight itself. Store a zone if members notice.

## Consequences

### Positive
- No background jobs: expiry is a comparison at read time.
- The card and the feed explain why someone is shown: here now, arriving, free today.

### Negative
- City is free text. "Firenze" and "Florence" are different feeds. The app picks cities from
  suggestions to limit the drift.
- Two simultaneous trip creations can exceed the cap of five. This is marked as a shortcut in
  `TripsController`.

### Risks
- **No index on `(City, To)` yet.** Discovery with a city will slow down as trips grow. The
  signal is the discovery query time in the logs; the fix is the index.
- **Trips are personal data** (where a member will be, and when). The privacy policy required
  before the pilot (ADR-0011) must cover them.
