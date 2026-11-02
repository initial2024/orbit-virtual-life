import test from "node:test";
import assert from "node:assert/strict";
import {existsSync,readFileSync,rmSync,statSync} from "node:fs";
import {execFileSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import path from "node:path";
import {verifyExactFile} from "../scripts/verify-v35_2-client.mjs";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const config=JSON.parse(readFileSync(path.join(root,"config/v35_2-client-gate.json"),"utf8"));
test("exact V35.2 preview packaging preserves trusted client and does not invent backend",()=>{
 const dist=path.join(root,"dist");
 rmSync(dist,{recursive:true,force:true});
 const output=execFileSync(process.execPath,["scripts/build-offline-preview.mjs"],{cwd:root,encoding:"utf8"});
 const status=JSON.parse(output.trim());
 assert.equal(status.mode,"offline-only");
 assert.equal(status.cloud_account_sync,false);
 assert.equal(status.cloud_save,false);
 const file=path.join(dist,"index.html");
 const result=verifyExactFile({filePath:file,expectedSha256:config.authoritative_import.expected_sha256,expectedBytes:config.authoritative_import.expected_size_bytes});
 assert.equal(status.sha256,result.sha256);
 assert.equal(statSync(file).size,1528024);
 assert.equal(existsSync(path.join(dist,"_worker.js")),false);
 assert.equal(existsSync(path.join(dist,"functions")),false);
 assert.match(readFileSync(path.join(dist,"_headers"),"utf8"),/X-Frame-Options: DENY/);
});
