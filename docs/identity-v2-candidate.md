# Virtual Life app-bound identity candidate

Server-only module: src/identity-ticket.mjs. No HTTP exchange/session/checkpoint endpoint or client connection is delivered by this change. Do not report a completed cloud login from these unit tests.

Required configuration names (no values in source): ORBIT_ISSUER, ORBIT_AUDIENCE_VIRTUAL_LIFE, ORBIT_ED25519_PUBLIC_JWK, GAME_CLOUD_BIND_ENABLED. Separate D1 binding: LIFE_DB. There is deliberately no fallback to City GAME_DB, a generic audience, a shared exchange credential or an issuer private key. Production flag stays false.

Supported purposes: game_login and account_deprovision. Both require signed app_id=virtual-life. game_admin is unsupported and all admin subjects are rejected. The issuer currently delivers deprovision retries to City only; implement app-scoped delivery state before enabling Life publicly.

0003_identity_ticket_nonce.sql is an unapplied candidate for the authorized Virtual Life account 835be132294747fc96fd95f4f5994e98 only. It must never run on City or Orbit Hub. No Cloudflare resource is created or modified by this PR. Plan bounded expired-nonce cleanup on the dedicated backend before enabling public traffic; unexpired nonce entries must never be evicted.

Next gates: dedicated account connection, review/apply Life schema there, same-origin exchange and sessions, issuer Life deprovision fanout, account tombstones/logout/deletion, manifest/checkpoint synchronization, V35.2 client adapter, browser/runtime A/B isolation. Never substitute the City account or its save namespace.
