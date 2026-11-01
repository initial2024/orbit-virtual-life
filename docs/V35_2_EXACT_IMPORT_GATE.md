# V35.2 exact-byte import and deployment gate

## Exact client recovered

The authoritative V35.2 artifact has now been recovered from the Project-backed file without modifying the original:
- Project file copied to ordinary Library as a separate recovery copy;
- raw materialized size: **1,528,024 bytes**;
- raw SHA-256: **b53f7146eee9a8f27842a9f65c043777a6216dd9d227690a29a714dde21e08af**;
- Files pagination reconstruction was independently checked to reproduce the same byte count and SHA before creating the Git blob;
- Git blob: `29a461312ccd1925a8f39d5573ee646fe14afbef`;
- repository path: `client/Orbit_Virtual_Life_V35_2_portable.html`.

The accepted source ZIP record remains SHA-256
`eb9c1365e42bcccd0f7eaab949160328b6e21bab6c0795ec9cdddf89fd08af18`.

## Historical conflict resolved

The separate Library file `Orbit_Virtual_Life_V35_portable.html` is **not** byte-identical:
- 1,526,059 bytes
- SHA-256 `ee3024239a4b582d89325640092511ec061291e972827740cb37d121bd6b0b9c`

It remains explicitly forbidden as a substitute for V35.2.

## Fail-closed rules

1. `npm run gate:client` checks both the exact expected byte length and SHA of the repository client.
2. Normalized, reconstructed with a different hash, manually rewritten, or older V35 files do not pass.
3. Deployment additionally requires `npm run gate:deploy-target` with Cloudflare account `835be132294747fc96fd95f4f5994e98`.
4. City Simulator databases, app IDs and save namespaces must never be reused.
5. Exact client recovery does **not** by itself authorize cloud deployment; the target Cloudflare account is still not connected in the current tool session.
