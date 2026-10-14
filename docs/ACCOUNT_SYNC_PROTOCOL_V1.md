# Orbit Account Sync Protocol v1 — design only

Both games may use the same Cloudflare account and the same temp-mail identity issuer, but they keep separate D1 failure domains:

- `orbit-life-world`
- `orbit-city-world`

They share only the protocol shape: account subject, `game_id`, revision, digest, bounded deltas, idempotency nonce, and occasional compressed checkpoints.

## Low-bandwidth rule
1. Login asks for a <=1 KiB manifest first.
2. Matching revision+digest means no checkpoint download.
3. Comments, reviews, company jobs, inventory reservations and market orders are small row/delta mutations; never upload the full save just because one row changed.
4. Full checkpoint is exceptional: manual save, divergence recovery, or bounded periodic checkpoint.
5. Keep current checkpoint + one recovery checkpoint. One-time transfer objects belong in short-lived R2 prefixes (`life-transfer/`, `city-transfer/`) and are not permanent world authority.

Shared identity does **not** mean shared game wallets or shared database tables. Server-side transaction/idempotency rules remain per game.
