# ADR-0003: Photo storage on local disk behind IPhotoStorage

**Date**: 2026-08-27 (backfilled and amended 2026-08-28)
**Status**: accepted
**Deciders**: solo developer

## Context

Users upload profile and home photos. The upload path already does the part that matters:
it decodes the image to validate it and strips EXIF, because EXIF carries the GPS coordinates
of where the photo was taken, which for a home photo is the address of the host
(GUIDELINES section 9). Where the resulting file is then written is a deployment question, and
the deployment target is not decided yet.

## Decision

`IPhotoStorage` defines saving and deleting a photo. `LocalDiskPhotoStorage` writes into
`wwwroot/uploads` and the files are served back by `UseStaticFiles`. Controllers depend on the
interface, never on the filesystem.

## Alternatives Considered

### Alternative 1: Write to the filesystem directly from the controller
- **Pros**: fewer files, no indirection.
- **Cons**: pins the app to one node, makes the upload path untestable without a disk, and
  spreads path handling across two controllers.
- **Why not**: this was the original shape. It made the single most deployment-sensitive part
  of the app the only integration without a seam.

### Alternative 2: Go straight to S3 or Azure Blob
- **Pros**: solves scale-out now, no migration later.
- **Cons**: an account, credentials and a network dependency for every local run, before a
  hosting provider has even been chosen.
- **Why not**: premature. The interface is the part that has to exist now; the implementation
  can wait for the deployment decision.

### Alternative 3: Store the bytes in Postgres
- **Pros**: one backup, one consistency story, no orphan files.
- **Cons**: bloats the database, and serving images through the app is slower than a CDN.
- **Why not**: wrong tool, and it forecloses putting a CDN in front later.

## Consequences

### Positive
- Moving to object storage is a new class plus a registration change.
- Path traversal is handled in one place: the delete path uses the leaf filename only.
- Deleting a user now also deletes the image files, because there is one call to make.

### Negative
- With the local implementation the app cannot run more than one instance: a photo uploaded to
  one node does not exist on the other.
- User data lives inside the deployment artifact, so a container restart on ephemeral storage
  loses it.
- `wwwroot/uploads` is gitignored; anyone cloning starts with no images.

### Risks
- Deploying to a container platform without noticing this is the failure that loses user data.
  Mitigation: this must be replaced before the first real deployment, not after. The signal is
  choosing a hosting provider, not the first lost photo.
