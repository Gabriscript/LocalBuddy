# Architecture Decision Records

Why the LocalBuddy backend is shaped the way it is. One file per decision, shortest useful
form, written when the decision is made rather than reconstructed later.

Records 0001 to 0004 were backfilled on 2026-08-28 from decisions already embodied in the
code; each one notes its original date.

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| [0001](0001-single-project-controllers-onto-ef-core.md) | Single project, controllers straight onto EF Core | accepted | 2026-08-26 |
| [0002](0002-fake-external-gateways-behind-interfaces.md) | Fake external gateways behind interfaces, Development only | accepted | 2026-08-27 |
| [0003](0003-local-disk-photo-storage.md) | Photo storage on local disk behind IPhotoStorage | accepted | 2026-08-27 |
| [0004](0004-no-foreign-keys-on-payments-and-reports.md) | No foreign keys on Payments and Reports | accepted | 2026-08-28 |
| [0005](0005-platform-ban-with-identity-continuity.md) | Platform ban enforced per request, with identity continuity | accepted | 2026-08-28 |
| [0006](0006-per-host-profile-visibility.md) | Per-host profile visibility, photos served through the API | accepted | 2026-08-28 |
| [0007](0007-verified-identity-required-to-contact.md) | A verified identity is required to contact another member | accepted | 2026-08-28 |
| [0008](0008-api-conventions.md) | API conventions: versioned paths, one error shape, paged collections | accepted | 2026-08-28 |

## Adding one

Copy [template.md](template.md), number it one higher than the last row, add a row above.
Record technology choices, architecture patterns, API design, data modelling, infrastructure,
security and testing strategy. Do not record naming or formatting choices.
