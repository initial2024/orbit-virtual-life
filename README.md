# Orbit Virtual Life

Open-source virtual life and shared-economy simulation.

## Current development status

Stage 16 is being developed on `work/stage16-shared-world-companies`.

Implemented in the current source branch:

- shared Orbit account-sync v1 contract with `appId=virtual-life`
- narrow row/action synchronization instead of uploading the full game state for comments, reviews, company recruitment and market commands
- player-founded company core
- player job posts, applications, hire/reject, resignation and termination
- compact NPC staffing by company + role + grade
- payroll reserve rules and player wage ledger-transfer plans
- weekly company settlement separating real-player sales from simulated NPC demand
- bounded shared-world D1 schema candidate and retention policy
- one bounded checkpoint per account, with small head/manifest checks

Cloudflare resources are intentionally **not created or migrated yet**. The migration in `migrations/` is a design candidate.

Generated product media and monolithic offline preview files remain build artifacts rather than authoritative source.

## Safety / scope

All currency, companies, securities, loans, lotteries, taxes, immigration and other institutions are fictional simulation mechanics unless an official informational source is explicitly linked. No real-money brokerage, gambling, lending, banking or immigration service is provided.

See `DISCLAIMER.md`, `docs/ARCHITECTURE.md`, `docs/ACCOUNT_SYNC_V1.md`, and `docs/COMPANY_SYSTEM.md`.
