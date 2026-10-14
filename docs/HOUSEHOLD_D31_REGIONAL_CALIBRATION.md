# Virtual Life — D31 parity and six-region household economics (isolated candidate)

## Scope and status
This isolated branch adds a pure household cash-flow planner and tests. It does NOT modify frozen Draft PR #1. The old monolithic client functions monthlyBudget() and cyclePaycheck() are absent from the modular source tree; their integration and a real D1->D31 legacy-save replay are not yet verified. This is not a deployed player-facing fix. No Cloudflare D1/Worker/R2 creation, migration or deployment.

## Single cash-flow contract
- grossSalary: contractual monthly earnings (SIM), BEFORE payroll withholding.
- payrollTax: the withholding amount using an explicit effective rate supplied by the authoritative income/tax engine. Country policy parameters are NOT direct income tax withholding rates.
- netPaycheck: grossSalary minus payrollTax; the ONLY recurring salary deposit forecast.
- essentialExpenses/essentialTotal: estimated bills and necessary purchases, NOT deductions from a paycheck, and NEVER automatically charged here.
- spendableAfterNeeds: netPaycheck minus essentialTotal; an informative forecast, NOT account balance and NOT wages deposited.
- oneTimeStarter: separately labeled one-off new-player grant. Do not include it in salary; do not repeat after first month.
- Future city relocation reprices prospective bills, not prior transactions. Actual rent, orders and household bills have their own server-ledger transfers.
- planPaycheckTransfers generates gross-conserving intents with an employment/month-specific refId. The shared-world Worker still MUST verify employment, balances, escrow and once-only concurrent commits. Replaying this pure function proves nothing about backend idempotency.

### D31 illustration — NOT recovered original deduction split
Original reported UI displayed 108,500 as monthly spending money; D31 payout reported 64,917. Difference 43,583. For a transparent EXAMPLE ONLY split 17,500 withholding and 26,083 living costs, the correct display is gross salary 108,500 -> actual salary deposit 91,000 -> expected living costs 26,083 -> forecast flexible budget 64,917. The split is fabricated to demonstrate accounting identities, not an assertion about original source. Both first-month and second-month forecast follow the identical calculation for unchanged inputs.

## Six regions, provenance and limits
Game modifiers in src/household-cashflow.mjs are **illustrative playable tuning** in the fictional common SIM unit, anchored conceptually in public statistical material. They are NOT official indices, exchange rates, local wages, purchasing-power-parity rates or tax laws. Tokyo=1 for calibration only; existing player/NPC/company economies should not be retroactively repriced.

- Tokyo, 2025 Tokyo metropolitan household survey: 351,556 JPY monthly consumer expenditure per household with at least two persons; **not single-person minimum**. https://www.metro.tokyo.lg.jp/information/press/2026/04/2026043018
- Seoul, Seoul Data Hub: estimated average monthly individual income 3.391m KRW and credit-based consumer spending 2.111m KRW on the shown dataset; the latter is NOT full living costs. https://data.seoul.go.kr/bsp/wgs/economics/economics36.do
- Singapore, 2025 full-time resident median gross wage S$5,775 monthly including employer CPF — **not net cash pay**: https://stats.mom.gov.sg/Pages/Income-Summary-Table.aspx . 2023 mean monthly household expenditure S$5,931, not per-person spend: https://www.singstat.gov.sg/find-data/explore-data-themes/households/household-expenditure/latest-news-data
- NYC, US Census QuickFacts ACS 2020–24: household median yearly income US$80,483; median monthly gross rent US$1,821, distinct samples/cohorts: https://www.census.gov/quickfacts/fact/table/newyorkcitynewyork/INT100223
- Paris, 2024 INSEE full-time equivalent average private-sector NET salary €3,836/month, different from gross employment earnings: https://www.insee.fr/fr/statistiques/9035813?geo=COM-75056 . Paris rent observatory 2025 average 50m2 apartment rent €1,307/month: https://www.observatoire-des-loyers.fr/sites/default/files/olap_documents/rapports_loyers/Rapport%20Paris%202025.pdf
- Shanghai, 2025 all-resident annual per capita disposable income ¥91,987; consumption ¥54,765. Population measures not monthly wages: https://www.shanghai.gov.cn/nw48810/20260203/2bed33e23b324e27ae846d3a88bade53.html

Do NOT compute a city pay-to-cost rank by dividing annual household income from one city by monthly individual expenditure from another. Different currencies, household sizes, salary/gross definitions, employer contributions, sample periods and housing arrangements prevent such inference. Only apply game-region factors to simulation wages/needs independently, then playtest for affordability, progression and poverty traps.

## Remaining acceptance gates — BLOCKED
1. Locate authoritative monolithic playable client; wire monthlyBudget() and cyclePaycheck() to one forecast contract, distinguish payable salary from post-bill spending.
2. Test D1/D30/D31/D60 including unemployment, overtime, first payday, relocation, rental due dates, debt, player-company wages and restore of saved balances without double taxation or duplicate charging.
3. Backend transaction commit, concurrent retry and zero-sum ledger invariants; proof cannot be inferred from plan-only tests.
4. Product approval of six-region tuning, city job tiers and housing options before shipping. No deployment or migration yet.
