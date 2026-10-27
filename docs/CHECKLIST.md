# Completion checklist

What LocalBuddy needs to go from the phone demo to a public app, measured against the apps people
already know: Hinge, Bumble (and Bumble For Friends), Tinder, and Couchsurfing as the closest
domain. Research of 2026-10-27; sources at the end. Claims marked *unverified* could not be
confirmed on an official page.

Status: `[x]` done, `[~]` done for the demo only (fake gateway, placeholder, untested on a device),
`[ ]` missing. Each open item names how it is checked.

Milestones:
- **Demo**: Gabriele shows the app from his phone, backend in demo mode on Hetzner.
- **Beta**: a closed group of real people in one or two cities.
- **Launch**: public on the Play Store and the App Store.

## 1. Onboarding and profile

| | Item | Milestone | Check |
|---|---|---|---|
| [x] | Register, login, five-step onboarding (role, profile, about, listing, verify) | Demo | walked in the web preview |
| [x] | Prompts instead of a long bio ("what we'll do", "why I host", languages) | Demo | profile screen |
| [x] | Up to 12 photos, home photos for overnight hosts | Demo | `PhotoUploadTests` |
| [~] | Identity verification with a badge (all four reference apps) | Demo: fake verifier | ADR-0002, ADR-0007 |
| [ ] | Real identity verification: Stripe Identity or a selfie check, free for the member | Beta | a verified test account on a device |
| [ ] | Profile completeness meter and the next step to take | Beta | Me screen |
| [ ] | Voice or video prompt (Hinge) | Later | — |

## 2. Discovery and matching

| | Item | Milestone | Check |
|---|---|---|---|
| [x] | Feed with filters (city, time of day, overnight, car, smoking, pets) | Demo | FilterSheet |
| [x] | Role capsule: everyone, hosts, travellers | Demo | Discover screen |
| [x] | Interest and pass; mutual interest opens the chat | Demo | `ConversationServiceTests` |
| [x] | **Received requests ("Likes you")**: who is interested in me, accept or decline (variant A) | Demo | `RequestTests`; Chats strip and Requests screen |
| [ ] | Undo the last pass (Tinder Rewind, Bumble Backtrack: paid there; free here) | Beta | — |
| [ ] | Travel mode: browse a city before arriving (Bumble Travel, Tinder Passport) | Beta | — |
| [ ] | A small daily selection (Hinge Standouts) | Later | — |
| [ ] | Discovery ordering beyond credits (distance, availability overlap, freshness) | Beta | today: credits then id |

## 3. Chat

| | Item | Milestone | Check |
|---|---|---|---|
| [x] | 1:1 chat after a match or a paid unlock, paged history | Demo | chat screen |
| [x] | New-message refresh without reopening (polling every 4 s in a chat, 15 s inbox; SignalR later) | Demo | tried with two accounts on the web preview; not on two devices |
| [ ] | Icebreakers drawn from the other person's prompts (Hinge Convo Starters) | Beta | — |
| [ ] | Photos in chat, with nudity blurred (Bumble Private Detector) | Later | — |
| [ ] | Read receipts: decide, Bumble deliberately has none | Beta | decision in an ADR |
| [ ] | Unmatch that closes the chat for both | Beta | — |

## 4. Safety and trust

| | Item | Milestone | Check |
|---|---|---|---|
| [x] | Report and block from profile and chat, unblock from Me | Demo | `BlockQueriesTests` |
| [x] | Moderation queue, bans with identity continuity | Demo | ADR-0005, `IdentityBanTests` |
| [x] | Reviews only after both wrote in the conversation, one per pair | Demo | `ReviewsController` |
| [ ] | Safety centre screen: meeting in public, telling a friend, emergency number per country | Beta | — |
| [ ] | Share my meeting with a trusted contact (Tinder Share My Date, Bumble) | Beta | — |
| [ ] | Report after unmatch, from past conversations (Hinge) | Beta | — |
| [ ] | Reviews published only when both sides wrote one (Couchsurfing) | Beta | today: published at once |
| [ ] | Age gate 18+ and store rating 17+/18+ | Launch | store listing |

## 5. Notifications and retention

| | Item | Milestone | Check |
|---|---|---|---|
| [ ] | In-app badge for new requests and messages | Demo | requests done on the Chats tab; unread messages still open |
| [ ] | Push notifications (Expo Notifications, FCM/APNs) | Beta | a device receives one |
| [ ] | Email for account events (verification, password reset) | Beta | — |
| [ ] | Password reset | Beta | — |
| [ ] | Gentle nudge when it is your turn to reply (Hinge Your Turn) | Later | — |

## 6. Money

