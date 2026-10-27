# Handoff spec: Received requests

Built in `acfe1a4`, polling added in `e6d49d2`. Everything below describes what the code does today;
"Not done" lists what it does not.

## Overview

Somebody pressed the tick on my card and I have not answered. The member sees them in three places:

1. **Chats tab badge**: a count on the tab icon.
2. **Request strip** on top of Chats: header "Requests N" plus a row of faces. Tapping anything opens 3.
3. **Requests screen** (`/requests`, stack screen outside the tabs): the same cards as the feed, with the
   same two decisions.

Variant A (decided with Gabriele): one tap from the requester, the other side accepts or passes.
Accepting is an interest back, so it is always a match and opens a chat. Declining is a pass and the
requester is told nothing. Free: no credits involved.

Files: `mobile/src/app/requests.tsx`, `mobile/src/app/(tabs)/chats.tsx` (`RequestStrip`),
`mobile/src/components/TabBar.tsx`, `mobile/src/app/(tabs)/_layout.tsx`,
`backend/LocalBuddy.Api/Controllers/MatchesController.cs` (`Requests`, `RequestsCount`).

## API

| Call | Notes |
|---|---|
| `GET /api/v1/users/me/requests?page=` | `Page<ProfileCard>`, newest request first (v7 ids), 20 per page |
| `GET /api/v1/users/me/requests/count` | `{ count }`, same query as the list, so badge and screen agree |
| `POST /users/{id}/interest` | Accept. 201 + `conversationId` = match. Needs a verified identity (403 `identity_verification_required` otherwise) |
| `POST /users/{id}/pass` | Decline. 204 |

Hidden from the list and the count: anyone I already answered (interest, pass, match), anyone blocked in
either direction, banned accounts (ADR-0005).

## Design tokens used

Tokens live in `mobile/src/theme.ts`; screens never use raw hex.

| Token | Light | Dark | Used for |
|---|---|---|---|
| `background` | `#F7F4F1` | `#021C2C` | Screen ground |
| `surface` | `#FEFDFC` | `#06283D` | Card, tab bar, badge ring |
| `surfaceMuted` | `#EFEAE5` | `#0B3248` | Photo placeholder, error note |
| `text` / `textMuted` | `#1C1A19` / `#6B6560` | `#F2F6F8` / `#9FB3C0` | Titles, captions |
| `primary` | `#C8324E` | `#F45D73` | Badge fill, tick |
| `onPrimary` | `#FFFFFF` | `#032B43` | Badge number |
| `border` | `#E6E1DC` | `#16405A` | Hairlines, strip divider, face ring |
| `space.xs/sm/md/lg` | 4 / 8 / 16 / 24 | same | All gaps and insets |
| `type.display` | Playfair 600, 32/40 | same | "Requests" title |
| `type.label` | Geist 600, 14/20 | same | Strip header, count |
| `type.caption` | Geist 400, 13/18 | same | First names under faces |

Contrast (measured in the previous pass): coral with white 5.22:1, dark coral with night 4.66:1.

## Components

| Component | Spec |
|---|---|
| Tab badge | Absolute on the Chats icon, `top -8`, `left 12`, min 22 x 22, radius pill, 2 pt ring in the bar colour (`surface`), fill `primary`, number `type.caption` 11/14 tabular. `1` to `9`, then `9+`. Hidden at 0. Drawn only; the tab's accessibility label carries the words |
| Request strip | `paddingVertical md`, `gap sm`, hairline bottom border. Header row min height 44, `paddingHorizontal md`: label + count (tabular). Faces: horizontal `ScrollView`, no indicator, `gap md`, each 56 x 56 circle, 1 hairline ring, first name below (1 line). Shows the first 8 (`STRIP`) |
| Requests screen | Back chevron 44 x 44, then `display` title, `body` subtitle in `textMuted`, then the list |
| Card | `ProfileCard` as in the feed: radius `lg`, photo 4:3 (`medium`, 1080 px), name in Playfair 22, verified pill, city and role, pills, two lines of "what we will do". Two round 56 pt buttons: cross (`textMuted`) and tick (`primary`) |
| Match overlay | `MatchBurst`, as after a mutual interest in the feed: "Say hello" opens the chat, "See profile" opens `/user/[id]`, close dismisses |

