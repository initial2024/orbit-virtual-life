# Orbit Virtual Life — Stage 16

A bilingual, local-first virtual life/economy simulation. Stage 16 centers the shopping flow on **product → stores → price/stock/rating/details**, expands the regional store network, adds NPC/player-company recruitment primitives, advertising and regional competition, improves bank credit simulation, and defines a slim server-authoritative shared-world protocol for later account integration.

## Current offline simulation
- 6 simulated regions, 1,556 fictional stores, 78 store types.
- 232 unified tradable items; original 168 commerce SKUs remain bridged to stores.
- Product-first store comparison and a clearly labeled local/synthetic recommendation board.
- Local wallet/ledger, loans, property, long/short fictional securities, taxes, travel, daily life, food/delivery and player company simulation.
- NPC hiring, offline-pending player job posts, bounded ad campaigns, policy support and foreign-company competition.
- bilingual Chinese/English UI.

## Shared World (not connected yet)
Server-authoritative objects are defined for wallets, ledgers, businesses, inventory, orders, comments/reviews/reactions, market rows, idempotency and player-company jobs/members. UI preferences, drafts and caches stay local. See `docs/SHARED_WORLD_D1_SCHEMA_V16.sql` and `docs/ACCOUNT_SYNC_PROTOCOL_V1.md`.

The proposed deployment uses the same Cloudflare account and temporary-mail identity issuer as Orbit City, while keeping `orbit-life-world` and `orbit-city-world` as separate D1 databases. Routine sync uses small row/action deltas; full checkpoints are periodic/manual/recovery only.

## Verification
Local Stage 16 candidate: `npm test` -> 180/180 PASS; `npm run check` -> PASS; Chromium mobile/desktop Stage 16 smoke -> PASS.

## Important limits
Everything involving money, credit, stocks, lottery, taxes, visas, crime, economic development and business outcomes is a **fictional simulation**. No real brokerage, gambling, payment, banking, tax filing or immigration service is provided. Cross-player data is not active in this branch.

## Release state
Feature branch only. No merge, no deployment and no Cloudflare resource creation in Stage 16.
