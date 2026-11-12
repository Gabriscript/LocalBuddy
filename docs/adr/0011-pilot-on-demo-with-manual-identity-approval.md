# ADR-0011: The pilot runs on Demo, with identities approved by hand

**Date**: 2026-11-12
**Status**: proposed
**Deciders**: product owner, solo developer

## Context

The owner wants a pilot in Florence and Helsinki with people he knows, before Stripe exists
(docs/intent/product-priorities.md). The only hosted environment is Demo (ADR-0010), which says it
is not for real users because its fake verifier approves every identity check. That was fine for
invented people; for real ones it is not. Members meet strangers and may host them overnight, and
ADR-0007 promises hosts that the platform has established who is at the door. An automatic "yes"
breaks that promise without anyone noticing.

## Decision

The pilot runs on Demo, invite-only, and in Demo a moderator approves each identity by hand.
`Program.cs` registers `ManualIdentityVerifier` in Demo (Development keeps `FakeIdentityVerifier`):
it answers every check with `Pending`, so `POST /users/me/verify` stamps
`IdentityVerificationRequestedAt` and the member stays unverified. The moderator lists the queue
with `GET /moderation/verifications` and approves with `POST /moderation/users/{userId}/verify`,
which sets `IdentityVerified` and `AgeVerified` and is idempotent. No `IdentitySubjectHash` is
stored on manual approval: there is no provider handle, and every new account must pass the same
moderator, who is the ban continuity ADR-0005 asks for.

From your own machine, with `API` ending in `/api/v1` (as in `seed-demo.sh`) and `MOD_TOKEN` the
token a moderator's `POST /auth/login` returned, both in the environment, never on the command line:

```bash
curl -fsS -H "Authorization: Bearer $MOD_TOKEN" "$API/moderation/verifications"
curl -fsS -X POST -H "Authorization: Bearer $MOD_TOKEN" "$API/moderation/users/<userId>/verify"
```

`backend/scripts/seed-demo.sh` approves its nine invented people with a database write instead.

## Alternatives Considered

### Alternative 1: Keep automatic approval on Demo
- **Pros**: no code change.
- **Cons**: anyone who learns the address registers, is "verified", and can contact members.
- **Why not**: a silent pass on identity is the failure ADR-0002 exists to prevent, now with real people.

### Alternative 2: A flag such as `Identity:ManualApproval`
- **Pros**: any environment could opt in or out.
- **Cons**: set wrong once, the pilot approves everybody again, and nothing says so.
- **Why not**: ADR-0002 and ADR-0010 already chose the environment name over a flag; the verifier
  implementation is picked by it, so there is nothing to misconfigure.

### Alternative 3: Treat every unverified member as pending, no new column
- **Pros**: no migration.
- **Cons**: the queue would hold everyone who never asked, and the app could not tell "waiting for
  approval" from "never started".
- **Why not**: one nullable timestamp answers both.

### Alternative 4: A fabricated per-account identity hash, as the Development fake does
- **Pros**: the column is never null.
- **Cons**: it claims a continuity that does not exist; a ban could never match it.
- **Why not**: null is the honest value, and the ban code already handles it.

## Consequences

### Positive
- Nobody reaches another member on the pilot without the owner having approved them.
- Local work and the tests are unchanged: Development still approves at once.
- `IdentityCheck.Pending` is the shape Stripe Identity's asynchronous result will need anyway.

### Negative
- **Real personal data now lives on the demo server**: names, emails, cities, photos, trips and
  messages of people the owner knows. ADR-0010's "not for real users" no longer holds for Demo;
  backups and access to the server have to be treated accordingly.
- **The privacy policy does not exist yet (CHECKLIST §7). It must be written and shown before
  anybody is invited.**
- Approval waits for one person; a member may sit in the queue for hours. The client has to show
  the waiting state (`VerificationResult.pending`, `MyProfile.identityVerificationPending`).
- Pilot accounts carry no identity hash. When a real verifier arrives they have to verify again
  to join ban continuity.
- Payments on Demo remain fake; the pilot is free, so nothing is charged.

### Risks
- Invitations leak and strangers register. Mitigation: they wait in the queue and cannot contact
  anyone; the owner approves only people he knows. Signal: queue entries he does not recognise.
- The approval endpoint outlives the pilot and lets a moderator verify someone in production
  without a document. Mitigation: revisit it when a real `IIdentityVerifier` is registered;
  every approval is logged with the moderator's id.
