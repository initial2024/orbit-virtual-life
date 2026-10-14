# Privacy model

The current release candidate is offline-first. UI preferences, drafts, catalog/media cache and recovery slots remain local. Shared-world protocol objects are definitions only; no server endpoint is configured in this build.

A future account-linked deployment should upload only the minimum authoritative rows needed for multiplayer behavior and use the shared temp-mail identity subject as an opaque account identifier. Do not commit player saves, sessions, credentials or private exports to this public repository.
