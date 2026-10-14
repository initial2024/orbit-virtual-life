// Shared account-sync contract for Orbit Virtual Life and Orbit City.
// Transport-agnostic: this module performs no network requests.
export const ORBIT_ACCOUNT_SYNC_SCHEMA='orbit-account-sync-v1';
export const ORBIT_GAMES=Object.freeze(['virtual-life','city-sim']);
export const ORBIT_SYNC_LIMITS=Object.freeze({manifestBytes:1024,actionBytes:24*1024,checkpointBytes:192*1024,requestIdMax:80});
const enc=new TextEncoder();
const isInt=(v,a=0,b=2_000_000_000)=>Number.isSafeInteger(v)&&v>=a&&v<=b;
const clean=(v,max=128)=>{if(typeof v!=='string')throw Error('STRING_REQUIRED');const s=v.trim();if(!s||s.length>max)throw Error('STRING_BOUNDS');return s};
const byteLen=v=>enc.encode(JSON.stringify(v)).byteLength;
function game(v){if(!ORBIT_GAMES.includes(v))throw Error('GAME_NAMESPACE');return v}
export function makeAccountManifest({game:gameId,revision,digest,encodedBytes,updatedAt}={}){
 const out={schema:ORBIT_ACCOUNT_SYNC_SCHEMA,kind:'manifest',game:game(gameId),revision:Number(revision),digest:clean(digest,64),encodedBytes:Number(encodedBytes),updatedAt:Number(updatedAt)};
 if(!isInt(out.revision)||!/^[a-f0-9]{16,64}$/i.test(out.digest)||!isInt(out.encodedBytes,0,ORBIT_SYNC_LIMITS.checkpointBytes)||!Number.isFinite(out.updatedAt))throw Error('MANIFEST');
 if(byteLen(out)>ORBIT_SYNC_LIMITS.manifestBytes)throw Error('MANIFEST_TOO_LARGE');return Object.freeze(out);
}
export function makeAccountAction({game:gameId,accountId,requestId,expectedRevision,action,body}={}){
 const out={schema:ORBIT_ACCOUNT_SYNC_SCHEMA,kind:'action',game:game(gameId),accountId:clean(accountId,96),requestId:clean(requestId,ORBIT_SYNC_LIMITS.requestIdMax),expectedRevision:Number(expectedRevision),action:clean(action,64),body:body&&typeof body==='object'&&!Array.isArray(body)?body:null};
 if(!isInt(out.expectedRevision)||!out.body)throw Error('ACTION');const bytes=byteLen(out);if(bytes>ORBIT_SYNC_LIMITS.actionBytes)throw Error('ACTION_TOO_LARGE');return Object.freeze({...out,bytes});
}
export function makeCheckpointMeta({game:gameId,accountId,revision,digest,encodedBytes}={}){
 const out={schema:ORBIT_ACCOUNT_SYNC_SCHEMA,kind:'checkpoint',game:game(gameId),accountId:clean(accountId,96),revision:Number(revision),digest:clean(digest,64),encodedBytes:Number(encodedBytes)};
 if(!isInt(out.revision)||!/^[a-f0-9]{16,64}$/i.test(out.digest)||!isInt(out.encodedBytes,0,ORBIT_SYNC_LIMITS.checkpointBytes))throw Error('CHECKPOINT');return Object.freeze(out);
}
export function shouldPullCheckpoint(local,remote){if(!remote)return false;if(!local)return true;if(remote.revision>local.revision)return true;return remote.revision===local.revision&&remote.digest!==local.digest;}
export function namespacePlan(){return Object.freeze({account:'shared-temp-mail-identity',cloudflareAccount:'shared',databases:{'virtual-life':'separate-d1','city-sim':'separate-d1'},objectStorage:'optional-shared-r2-with-prefixes',notice:'Same Cloudflare account and identity, separate authoritative databases and namespaces.'});}
