# Orbit account sync v1

Both games use the same identity subject from the temporary-mail account system but keep app-specific revisions and data stores.

Routine request: app_id + account_id + device_id + request_id + expected_revision + small action payload.

Routine response: committed revision + digest + minimal result. Full state is not returned unless required.

Login/resume: request a <=1 KiB head first. Download a compressed checkpoint only when checkpoint_revision or digest differs.

Checkpoint: at most one authoritative current checkpoint per app/account, <=192 KiB encoded and <=512 KiB decoded. Previous recovery copy, if retained, should be short-lived and bounded.

Shared-world rows (comments, reviews, company jobs, applications, market orders) are synchronized individually and must not be embedded in personal save blobs.
