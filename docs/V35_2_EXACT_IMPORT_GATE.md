# V35.2 exact-byte import and deployment gate

This branch does **not** declare the V35.2 client imported or production-ready.

## Authoritative record

The acceptance record names `Orbit_Virtual_Life_V35_2_portable.html` with SHA-256
`b53f7146eee9a8f27842a9f65c043777a6216dd9d227690a29a714dde21e08af`
and source ZIP SHA-256
`eb9c1365e42bcccd0f7eaab949160328b6e21bab6c0795ec9cdddf89fd08af18`.

The current Project-backed V35.2 file does not expose an authorized raw-byte materialization path, so the authoritative bytes have **not** been re-retrieved in this session.

## Conflict discovered on 2026-11-01

A different Library file named `Orbit_Virtual_Life_V35_portable.html` was materialized as raw bytes:
- 1,526,059 bytes
- SHA-256 `ee3024239a4b582d89325640092511ec061291e972827740cb37d121bd6b0b9c`

It therefore must not be substituted for the accepted V35.2 artifact.

## Fail-closed rules

1. `npm run gate:client` fails unless the exact accepted SHA is present at `client/Orbit_Virtual_Life_V35_2_portable.html`.
2. No normalized, reconstructed, line-rejoined or manually rewritten HTML may satisfy the gate.
3. Deployment must additionally pass `npm run gate:deploy-target` with Cloudflare account `835be132294747fc96fd95f4f5994e98`.
4. City Simulator databases, app IDs and save namespaces must never be reused.
5. Until both gates pass, no production or cloud-enabled deployment is authorized.
