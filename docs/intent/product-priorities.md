# Intent: product priorities for the pilot

**Date**: 2026-11-12
**Status**: confirmed by the owner (interview, 2026-11-12)

## Outcome

A traveller says "I'll be in Florence Dec 12–19", or "I'm already here, fancy a coffee?".
The other person gets a notification with the contact request and answers it.

## Users

- Pilot in **Florence** and **Helsinki**, with people the owner knows.
- Then Italy and Finland. The app stays usable anywhere in Europe.
- Nordic users travel between countries often (Finland north/south, Finland–Sweden).

## Why now

The pilot's feedback drives what gets improved next.

## Success

Real meetings between people who found each other through trip dates or "free today".

## To build

1. **Trips with dates**: a city plus a from/to range, which may start today. Discovery shows
   "Arriving" and "In town now".
2. **Free today**: anyone, host or traveller, can switch it on. It expires by itself at midnight.
   It is not an availability calendar: one field, no schedule.
3. **Push notifications** for contact requests and replies. Today the app polls and the backend
   has no push channel.
4. **Languages**: Finnish, Swedish and German, added to en/it/es/fr. A native speaker reviews
   the strings.

## Constraints

- **Everything is free during the pilot.** Payments come later.
- **Hosts never pay for the service**, because they keep the platform alive. This applies once
  payments exist. Replying to and accepting requests is already free today.
- **The platform only connects people**, like Couchsurfing:
  - overnight stays are at the host's discretion;
  - legal obligations are the members' responsibility;
  - the platform reminds people of them and never files anything on a host's behalf.
- **The host holds more power in a match**: they receive many requests and choose.

## Decisions after the architecture review (2026-11-12)

- **Environment**: pilot users run on the demo server, by invitation only. The owner approves
  identities by hand as moderator, instead of the automatic approval. A new ADR records this
  exception to ADR-0010.
- **Who meets whom**: anyone can contact anyone, as on Couchsurfing. A traveller can meet other
  travellers in the same city. With a city set, discovery shows the city's residents and its
  visitors (members with an active trip there), and hides neither group.
- **Cities**: trips and profiles pick a city from the suggestions. Free text stays only for a
  city nobody has entered yet.
- **Platform**: Android only for the pilot. Push needs a Firebase project, not verified yet.
- **Privacy policy**: needed before real users, because trips and push texts are personal data
  (CHECKLIST §7). It is not written yet.

## Ideas added during the build (2026-11-12)

- **Loading tips**: while a screen loads, a short tip appears without getting in the way. Some
  tips are about behaviour (meet somewhere public first, answer requests, never ask for money),
  others are things to do together.
- **Car owners can offer a lift**: a suggestion, not a rule. It is shown as a tip and as a hint
  next to the "has a car" field. There is no new data field: lifts must stay free (GUIDELINES §2).
- **Photos**: Pexels images show a trip or a situation (a party, a pub, a city, a plane), never a
  member profile.

## Out of scope (for now)

- Payments (Stripe, Google Play Billing).
- Affiliate links and ads: GUIDELINES §4 forbids them today.
- Community and events.
- The compact Couchsurfing-style card and a city page.
- Google sign-in.

## Follow-ups this decision creates

- **GUIDELINES §7** says hosts are registrable only in Italy. The pilot includes Helsinki hosts.
  The owner states Finland has no notification obligation for free stays. This is **not verified**.
- **GUIDELINES §7** recommended phase 1 without overnight stays. The owner chose to let the
  host decide.
- **The overnight confirmations in GUIDELINES §5 are Italy-specific** (Alloggiati Web, Questura).
  Hosts in other countries need country-specific or generic wording.
- **The owner's list of European notification rules needs deepening**:
  - 16 countries are unknown, Sweden among them;
  - several sources are forums;
  - its Italy entry (a declaration within 48 h for non-EU guests) differs from GUIDELINES §5
    (Alloggiati Web within 24 h).
