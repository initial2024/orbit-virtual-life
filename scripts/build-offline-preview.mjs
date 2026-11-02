import {mkdirSync, copyFileSync, readFileSync, statSync, writeFileSync} from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {verifyExactFile} from "./verify-v35_2-client.mjs";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const config=JSON.parse(readFileSync(path.join(root,"config/v35_2-client-gate.json"),"utf8"));
const source=path.join(root,"client",config.authoritative_import.file_name);
const dist=path.join(root,"dist");
const output=path.join(dist,"index.html");
// Only the exact reviewed V35.2 offline client may be copied to the preview.
// Never add Pages Functions, production D1 bindings, credentials or account sync.
const verified=verifyExactFile({filePath:source,expectedSha256:config.authoritative_import.expected_sha256,expectedBytes:config.authoritative_import.expected_size_bytes});
mkdirSync(dist,{recursive:true});
copyFileSync(source,output);
const copied=verifyExactFile({filePath:output,expectedSha256:config.authoritative_import.expected_sha256,expectedBytes:config.authoritative_import.expected_size_bytes});
if(copied.sha256!==verified.sha256||statSync(output).size!==verified.bytes)throw new Error("OFFLINE_CLIENT_MUTATED");
writeFileSync(path.join(dist,"_headers"),"/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: no-referrer\n  X-Frame-Options: DENY\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n");
console.log(JSON.stringify({mode:"offline-only",build:"exact-client",sha256:copied.sha256,bytes:copied.bytes,cloud_account_sync:false,cloud_save:false}));
