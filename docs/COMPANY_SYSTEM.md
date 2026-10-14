# Player company system

A player may found a small number of active companies if startup capital is available. Companies are intentionally lighter than real corporate law/accounting.

Player recruitment uses public job posts -> application -> explicit hire/reject. A company needs at least eight weeks of payroll reserve before opening a post or hiring. Player wages are server-authoritative ledger transfers in multiplayer mode.

NPC employees are hired in aggregated buckets by role and grade. Their payroll, morale, skill and turnover affect company costs/results without creating one persistent record per fictional person.

Weekly statements explicitly separate real-player sales from simulated NPC demand. NPC revenue must never be presented as player revenue. Repeated losses or negative cash can mark a company insolvent. Insolvency restricts new hiring and can later lead to closure/restructuring.

## Settlement accounting

Real-player order revenue is credited at order time and is only observed in the weekly report; it is not credited again during settlement. Weekly settlement adds simulated NPC-customer revenue and deducts player/NPC payroll, rent, utilities, marketing and tax. The engine can emit transfer instructions for the future server ledger so the company cash delta is auditable.
