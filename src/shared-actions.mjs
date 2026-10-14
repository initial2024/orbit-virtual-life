const enc=new TextEncoder();
const RULES=Object.freeze({
 COMMENT_CREATE:{max:1400,fields:["scopeType","scopeId","body"]},
 REVIEW_CREATE:{max:1800,fields:["targetType","targetId","orderId","rating","body"]},
 REACTION_SET:{max:600,fields:["targetType","targetId","reaction"]},
 COMPANY_CREATE:{max:1200,fields:["companyId","name","region","industry","capital"]},
 COMPANY_UPDATE:{max:1400,fields:["companyId","field","value"]},
 COMPANY_JOB_POST:{max:1200,fields:["companyId","jobId","role","weeklyWage","slots","expiresWeek"]},
 COMPANY_JOB_APPLY:{max:1200,fields:["companyId","jobId","skill","message"]},
 COMPANY_JOB_DECIDE:{max:800,fields:["companyId","jobId","accountId","decision"]},
 COMPANY_NPC_HIRE:{max:800,fields:["companyId","role","grade","count"]},
 COMPANY_NPC_FIRE:{max:800,fields:["companyId","role","grade","count"]},
 MARKET_ORDER:{max:1200,fields:["region","sku","side","quantity","limitPrice","currency"]},
 PLAYER_TRADE:{max:1600,fields:["listingId","assetType","assetId","price","currency"]}
});
const plain=v=>v===null||["string","number","boolean"].includes(typeof v);
export function narrowPayload(type,payload){
 const rule=RULES[type];if(!rule||!payload||typeof payload!=="object"||Array.isArray(payload))throw Error("ACTION_PAYLOAD_INVALID");
 const keys=Object.keys(payload);if(keys.some(k=>!rule.fields.includes(k)))throw Error("ACTION_FIELD_NOT_ALLOWED");
 const out={};for(const k of rule.fields)if(k in payload){const v=payload[k];if(!plain(v))throw Error("ACTION_VALUE_COMPLEX");out[k]=v;}
 if(enc.encode(JSON.stringify(out)).byteLength>rule.max)throw Error("ACTION_PAYLOAD_TOO_LARGE");
 return out;
}
export function allowedActionTypes(){return Object.keys(RULES);}
export const ACTION_RULES=RULES;
