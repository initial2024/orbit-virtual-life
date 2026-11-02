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

## Verified 2026-11-02 ownership and actual deployment

* Verified connected Cloudflare account: `003e170d11c2de2330567c1faddb6d39` (`zo46@qq.com`), DNS zone `cfvpn2095.cc.cd`.
* Public user-owned hostname: `https://life.cfvpn2095.cc.cd/`. Cloudflare Worker Custom Domain is enabled and Cloudflare created its proxied AAAA automatically.
* Dedicated Worker script: `orbit-virtual-life-static`; 100% deployment version `aa8b77fd-18fc-41c2-b376-b16ddaebf20f`. Source was the immutable V35.2 Git blob `29a461312ccd1925a8f39d5573ee646fe14afbef`, verified UTF-8 length 1,528,024 bytes and the prior CI pinned SHA-256.
* The original HTML is embedded as a JS string in a dedicated Worker. Worker GET `/` and `/index.html` serves this exact offline client; GET `/_health` returns release metadata; everything else is 404 and writes are rejected. No D1, KV, Pages Functions, cloud sync, login tokens or emails are accessible. This is not multiplayer.
* The existing `fiexvpn` Pages project and its apex domain were not changed. An empty direct-upload Pages project created during the Git-install-error fallback was deleted, leaving only the Worker for Life.
* City is separately routed at `https://city.feiling.ccwu.cc/` in another connected account (`automice2095@outlook.com`), with Cloudflare Worker `orbit-city-custom-domain` pinned to the existing cloud-disabled QA origin. Its data is never bound to Life or mail.
* Run `node scripts/verify-owned-game-domains.mjs` from a real Internet-connected environment to validate TLS, actual HTML bytes, JS loads, and fail-closed API responses. Control-plane successful deployment is not a substitute for this network acceptance.
