# Stage 16 architecture

## Cloudflare account sharing

Orbit Virtual Life and Orbit City may share one Cloudflare account, while each game keeps separate D1 data. The temporary-mail account system remains the identity issuer. Do not create Cloudflare resources until schema, cost, security and migration gates pass.

## Data authority

Server authoritative: wallets, ledgers, companies, player memberships, player job applications, stores, inventory, orders, reviews/comments, shared market state, securities/loans/property/tax records.

Local only: UI settings, drafts, catalog/image cache and offline sandbox state.

## Low-bandwidth rule

Normal actions sync rows/commands, not full saves. A small head/manifest is checked before downloading a checkpoint. Full checkpoints are bounded and periodic/manual. Reviews, comments, applications, company updates and market orders are sent as narrow rows.

## NPC storage

NPC employees are aggregated by company + role + grade. A company with 100 NPC cashiers is one row, not 100 D1 rows. Only real player employment requires membership/application rows.
