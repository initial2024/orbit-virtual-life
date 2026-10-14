# Final-candidate checklist

## Function model
- [x] 6-region life/economy simulation baseline
- [x] 961 fictional stores / 56 store types / 232 unified trade items in validated offline client
- [x] local life, cooking, delivery, travel, finance, property, loans, tax narrative, stock long/short and company simulation
- [x] player company founding and bounded company count
- [x] player job posts -> application -> hire/reject
- [x] employee resignation/termination boundaries
- [x] aggregated NPC hiring, payroll, morale and turnover
- [x] national fictional policy layer
- [x] regional fictional policy layer
- [x] policy effects on business cost/tax/demand, household costs, housing, transit and safety
- [x] low-bandwidth shared account protocol
- [x] server-authoritative object boundaries
- [x] slim per-game D1 design and bounded retention

## Validation
- [x] validated offline Stage 17 client: 178/178 Node tests
- [x] validated offline Stage 17 desktop/mobile Chromium smoke
- [x] Orbit City isolated V22 CI run 38558870428: full verify + build + static Worker + desktop/mobile smoke PASS
- [ ] shared-world Worker/API implementation against a real isolated D1
- [ ] temporary-mail identity issuer integration
- [ ] multi-player concurrency/idempotency acceptance against D1
- [ ] cost gate using isolated Cloudflare resources
- [ ] production migration / deployment

## Release boundary
No Cloudflare resources, migration, production deployment, or PR merge is authorized by this checklist. The project is a final-candidate code/design state, not a live multiplayer release.
