import {createHash} from "node:crypto";
import {existsSync,readFileSync} from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const config=JSON.parse(readFileSync(path.join(root,"config/v35_2-client-gate.json"),"utf8"));

export function sha256(buffer){return createHash("sha256").update(buffer).digest("hex");}

export function verifyExactFile({filePath,expectedSha256,expectedBytes=null}){
  if(!existsSync(filePath))throw new Error("CLIENT_FILE_MISSING");
  const bytes=readFileSync(filePath);
  if(Number.isInteger(expectedBytes)&&bytes.length!==expectedBytes)throw new Error("CLIENT_BYTE_SIZE_MISMATCH");
  const digest=sha256(bytes);
  if(digest!==expectedSha256)throw new Error("CLIENT_SHA256_MISMATCH:"+digest);
  return {ok:true,bytes:bytes.length,sha256:digest};
}

if(process.argv[1]===fileURLToPath(import.meta.url)){
  const file=process.argv[2]||path.join(root,"client",config.authoritative_import.file_name);
  const result=verifyExactFile({
    filePath:file,
    expectedSha256:config.authoritative_import.expected_sha256,
    expectedBytes:Number.isInteger(config.authoritative_import.expected_size_bytes)?config.authoritative_import.expected_size_bytes:null
  });
  process.stdout.write(JSON.stringify(result)+"\n");
}