| | Item | Milestone | Check |
|---|---|---|---|
| [~] | Paid one-off unlock, credits earned by hosting | Demo: fake gateway | ADR-0002 |
| [ ] | Real payments: Stripe for the unlock; Play Billing / StoreKit if sold inside the app | Launch | store review |
| [ ] | Subscription with cancel and webhook (deliberately absent today) | Later | — |
| [ ] | Free basics stay free: verification, undo, seeing who is interested | — | product rule |

## 7. Privacy and account

| | Item | Milestone | Check |
|---|---|---|---|
| [x] | Delete account in the app, with cascade | Demo | `ErasureTests` |
| [x] | Per-host profile visibility to anonymous visitors | Demo | ADR-0006 |
| [ ] | Export my data (GDPR art. 20; Hinge, Tinder offer it) | Beta | a JSON download |
| [ ] | Privacy policy and terms, linked from register | Beta | — |
| [ ] | Token refresh and revoke; today a 30-day JWT survives logout | Beta | `TokenService` |
| [ ] | Incognito: visible only to people I liked (paid in Bumble and Tinder) | Later | — |

## 8. Quality, accessibility, languages

| | Item | Milestone | Check |
|---|---|---|---|
| [x] | English, Italian, Spanish, French with an in-app picker | Demo | typed dictionaries |
| [ ] | Native-speaker review of Spanish and French | Beta | — |
| [x] | Screen-reader labels and roles on the web build | Demo | audit of 2026-09-22 |
| [ ] | Same audit on Android TalkBack and iOS VoiceOver | Beta | a device |
| [ ] | Run on a real phone: keyboard, safe areas, back gesture, photo picker | Demo | Gabriele's phone |
| [x] | Photo sizes for mobile: `?size=thumb` (256 px) and `medium` (1080 px) instead of 2048 px originals (2.26 MB to 598 KB and 50 KB on a demo photo) | Demo | `PhotoUploadTests`; resized per request, no cache yet |
| [ ] | Crash and error reporting (Sentry or similar) | Beta | — |
| [ ] | End-to-end tests of the main flows (Maestro or Detox) | Beta | CI |

## 9. Brand and release

| | Item | Milestone | Check |
|---|---|---|---|
| [x] | App icon, adaptive icon, splash, favicon: "arch that speaks", night and coral | Demo | `mobile/assets/brand/`; not yet seen on a launcher |
| [~] | Backend demo mode, Dockerfile, compose behind Caddy | Demo | ADR-0010 (proposed); `docker build` passes, `docker compose up` on an empty database not run yet |
| [ ] | Landing page in the new palette (still ink `#1E3A5C`) | Beta | `web/` |
| [ ] | Deploy to Hetzner (needs Gabriele's go-ahead and domain) | Demo | `curl` on the public URL |
| [~] | APK through EAS `preview` profile | Demo | `eas build -p android --profile preview` (Gabriele's Expo login) |
| [ ] | Landing page: real photos, invitation destination, domain for hreflang | Beta | `web/` |
| [ ] | Play Store and App Store listings, screenshots, data-safety form | Launch | — |
| [ ] | Production config: `KnownProxies`, no dev JWT key, CORS closed | Launch | startup check |

## Sources

- Verification: help.hinge.co/hc/en-us/articles/45715796564243-Face-Check-Scan;
  support.bumble.com/hc/en-us/articles/28785291893917-Verifying-with-your-ID;
  blog.couchsurfing.com/new-and-improved-verified-membership
- Paid features: help.hinge.co/hc/en-us/articles/38014282744595-Subscription-and-Purchase-Benefits;
  tinder.com/feature/subscription-tiers;
  support.bumble.com/hc/en-us/articles/32668790872733-Understanding-Bumble-s-paid-features-and-subscription-plans
- Chat: help.tinder.com/hc/en-us/articles/115003341583-Messaging-a-Match;
  support.bumble.com/hc/en-us/articles/32668018305181-Private-Detector
- Safety: policies.tinder.com/community-resources/safety-features/intl/en;
  help.hinge.co/hc/en-us/articles/47066375568787-How-do-I-Report-Someone-After-We-ve-Unmatched;
  support.couchsurfing.org/hc/en-us/articles/50048897729435-What-Does-Couchsurfing-Do-to-Keep-the-Community-Safe
- Data: help.hinge.co/hc/en-us/articles/360011235813-How-do-I-request-a-copy-of-my-personal-data;
  help.tinder.com/hc/en-us/articles/115005626726-How-do-I-request-a-copy-of-my-personal-data;
  support.bumble.com/hc/en-us/articles/28784017124381-Deleting-your-account
- Unverified: prices, Tinder match expiry and read receipts, media in Hinge chat, Bumble export.
