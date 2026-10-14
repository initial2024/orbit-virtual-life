# Security notes

- Never commit `.env`, Cloudflare tokens, account sessions, user exports, transfer objects or production secrets.
- Browser state is untrusted for multiplayer money, inventory, company ownership, market orders and verified reviews.
- Shared-world mutations require server-side authentication, revision checks, idempotency and authoritative ledger/inventory transactions.
- This repository contains no production Cloudflare binding or credential.
