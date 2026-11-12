# ADR-0012: Push notifications through Expo, best effort

**Date**: 2026-11-12
**Status**: accepted
**Deciders**: product owner, solo developer

## Context

The pilot's outcome is "the other person gets a notification with the contact request and
answers it" (docs/intent/product-priorities.md). Until now the app polled every 4 to 20 seconds
while open and learned nothing while closed, and the backend had no push channel. The pilot is
Android only, the client is an Expo app (ADR-0009), and no Firebase project exists yet.

## Decision

The backend sends through Expo's push service (`POST https://exp.host/--/api/v2/push/send`),
which forwards to FCM. Each device registers its Expo push token with
`PUT /api/v1/users/me/push-tokens` after sign-in and removes it with
`DELETE /api/v1/users/me/push-tokens` on sign-out; a token belongs to the last account that
registered it, and erasing an account cascades to its tokens.

Three events push, always after the database commit: a new contact request (to the target,
opening `/requests`), a match (to the member who asked first, opening `/chat/{id}`), and a
message that is the recipient's first unread one in that conversation (opening `/chat/{id}`).
The text carries the sender's first name, never the message, in the language the device
registered with.

`IPushSender` is the contract. `ExpoPushSender` is registered in Demo, where the pilot runs;
`FakePushSender`, which logs and records, in Development and in the tests. This is the first
real external gateway: unlike ADR-0002's payments and identity, Expo needs no account secret to
send (enhanced push security is off), so Demo does not need a fake. As in ADR-0002 and
ADR-0010, the environment name picks the implementation; there is no flag.

Sending is best effort: awaited with a 3-second timeout, any failure logged and swallowed, never
failing the request that caused it. A ticket saying `DeviceNotRegistered` deletes that token.
Polling stays as the fallback.

## Alternatives Considered

### Alternative 1: FCM directly from the backend
- **Pros**: one hop fewer, no dependency on Expo's service.
- **Cons**: a service-account key on the server, OAuth token handling, and FCM's own payload
  shape; iOS would need APNs separately later.
- **Why not**: Expo's service takes one JSON array and the client already speaks Expo.

### Alternative 2: An outbox table with a background sender and retries
- **Pros**: a push survives a crash or an Expo outage; the request never waits on the network.
- **Cons**: a table, a hosted service and retry policy for a pilot of a few dozen people.
- **Why not**: polling already covers a lost push. Revisit if pilot members report missed ones.

### Alternative 3: Keep polling only
- **Pros**: nothing to build.
- **Cons**: a closed app hears nothing, which is the pilot's whole point.
- **Why not**: it fails the outcome the pilot is measured on.

## Consequences

### Positive
- Members hear about requests, matches and replies with the app closed.
- Development and the tests send nothing over the network and can assert what would have gone.
- A chatty conversation produces one push per unread stretch, not one per message.

### Negative
- A request waits up to 3 seconds when Expo is slow.
- No receipts are read: a device Google drops later is only noticed when a ticket refuses it.
- No outbox, no retry: a push lost to a timeout or an outage is lost; the app catches up by
  polling when opened.
- Push texts carry a first name to Google's and Expo's servers, which the privacy policy
  (not written yet, CHECKLIST §7) has to mention.
- Push texts exist in en, it, es, fr, fi, sv and de; any other language falls back to English.

### Risks
- **Android builds receive nothing until the owner configures Firebase**: a Firebase project
  with an Android app for `com.gabri100steam.localbuddy`, its `google-services.json` referenced
  from `android.googleServicesFile` in `mobile/app.json`, and an FCM V1 service-account key
  uploaded to EAS (`eas credentials` or the expo.dev project credentials page), then a new build.
  Until then the app's token request fails, is swallowed, and polling carries on. Signal: no rows
  in `PushTokens` on Demo.
- Anyone holding a token can push to that device through Expo. Tokens never leave the server and
  are sent in request bodies, not URLs; enabling Expo's enhanced push security would add an
  access token to `ExpoPushSender`.
- A device whose session expired (401) keeps its token, and its notifications, until the next
  sign-in or sign-out on it: removing a token needs an authenticated DELETE.
