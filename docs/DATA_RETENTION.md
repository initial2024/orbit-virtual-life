# Bounded shared-world retention

The shared world should remain row-oriented and bounded:

- `ledger_entries`: retain recent detailed entries (target 90 days); roll older personal detail into `ledger_monthly`. Keep game-critical settlement references longer only for unresolved orders, loans, disputes or moderation.
- `market_state`: only the latest aggregate row per region/SKU.
- `market_buckets`: bounded chart history (target 90 daily buckets or 26 weekly buckets); older buckets are deleted/compacted by settlement jobs.
- `idempotency_keys`: short replay window only (for example 7 days), then prune.
- `checkpoints`: one current checkpoint per account. Optional recovery copy, if later added, must be short-lived and bounded.
- comments, reviews and job applications are row records and are never embedded into full personal checkpoints.

No cleanup job is deployed in Stage 16; these are retention requirements for the future Worker/settlement implementation.

- `policy_state`: one current compact row per country/region scope.
- `policy_events`: retain only the latest bounded policy history needed by the UI (target 48 events per scope or 12 simulated quarters); older events are compacted/deleted.
- `settlement_heads`: one row per settlement scope to make quarterly/weekly jobs idempotent.
