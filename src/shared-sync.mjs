const enc=new TextEncoder();
export const SYNC_SCHEMA="orbit-account-sync-v1";
export const APP_IDS=Object.freeze(["virtual-life","city-sim"]);
export const SYNC_LIMITS=Object.freeze({
 commandBytes:8*1024,batchBytes:24*1024,headBytes:1024,
 checkpointEncodedBytes:192*1024,checkpointRawBytes:512*1024,
 maxBatchActions:32,maxPendingActions:80,checkpointEveryMs:20*60*1000
});
const textBytes=v=>enc.encode(JSON.stringify(v)).byteLength;
const id=(v,min=8,max=128)=>typeof v==="string"&&v.length>=min&&v.length<=max&&/^[A-Za-z0-9:_-]+$/.test(v);
export function makeCommand({appId,accountId,deviceId,requestId,expectedRevision,type,payload}={}){
 if(!APP_IDS.includes(appId)||!id(accountId,5)||!id(deviceId,8)||!id(requestId,16,80)||!Number.isSafeInteger(expectedRevision)||expectedRevision<0||!id(type,3,64))throw Error("COMMAND_INVALID");
 const out={schema:SYNC_SCHEMA,appId,accountId,deviceId,requestId,expectedRevision,type,payload:payload??{}};
 if(textBytes(out)>SYNC_LIMITS.commandBytes)throw Error("COMMAND_TOO_LARGE");return out;
}
export function makeBatch(commands){
 if(!Array.isArray(commands)||!commands.length||commands.length>SYNC_LIMITS.maxBatchActions)throw Error("BATCH_COUNT");
 const first=commands[0];
 if(commands.some(x=>x.schema!==SYNC_SCHEMA||x.appId!==first.appId||x.accountId!==first.accountId||x.deviceId!==first.deviceId))throw Error("BATCH_SCOPE");
 const out={schema:SYNC_SCHEMA,appId:first.appId,accountId:first.accountId,deviceId:first.deviceId,commands};
 if(textBytes(out)>SYNC_LIMITS.batchBytes)throw Error("BATCH_TOO_LARGE");return out;
}
export function makeHead({appId,revision,digest,checkpointRevision=0,updatedAt=0}={}){
 if(!APP_IDS.includes(appId)||!Number.isSafeInteger(revision)||revision<0||!Number.isSafeInteger(checkpointRevision)||checkpointRevision<0||typeof digest!=="string"||!/^[a-f0-9]{16,64}$/i.test(digest)||!Number.isFinite(updatedAt))throw Error("HEAD_INVALID");
 const out={schema:SYNC_SCHEMA,appId,revision,digest,checkpointRevision,updatedAt};
 if(textBytes(out)>SYNC_LIMITS.headBytes)throw Error("HEAD_TOO_LARGE");return out;
}
export function shouldFetchCheckpoint(localHead,serverHead){
 if(!serverHead)return false;if(!localHead)return true;if(serverHead.appId!==localHead.appId)return true;
 if(serverHead.checkpointRevision>localHead.checkpointRevision)return true;
 return serverHead.checkpointRevision===localHead.checkpointRevision&&serverHead.digest!==localHead.digest;
}
export function syncPlan({dirtyActions=0,lastCheckpointAt=0,now=Date.now(),manual=false,pageHide=false,serverAhead=false}={}){
 if(serverAhead)return {mode:"head",reason:"SERVER_AHEAD"};if(manual)return {mode:"checkpoint",reason:"MANUAL"};
 if(dirtyActions<=0)return {mode:"head-only",reason:"CLEAN"};
 if(dirtyActions>=SYNC_LIMITS.maxPendingActions)return {mode:"checkpoint",reason:"ACTION_BOUND"};
 if(now-lastCheckpointAt>=SYNC_LIMITS.checkpointEveryMs)return {mode:"checkpoint",reason:"TIME_BOUND"};
 if(pageHide&&dirtyActions>0)return {mode:"batch",reason:"PAGE_HIDE"};
 return {mode:"batch",reason:"ROW_ACTIONS"};
}
export const SERVER_AUTHORITATIVE=Object.freeze(["wallet","ledger","company","company_member","company_job","company_application","store","inventory","order","review","comment","reaction","market","security_position","property","loan","tax_record","policy_state","policy_event","settlement_head"]);
export const LOCAL_ONLY=Object.freeze(["ui_settings","drafts","catalog_cache","image_cache","offline_sandbox"]);
