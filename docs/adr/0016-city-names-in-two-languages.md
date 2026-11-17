# ADR-0016: Known cities answer to their names in two languages

**Date**: 2026-11-17
**Status**: proposed
**Deciders**: product owner, solo developer

## Context

A city is free text (ADR-0013). Two testers who had never seen the app typed the English name of a
city the app knows by its Italian one: "Rome" and "Florence" returned an empty feed and the line
"You have seen everyone nearby", while Roma and Firenze hold members. The pilot runs in Florence
and Helsinki, so the traveller who writes "Florence" is the common case, not an edge. ADR-0013
listed the drift ("Firenze" and "Florence" are different feeds) as an accepted risk and left it to
the suggestion list, which only helps people who type the local name.

## Decision

A short table in code, `CityNames`, groups the names of the same city. It does not replace free
text, and it changes no route, field or stored value that exists.

- **Canonical name**: the one the app shows and stores from now on. For Italy and Finland the local
  name (Roma, Milano, Firenze, Venezia, Napoli, Torino, Genova, Helsinki); for the rest the English
  one (Stockholm, Copenhagen, Prague, Vienna, Munich, Cologne, Lisbon, Seville). The other names in
  the group are aliases (Rome, Milan, Florence, Venice, Naples, Turin, Genoa, Helsingfors,
  Tukholma, København, Köpenhamn, Kööpenhamina, Praha, Wien, München, Köln, Lisboa, Sevilla).
- **Searching**: `GET /api/v1/discovery?city=` matches every name of the group, for residents and
  for visitors' trips alike: "Florence" finds Firenze.
- **Suggesting**: `GET /api/v1/discovery/cities?q=` also offers a city whose alias starts with what
  was typed ("flo" offers Firenze). It answers the canonical name, once.
- **Saving**: a trip, a profile or an account saved with an alias name is stored under the canonical
  one, so "Same days as you" and the trip bar compare equal strings.
- Matching ignores case and surrounding spaces, as it does today. Accents still count (ADR-0013
  shortcut); the table lists the accented and the plain spelling where both are common.
- Anything not in the table behaves exactly as before.

## Alternatives Considered

### Alternative 1: A full canonical city list with ids (GeoNames or similar)
- **Pros**: the real fix: one id per place, names per language, no drift at all.
- **Cons**: a data set, a migration of every stored city, a picker that refuses free text; far more
  than the pilot needs.
- **Why not**: the table covers the cities members actually write in the two pilot countries and the
  demo; a list with ids can replace it later without touching the routes.

### Alternative 2: Translate names in the app, per language
- **Pros**: each member sees their language.
- **Cons**: the server still compares strings, so the client would have to send every spelling.
- **Why not**: the matching has to happen where the data is.

### Alternative 3: Do nothing, rely on the suggestion list
- **Pros**: no code.
- **Cons**: it is what failed: a typed name that is not a prefix of the stored one shows nothing.
- **Why not**: two of two testers hit it.

## Consequences

### Positive
- "Rome", "Florence", "Milan" find the people of Roma, Firenze, Milano, in search, suggestions and
  trips.
- New data is stored under one spelling per known city.

### Negative
- A hand-kept table: a city not in it still drifts. Cities saved before this change keep their old
  spelling (a trip to "Florence" saved earlier is still found by a search for Firenze or Florence,
  but "Same days as you" will not pair it with a Firenze trip).
- Saving rewrites what the member typed, for known cities only.

### Risks
- A wrong alias merges two places (none of the listed pairs is ambiguous). Each pair is covered by a
  test; add a city only with a test.
