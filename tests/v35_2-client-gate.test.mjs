import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,writeFileSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import path from "node:path";
import {sha256,verifyExactFile} from "../scripts/verify-v35_2-client.mjs";

test("exact-byte verifier accepts a matching fixture",()=>{
  const dir=mkdtempSync(path.join(tmpdir(),"orbit-vl-gate-"));
  try{
    const file=path.join(dir,"fixture.bin");
    const data=Buffer.from("abc","utf8");writeFileSync(file,data);
    assert.deepEqual(verifyExactFile({filePath:file,expectedSha256:sha256(data),expectedBytes:3}),{ok:true,bytes:3,sha256:sha256(data)});
  }finally{rmSync(dir,{recursive:true,force:true});}
});

test("exact-byte verifier rejects missing, size mismatch and hash mismatch",()=>{
  const dir=mkdtempSync(path.join(tmpdir(),"orbit-vl-gate-"));
  try{
    const file=path.join(dir,"fixture.bin");writeFileSync(file,Buffer.from("abc"));
    assert.throws(()=>verifyExactFile({filePath:path.join(dir,"missing"),expectedSha256:"0".repeat(64)}),/CLIENT_FILE_MISSING/);
    assert.throws(()=>verifyExactFile({filePath:file,expectedSha256:sha256(Buffer.from("abc")),expectedBytes:4}),/CLIENT_BYTE_SIZE_MISMATCH/);
    assert.throws(()=>verifyExactFile({filePath:file,expectedSha256:"0".repeat(64)}),/CLIENT_SHA256_MISMATCH/);
  }finally{rmSync(dir,{recursive:true,force:true});}
});