## States and interactions

| Element | State | Behaviour |
|---|---|---|
| Strip | 0 requests or no cards yet | Not rendered at all (no empty row, no gap) |
| Strip, header or any face | Tap | `router.push('/requests')`. Pressed: 70% opacity |
| Card body | Tap | Opens the profile `/user/[id]` |
| Tick | Tap | `POST interest`; on `matched` shows `MatchBurst`; the card leaves the list when the lists refetch |
| Cross | Tap | `POST pass`; card leaves the list. No confirmation, no undo, requester not told |
| Both buttons, all cards | While a decision is in flight | Disabled at 45% opacity (one shared `busy`) |
| Tick | Identity not verified | `ActionError` above the list: icon + message + "Verify identity" button |
| List | Pull to refresh | Refetches list only (the Chats screen also refreshes the count) |
| List | Scroll to 60% from the end | Next page; spinner footer |
| Back | Tap | `router.back()`, or `/chats` if there is no history |

Refresh: polling every 20 s for list and count, paused while the app is in the background; an accept,
pass or block invalidates both immediately.

## Content states

| State | What the member sees |
|---|---|
| Loading | `FeedSkeleton` (same shape as the feed) |
| Empty | Icon `people-outline` 40 pt + "No requests yet" in `textMuted`, centred |
| Error (load) | Cloud-off icon, error text, "Try again" (secondary button) |
| Error (one action failed) | `ActionError` note; the list stays |
| Long text | Name 1 line, "what we will do" 2 lines, ellipsis. First name in the strip is 1 line, 56 pt wide |
| No photo | `surfaceMuted` box, same size, no icon |

Strings (`requests.*` in the four dictionaries): `title`, `subtitle`, `empty`, `count(n)` with its own
singular. IT: "Richieste", "Vorrebbero conoscerti. Solo un match apre la chat.", "Ancora nessuna
richiesta". ES and FR are not reviewed by a native speaker. French has the longest subtitle (about 80
characters) and was not checked at 360 px; the header is a plain wrapping `Text`, so it should grow, not clip.

## Responsive behaviour

| Width | Behaviour | Checked |
|---|---|---|
| 360 and 440 px | One column, card full width minus 16 pt side padding | Screenshots, light and dark |
| 768 px | Card and buttons stretch to the full width; nothing is capped | Screenshots; **not a designed layout** |

## Accessibility

- Tab: label becomes "Chats, 3 requests" (`tabBarAccessibilityLabel`); the visual badge is `aria-hidden`.
- Strip: the header is the one control for assistive technology (label "Requests, 3 requests"); the faces
  are `aria-hidden` and not focusable, so a screen reader does not walk eight identical targets.
- Card: one control labelled with everything the card shows; tick and cross are separate buttons labelled
  with the person's name (`profileCard.interestIn(name)`, `profileCard.passOn(name)`). They are siblings
  of the card body, never nested.
- Targets: header 44 pt high, back button 44 x 44, decision buttons 56 x 56, faces 56 x 56 plus name.
- Focus order: back, title, error note if any, then each card (body, cross, tick).
- Colour is never the only signal: the count is a number, the error carries an icon and words.
- `ActionError` is `role="alert"`, so a failure is announced.

## Edge cases

- Request that vanishes while I look at it (they blocked me, got banned): the next refetch drops it.
  Pressing the tick on a card that has gone: the API documents a 404 for `interest`; the exact
  on-screen result was not tried.
- Two requests answered quickly: buttons are disabled while one call runs, so the second waits.
- Count above 9 shows `9+` on the tab but the exact number in the strip header.
- A request from somebody I already passed never appears (my own answer hides it).

## Not done

- No "undo" for a decline (a paid feature on competitors, kept free here on purpose: see docs/CHECKLIST.md).
- No push notification for a new request; the badge only moves while the app is open (20 s poll).
- No tablet layout (see above).
- Not tried on a real phone: gestures, status bar over the band, large text sizes (Dynamic Type) untested.
- No unread-message badge on the same tab (needs a server-side read marker, a migration).
