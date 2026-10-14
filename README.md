# Orbit Virtual Life

Offline-first fictional life/economy simulation with a future low-bandwidth shared world.

Stage 16 release candidate includes bilingual UI, 6 simulation regions, 1,285 fictional stores across 76 store types, 232 unified traded items, shopping/delivery/travel/life/finance systems, loans and fictional securities, housing/resale, player companies, NPC recruitment, pending real-player job postings, and national/regional policy simulation.

## Local verification

Tests require Node 20+:

```bash
npm test
npm run check
```

The complete single-file offline preview and media bundle are packaged separately from the source branch while the public repository is being normalized.

## Multiplayer boundary

The current build performs no shared-world network I/O. `src/account-sync.mjs` and `src/shared-world.mjs` define the future protocol. The intended deployment uses the same Cloudflare account and shared temp-mail identity as Orbit City while keeping a separate Virtual Life D1 database.

See `DISCLAIMER.md`, `PRIVACY.md`, `SECURITY.md` and `docs/`.
