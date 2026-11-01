import {readFileSync} from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const config=JSON.parse(readFileSync(path.join(root,"config/v35_2-client-gate.json"),"utf8"));
const expected=config.deployment_target.cloudflare_account_id;
const actual=String(process.env.CLOUDFLARE_ACCOUNT_ID||"");
if(actual!==expected){
  console.error("BLOCKED_WRONG_CLOUDFLARE_ACCOUNT");
  process.exit(2);
}
console.log("DEPLOY_TARGET_ACCOUNT_PASS");
