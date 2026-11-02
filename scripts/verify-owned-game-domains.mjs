import assert from "node:assert/strict";
import {createHash} from "node:crypto";
const sites={
  life:"https://life.cfvpn2095.cc.cd",
  city:"https://city.feiling.ccwu.cc",
};
async function get(url,options={}){
  let error;
  for(let attempt=0;attempt<8;attempt++){
    try{
      const response=await fetch(url,{redirect:"error",signal:AbortSignal.timeout(12000),...options});
      return response;
    }catch(e){error=e;if(attempt!==7)await new Promise(resolve=>setTimeout(resolve,6000));}
  }
  throw Error("GAME_PUBLIC_NETWORK_UNAVAILABLE: "+url+": "+String(error));
}
const lifeHealth=await get(sites.life+"/_health");
assert.equal(lifeHealth.status,200,"Life custom domain health must be HTTPS 200");
const json=await lifeHealth.json();
assert.equal(json.app,"orbit-virtual-life");
assert.equal(json.version,"V35.2");
assert.equal(json.mode,"offline-only");
assert.equal(json.cloud_save,false);
const life=await get(sites.life+"/");
assert.equal(life.status,200,"Life custom domain must serve real HTML");
assert.match(life.headers.get("content-type")||"",/text\/html/);
assert.equal(life.headers.get("x-orbit-life-mode"),"exact-v35.2-offline");
const bytes=Buffer.from(await life.arrayBuffer());
assert.equal(bytes.length,1528024,"Life exact original HTML byte count");
const hash=createHash("sha256").update(bytes).digest("hex");
assert.equal(hash,"b53f7146eee9a8f27842a9f65c043777a6216dd9d227690a29a714dde21e08af","Life exact source identity");
assert.match(bytes.toString("utf8"),/<!DOCTYPE html>/i);
const city=await get(sites.city+"/");
assert.equal(city.status,200,"City custom domain must serve actual QA UI");
assert.equal(city.headers.get("x-orbit-game-mode"),"city-isolated-qa");
const cityHtml=await city.text();
assert.match(cityHtml,/<html/i);
const js=await get(sites.city+"/src/app.js");
assert.equal(js.status,200,"City must serve real game JS");
const code=await js.text();
assert.ok(code.length>2000,"City JS must not be an error page");
const blocked=await get(sites.city+"/api/auth/exchange",{method:"POST",headers:{"content-type":"application/json"},body:'{"ticket":"synthetic"}'});
assert.equal(blocked.status,503,"City account binding must remain disabled");
assert.equal((await blocked.json()).error,"CLOUD_SAVE_NOT_CONFIGURED");
console.log(JSON.stringify({status:"PASS",city:{origin:sites.city,game_js_bytes:code.length,cloud_binding:"disabled"},life:{origin:sites.life,sha256:hash,bytes:bytes.length,mode:"offline-only"}}));
