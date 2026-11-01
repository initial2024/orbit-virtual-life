# Player company system

A player may found a small number of active companies if startup capital is available. Companies are intentionally lighter than real corporate law/accounting.

Player recruitment uses public job posts -> application -> explicit hire/reject. A company needs at least eight weeks of payroll reserve before opening a post or hiring. Player wages are server-authoritative ledger transfers in multiplayer mode.

NPC employees are hired in aggregated buckets by role and grade. Their payroll, morale, skill and turnover affect company costs/results without creating one persistent record per fictional person.

Weekly statements explicitly separate real-player sales from simulated NPC demand. NPC revenue must never be presented as player revenue. Repeated losses or negative cash can mark a company insolvent. Insolvency restricts new hiring and can later lead to closure/restructuring.

## Settlement accounting

Real-player order revenue is credited at order time and is only observed in the weekly report; it is not credited again during settlement. Weekly settlement adds simulated NPC-customer revenue and deducts player/NPC payroll, rent, utilities, marketing and tax. The engine can emit transfer instructions for the future server ledger so the company cash delta is auditable.


## Payroll ownership and replay boundary

Player-company employment uses one execution owner only: `company_weekly`. Every player wage transfer is keyed by company, player and simulated week (for example `company-payroll:<company>:<account>:week:<n>`). Rebuilding the same weekly settlement therefore produces the same reference, while a later week produces a different reference.

The household monthly cash-flow module is forecast-only and never emits ledger transfers. The separate atomic monthly payroll candidate is restricted to `household_monthly/monthly` employments; both its SQL selector and database trigger reject `company_weekly`. This prevents the same company wage from being debited once by weekly company settlement and again by a monthly household path.
