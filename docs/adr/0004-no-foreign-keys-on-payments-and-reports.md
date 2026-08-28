# ADR-0004: No foreign keys on Payments and Reports

**Date**: 2026-08-28
**Status**: accepted
**Deciders**: solo developer

## Context

Every entity now has an explicit relationship configured in `LocalBuddyDbContext`, so deleting
a user cascades in the database and GDPR erasure is a single `Remove`. Two tables do not fit
that rule. Accounting records have to survive the account that produced them, and abuse reports
have to survive the account they are about, otherwise deleting an account erases the evidence
against it. Both tables reference users by id, and every available referential action loses
something.

## Decision

`Payment` and `Report` keep `Guid` user ids with no foreign key constraint and no cascade.
They carry a plain index on the column instead. Every other entity has a real foreign key with
`OnDelete(Cascade)`.

## Alternatives Considered

### Alternative 1: `OnDelete(Cascade)`
- **Pros**: consistent with every other table, no special case to remember.
- **Cons**: erasing an account destroys its payment history and the reports filed against it.
- **Why not**: accounting records must be retained, and letting an abuser wipe their own report
  history by deleting the account is a safety hole.

### Alternative 2: `OnDelete(Restrict)`
- **Pros**: the database guarantees the records are never lost.
- **Cons**: the delete fails outright as soon as a user has ever paid or been reported.
- **Why not**: it breaks the GDPR erasure path, which is not optional.

### Alternative 3: Nullable columns with `OnDelete(SetNull)`
- **Pros**: keeps the row, keeps a real foreign key, anonymises on delete.
- **Cons**: throws away the link that lets several reports about the same person be correlated,
  and makes the column nullable for every reader.
- **Why not**: correlating repeat reports about one person is the main thing the report table
  is for. This is the closest alternative and the one to revisit if a DPO asks.

## Consequences

### Positive
- Erasure works with one `Remove` and the database does the rest.
- Payment history and abuse history survive account deletion, as intended.
- Reports about the same deleted user can still be grouped by id.

### Negative
- The two tables can hold ids that point at nobody, and nothing in the schema says so.
- `Payment.UserId` and `Report.ReportedId` cannot be joined with a guarantee of a match.
- This is a special case a future reader has to know about, which is why it is written down and
  commented at both `OnModelCreating` and the erasure endpoint.

### Risks
- A future entity gets added with the same reasoning by copy-paste, without the reasoning being
  true. Mitigation: `ErasureTests` asserts the full cascade, so an entity added without a
  foreign key fails the test suite rather than passing quietly.
- Retained rows are pseudonymised, not anonymised. If a DPO requires true anonymisation, the
  answer is Alternative 3 plus a stored hash, and this ADR gets superseded.
