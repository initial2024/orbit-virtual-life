const enc=new TextEncoder();
export const ACTION_RULES=Object.freeze({
 COMMENT_CREATE:{keys:['scopeType','scopeId','body'],maxBytes:1600},
 REVIEW_CREATE:{keys:['targetType','targetId','orderId','rating','body'],maxBytes:1800},
 REACTION_SET:{keys:['targetType','targetId','reaction'],maxBytes:512},
 COMPANY_CREATE:{keys:['companyId','name','region','industry','capitalMinor'],maxBytes:1400},
 COMPANY_UPDATE:{keys:['companyId','name','marketingMinor','policy'],maxBytes:1400},
 COMPANY_JOB_POST:{keys:['companyId','jobId','role','weeklyWageMinor','slots','expiresAt'],maxBytes:1200},
 COMPANY_JOB_APPLY:{keys:['jobId','skill','message'],maxBytes:1200},
 COMPANY_JOB_DECIDE:{keys:['companyId','jobId','accountId','decision'],maxBytes:900},
 COMPANY_NPC_HIRE:{keys:['companyId','role','grade','count'],maxBytes:700},
 COMPANY_NPC_FIRE:{keys:['companyId','role','grade','count'],maxBytes:700},
 MARKET_ORDER:{keys:['region','sku','variant','side','quantity','limitPriceMinor'],maxBytes:900},
 PLAYER_TRADE:{keys:['listingId','quantity'],maxBytes:600}
});
const scalar=v=>v===null||['string','number','boolean'].includes(typeof v);
export function narrowPayload(type,payload={}){
 const rule=ACTION_RULES[type];if(!rule||!payload||typeof payload!=='object'||Array.isArray(payload))throw Error('ACTION_TYPE');
 const keys=Object.keys(payload);if(keys.some(k=>!rule.keys.includes(k)))throw Error('ACTION_EXTRA_FIELD');
 const out={};for(const k of rule.keys)if(payload[k]!==undefined){if(!scalar(payload[k]))throw Error('ACTION_COMPLEX_FIELD');out[k]=payload[k];}
 const bytes=enc.encode(JSON.stringify(out)).byteLength;if(bytes>rule.maxBytes)throw Error('ACTION_TOO_LARGE');return out;
}
