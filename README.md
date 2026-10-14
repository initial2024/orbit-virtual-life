# Orbit Virtual Life

Open-source virtual life and shared-economy simulation.

## Final-candidate direction

The current development branch contains the modular core for:

- shared-world low-bandwidth account sync;
- player companies, real-player job applications and aggregated NPC staffing;
- national + regional fictional policy simulation;
- slim D1 schema for wallets, ledgers, companies, stores, inventory, orders, reviews/comments and shared market state;
- bounded checkpoints and row-oriented synchronization.

The validated offline Stage 17 client additionally contains 961 fictional stores / 56 store types / 232 unified traded items, long-term life/finance/travel systems and the local simulation UI.

### Important boundaries

This project is a fictional simulation. It is not a bank, brokerage, lender, lottery/gambling service, tax-filing service, immigration service, employment agency, or real payment platform. Virtual currency has no cash value.

National/regional policy values are game calibration and do not represent current law, political positions, or jurisdiction rankings.

### Cloud architecture

Orbit Virtual Life and Orbit City are designed to share one Cloudflare **account** and one identity subject, while keeping separate game D1 databases/namespaces. Routine shared-world updates synchronize narrow rows/actions; full compressed checkpoints are bounded and periodic/manual rather than transferred after every action.

No Cloudflare resource is created by this branch.
