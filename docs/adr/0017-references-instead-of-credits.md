# ADR-0017: References instead of credits and stars

**Date**: 2026-11-17
**Status**: proposed
**Deciders**: product owner, solo developer

## Context

Five testers who had never seen the app went through it on 2026-11-17. Every one of them asked
what "11 credits" meant, and two put it among the first three things to change: it contradicts the
welcome screen's "Nobody pays anybody". Hosts deciding whether to say yes asked for the opposite:
something that tells them who this person is, as other members met them. The owner decided
(2026-11-17): credits go from the app; what members need is references, as on Couchsurfing: "this
person has 5 references, from travellers or as a host", each with how it went and a thumb up or
down.

The app already has reviews: a 1-5 rating and a comment, allowed only once both people have written
in a chat (ReviewsController), averaged on cards as `rating`.

## Decision

Reviews become references. The table stays, the meaning sharpens, and the app shows counts and words
instead of stars and credits.

- **A reference** is a review with two new fields: `Recommend` (thumb up or down) and `Context`, how
  the two met, from the author's side: `hosted` (I hosted them), `wasHosted` (they hosted me),
  `metUp` (we met). Both are nullable: rows written before this change have neither.
- **Writing one**: `POST /api/v1/reviews` accepts `recommend` and `context`; `rating` becomes
  optional. A request needs `rating` or `recommend`. When only `recommend` comes, `Rating` is stored
  as 5 or 1, so the average the API already serves keeps a meaning; when only `rating` comes (an old
  app), `Recommend` is stored as `rating >= 4`. Who may write one is unchanged: both people wrote in a
  chat, no block, one per author and subject.
- **Reading**: `ReviewDto` gains `recommend`, `context`, `authorName` and `authorPhotoUrl` (the list
  on a profile names its authors). Cards (`ProfileCard`, everywhere they are built) and the profile
  (`ProfileDetail`) gain `references` (how many), `referencesAsHost` (from people this member hosted:
  author context `wasHosted`) and `referencesAsTraveller` (from people who hosted this member:
  author context `hosted`). Counted in SQL with the page, like `rating`.
- **The app**: cards show "5 references", the profile a References section ("5 references · 3 from
  travellers · 2 from hosts") with each one: author, how they met, thumb, text, month. The sheet in
  the chat menu asks "Would you recommend {name}?" (thumb up or down), "How did you meet?" and "How
  did it go?". Stars and credits are no longer shown anywhere.
- **Credits on the server are left as they are** for now (balance, host reward, unlock with credits,
  their weight in the discovery order): no app shows them. Removing them is a later change with its
  own migration.
- **Demo**: `demo-seed.json` gains `references` written by members of the cast to each other, so the
  investors' demo shows profiles with a history; a reset writes them again.

## Alternatives Considered

### Alternative 1: A new References table
- **Pros**: a clean model, no legacy rating.
- **Cons**: two tables for the same act, a data copy, and the same rules written twice.
- **Why not**: a review already is a reference without the two fields that make it one.

### Alternative 2: Only thumbs up
- **Pros**: no hurt feelings, cleaner profiles.
- **Cons**: a reference that can only be positive says little; problems go to Report and stay
  invisible to the next host.
- **Why not**: the owner chose up or down, which is what makes the positive ones credible.

### Alternative 3: Keep stars, hide credits
- **Pros**: no API change.
- **Cons**: "4.6" says nothing about whether this person hosted or travelled, or what happened.
- **Why not**: hosts asked for words and context, not a number.

## Consequences

### Positive
- No more unexplained credits; trust comes from other members, with context.
- Old apps keep working: they still send `rating`, and get the new fields as extras.

### Negative
- `rating` is no longer required in the request: the contract changes in a compatible direction
  (a client that sends it is still right), but it is not purely additive.
- One migration (two nullable columns on Reviews).
- Old reviews show without a thumb or context until their authors write new ones (there is no edit).
- Credits keep acting on the discovery order while nobody can see them: to be removed with their
  own change.

### Risks
- Retaliation: a thumb down answered with a thumb down. Couchsurfing hides references until both
  have written or two weeks pass; not built here. Signal: pairs of negative references written
  within a day of each other.
