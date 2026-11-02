# Virtual Life V35.2 · isolated offline preview release

This is a **static offline-only** package. It has no Cloudflare Worker, Pages Functions, D1, account exchange, shared-world APIs or cloud-save. Do not display it as an online multiplayer game.

* Repository: initial2024/orbit-virtual-life
* Immutable source: client/Orbit_Virtual_Life_V35_2_portable.html
* Gate: `npm run gate:client`; output: `npm run build:offline-preview` -> `dist/index.html` with exactly identical bytes
* Expected SHA-256: `b53f7146eee9a8f27842a9f65c043777a6216dd9d227690a29a714dde21e08af`
* Allowed Cloudflare account: `003e170d11c2de2330567c1faddb6d39` **only**. Must run `npm run gate:deploy-target` against that account **before any deployment**.
* Deploy to a new independent Pages project 'orbit-virtual-life' on the verified QQ Cloudflare account with custom domain life.cfvpn2095.cc.cd; do not alter the existing fiexvpn project. Create the game Pages project only when matching account authorization is available, preferably a private review/preview branch first. Never deploy this to the inbox account or City account.
* Keep original source client immutable; no game saves or fake admin/online mode. Do not add email account linking, D1 bindings, shared secrets, tracking or paid Cloudflare services.
* If account gate or actual browser proof fails, do not publish the asset or add a link on Orbit Hub. After publication validate desktop and 390x844/320x700 mobile, local save/reload, error-free console and absence of server-backed claims before adding a Hub entry.
