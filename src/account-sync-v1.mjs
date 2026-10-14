// Shared account sync contract for Orbit Virtual Life and Orbit City.
// Protocol only: no endpoint, token, Cloudflare binding or network I/O in this build.
export const ACCOUNT_SYNC_SCHEMA='orbit-account-sync-v1';
export const GAME_IDS=Object.freeze(['virtual-life','orbit-city']);
export const ACCOUNT_SYNC_LIMITS=Object.freeze({manifestBytes:1024,deltaBytes:24*1024,checkpointBytes:192*1024,maxBatchActions:64,previousCheckpoints:1});
const enc=new TextEncoder();
const clean=(v,max)=>{if(typeof v!=='string')throw Error('STRING');const s=v.trim();if(!s||s.length>max)throw Error('BOUNDS');return s};
const int=(v,min,max)=>Number.isSafeInteger(v)&&v>=min&&v<=max;
export function makeAccountManifest({accountId,gameId,revision,digest,encodedBytes=0,updatedAt=0}={}){
 const account=clean(accountId,96),game=clean(gameId,32);if(!GAME_IDS.includes(game)||!int(revision,0,2_000_000_000)||!/^[a-f0-9]{16,64}$/i.test(String(digest||''))||!int(encodedBytes,0,ACCOUNT_SYNC_LIMITS.checkpointBytes)||!Number.isFinite(updatedAt))throw Error('MANIFEST');
 const out={schema:ACCOUNT_SYNC_SCHEMA,accountId:account,gameId:game,revision,digest:String(digest).toLowerCase(),encodedBytes,updatedAt};
 if(enc.encode(JSON.stringify(out)).byteLength>ACCOUNT_SYNC_LIMITS.manifestBytes)throw Error('MANIFEST_TOO_LARGE');return out;
}
export function makeAccountDelta({accountId,gameId,baseRevision,clientNonce,actions}={}){
 const account=clean(accountId,96),game=clean(gameId,32),nonce=clean(clientNonce,128);if(!GAME_IDS.includes(game)||!int(baseRevision,0,2_000_000_000)||!Array.isArray(actions)||actions.length<1||actions.length>ACCOUNT_SYNC_LIMITS.maxBatchActions)throw Error('DELTA');
 const out={schema:ACCOUNT_SYNC_SCHEMA,accountId:account,gameId:game,baseRevision,clientNonce:nonce,actions};const n=enc.encode(JSON.stringify(out)).byteLength;if(n>ACCOUNT_SYNC_LIMITS.deltaBytes)throw Error('DELTA_TOO_LARGE');return {...out,bytes:n};
}
export function syncDecision({localRevision=0,serverRevision=0,localDigest='',serverDigest='',dirtyActions=0,dirtyBytes=0,manual=false}={}){
 if(serverRevision>localRevision)return {mode:'pull-checkpoint',reason:'SERVER_NEWER'};
 if(serverRevision===localRevision&&localDigest&&serverDigest&&localDigest!==serverDigest)return {mode:'pull-checkpoint',reason:'DIGEST_MISMATCH'};
 if(manual)return {mode:'checkpoint',reason:'MANUAL'};
 if(dirtyActions<=0)return {mode:'manifest-only',reason:'CLEAN'};
 if(dirtyActions>ACCOUNT_SYNC_LIMITS.maxBatchActions||dirtyBytes>ACCOUNT_SYNC_LIMITS.deltaBytes)return {mode:'checkpoint',reason:'DELTA_LIMIT'};
 return {mode:'delta',reason:'SMALL_AUTHORITATIVE_MUTATIONS'};
}
export function protocolSeparation(){return {sameCloudflareAccount:true,identityIssuer:'shared-temp-mail-account',databases:{'virtual-life':'orbit-life-world','orbit-city':'orbit-city-world'},oneTimeTransferPrefixes:{'virtual-life':'life-transfer/','orbit-city':'city-transfer/'},networkEnabled:false,note:'Games share identity and protocol shape, not tables or wallet authority.'};}
