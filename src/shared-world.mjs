// Orbit Virtual Life Stage16 shared-world protocol.
// Contract definitions only: no endpoint or upload is configured in this offline build.
import {ORBIT_ACCOUNT_SYNC_SCHEMA,makeAccountAction,namespacePlan} from './account-sync.mjs';
export const SHARED_WORLD_SCHEMA='orbit-shared-world-v2';
export const SERVER_AUTHORITATIVE=Object.freeze([
 'player_profile','wallet','ledger','company','company_member','company_job','store','inventory','order','feedback','market_quote','market_order','property','loan','tax_record','policy_snapshot'
]);
export const LOCAL_ONLY=Object.freeze(['ui_preferences','drafts','cached_catalog','offline_sandbox','local_media_cache','local_recovery_slots']);
export const ACTIONS=Object.freeze({
 COMMENT_CREATE:{entity:'feedback',requiresAccount:true,maxBytes:1400},
 REACTION_SET:{entity:'feedback',requiresAccount:true,maxBytes:256},
 REVIEW_CREATE:{entity:'feedback',requiresAccount:true,maxBytes:1400},
 COMPANY_REGISTER:{entity:'company',requiresAccount:true,maxBytes:1800},
 COMPANY_UPDATE:{entity:'company',requiresAccount:true,maxBytes:1800},
 COMPANY_JOB_POST:{entity:'company_job',requiresAccount:true,maxBytes:1200},
 COMPANY_JOB_APPLY:{entity:'company_job',requiresAccount:true,maxBytes:800},
 COMPANY_JOB_ACCEPT:{entity:'company_member',requiresAccount:true,maxBytes:900},
 COMPANY_MEMBER_LEAVE:{entity:'company_member',requiresAccount:true,maxBytes:600},
 MARKET_ORDER:{entity:'market_order',requiresAccount:true,maxBytes:1800},
 INVENTORY_RESERVE:{entity:'inventory',requiresAccount:true,maxBytes:900},
 SECURITY_ORDER:{entity:'market_order',requiresAccount:true,maxBytes:1600},
 PROPERTY_LISTING:{entity:'property',requiresAccount:true,maxBytes:1600},
 PLAYER_TRADE:{entity:'ledger',requiresAccount:true,maxBytes:1600},
 LOAN_REQUEST:{entity:'loan',requiresAccount:true,maxBytes:1500},
 TAX_SETTLEMENT:{entity:'tax_record',requiresAccount:true,maxBytes:1200},
 WORLD_SETTLEMENT_ACK:{entity:'market_quote',requiresAccount:true,maxBytes:700}
});
function cleanString(v,max=128){if(typeof v!=='string')throw Error('STRING_REQUIRED');const s=v.trim();if(!s||s.length>max)throw Error('STRING_BOUNDS');return s}
function stable(value){if(value===null||typeof value!=='object')return JSON.stringify(value);if(Array.isArray(value))return '['+value.map(stable).join(',')+']';return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+stable(value[k])).join(',')+'}'}
export function bodyBytes(body){return new TextEncoder().encode(stable(body)).byteLength}
export function createMutationEnvelope({accountId,action,expectedVersion=0,clientNonce,body}){
 const rule=ACTIONS[action];if(!rule)throw Error('UNKNOWN_ACTION');const account=cleanString(accountId,96),nonce=cleanString(clientNonce,80);
 if(!Number.isSafeInteger(expectedVersion)||expectedVersion<0||expectedVersion>2_000_000_000)throw Error('VERSION');if(body===null||typeof body!=='object'||Array.isArray(body))throw Error('BODY_OBJECT_REQUIRED');
 const bytes=bodyBytes(body);if(bytes>rule.maxBytes)throw Error('BODY_TOO_LARGE');
 const accountAction=makeAccountAction({game:'virtual-life',accountId:account,requestId:nonce,expectedRevision:expectedVersion,action,body});
 return Object.freeze({schema:SHARED_WORLD_SCHEMA,accountSyncSchema:ORBIT_ACCOUNT_SYNC_SCHEMA,accountId:account,action,entity:rule.entity,expectedVersion,clientNonce:nonce,body,bodyBytes:bytes,transport:'NOT_CONFIGURED',requestBytes:accountAction.bytes});
}
export function validateMutationEnvelope(e){if(!e||e.schema!==SHARED_WORLD_SCHEMA||!ACTIONS[e.action]||ACTIONS[e.action].entity!==e.entity||e.transport!=='NOT_CONFIGURED')return false;try{cleanString(e.accountId,96);cleanString(e.clientNonce,80)}catch{return false}if(!Number.isSafeInteger(e.expectedVersion)||e.expectedVersion<0||!e.body||typeof e.body!=='object'||Array.isArray(e.body))return false;return e.bodyBytes===bodyBytes(e.body)&&e.bodyBytes<=ACTIONS[e.action].maxBytes;}
const LEGACY_SERVER_ALIASES=Object.freeze({review:'feedback',comment:'feedback',reaction:'feedback',market_snapshot:'market_quote'});
export function classifyDataKey(key){const canonical=LEGACY_SERVER_ALIASES[key]||key;if(SERVER_AUTHORITATIVE.includes(canonical))return 'server_authoritative';if(LOCAL_ONLY.includes(canonical))return 'local_only';return 'unclassified'}
export function validateSettlement(entries){if(!Array.isArray(entries)||entries.length<2||entries.length>128)throw Error('ENTRIES');let sum=0;for(const x of entries){if(!x||typeof x.account!=='string'||!x.account||!Number.isFinite(x.amount))throw Error('ENTRY');if(Math.abs(x.amount)>1e12)throw Error('AMOUNT');sum+=x.amount}return {balanced:Math.abs(sum)<1e-8,sum:Number(sum.toFixed(8)),count:entries.length};}
export function minimalFeedbackRow(x={}){const kind=cleanString(x.kind,16);if(!['comment','review','reaction'].includes(kind))throw Error('FEEDBACK_KIND');const row={id:cleanString(x.id,80),kind,targetType:cleanString(x.targetType,24),targetId:cleanString(x.targetId,80),authorId:cleanString(x.authorId,96),createdAt:Number(x.createdAt)};if(!Number.isFinite(row.createdAt))throw Error('TIME');if(kind==='comment'||kind==='review')row.text=cleanString(x.text,500);if(kind==='review'){const r=Number(x.rating);if(!Number.isInteger(r)||r<1||r>5)throw Error('RATING');row.rating=r;if(x.orderId)row.orderId=cleanString(x.orderId,80);}if(kind==='reaction')row.reaction=cleanString(x.reaction,24);return row;}
export function minimalCompanyRow(c={}){return {id:cleanString(c.id||c.name,80),ownerId:cleanString(c.ownerId||'pending-owner',96),region:cleanString(c.region,24),industry:cleanString(c.industry,32),status:cleanString(c.status,24),reputation:Number(c.reputation||0),npcStaff:Number(c.npcStaff||0),playerStaff:Number(c.playerStaff||0),cashMinor:Number(c.cashMinor||0),version:Number(c.version||0)};}
export function minimalMarketOrderRow(o={}){const side=cleanString(o.side,12);if(!['buy','sell','short','cover'].includes(side))throw Error('SIDE');return {id:cleanString(o.id,80),accountId:cleanString(o.accountId,96),symbol:cleanString(o.symbol,32),side,qty:Number(o.qty),limitMinor:o.limitMinor==null?null:Number(o.limitMinor),createdAt:Number(o.createdAt),status:cleanString(o.status||'open',16)};}
export function safePublicCompany(company){if(!company||typeof company!=='object')return null;const w=company.workforce||{};return {name:String(company.name||'').slice(0,80),industry:String(company.industry||'').slice(0,40),status:String(company.status||'').slice(0,24),reputation:Number(company.reputation||0),staff:Number(company.staff||0),npcStaff:Array.isArray(w.npc)?w.npc.length:0,playerStaff:Array.isArray(w.playerMembers)?w.playerMembers.length:0};}
export function protocolSummary(){return {schema:SHARED_WORLD_SCHEMA,accountSyncSchema:ORBIT_ACCOUNT_SYNC_SCHEMA,serverAuthoritative:[...SERVER_AUTHORITATIVE],localOnly:[...LOCAL_ONLY],actions:Object.keys(ACTIONS),networkEnabled:false,namespace:namespacePlan(),notice:'Protocol only. No server endpoint, D1 database, R2 bucket or upload is configured in this build.'};}
