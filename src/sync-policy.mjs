// Stage16 low-bandwidth policy. Pure policy module; no network calls.
export const SYNC_LIMITS=Object.freeze({deltaSoftBytes:12*1024,deltaHardBytes:24*1024,checkpointSoftBytes:96*1024,checkpointHardBytes:192*1024,maxActionsPerBatch:64,maxPendingAgeMs:10*60*1000});
export const IMMEDIATE=new Set(['COMMENT_CREATE','REACTION_SET','REVIEW_CREATE','PLAYER_TRADE','MARKET_ORDER','COMPANY_JOB_POST','COMPANY_JOB_ACCEPT','COMPANY_MEMBER_UPDATE']);
export const BATCHABLE=new Set(['INVENTORY_RESERVE','COMPANY_UPDATE','AD_CAMPAIGN_CREATE','WORLD_SETTLEMENT_ACK']);
export function syncClass(action){if(IMMEDIATE.has(action))return'immediate';if(BATCHABLE.has(action))return'batch';return'checkpoint';}
export function chooseSync({dirtyActions=0,dirtyBytes=0,manual=false,serverNewer=false,digestMismatch=false}={}){if(serverNewer||digestMismatch)return{mode:'pull-checkpoint'};if(manual)return{mode:'checkpoint'};if(dirtyActions<=0)return{mode:'manifest-only'};if(dirtyActions>SYNC_LIMITS.maxActionsPerBatch||dirtyBytes>SYNC_LIMITS.deltaHardBytes)return{mode:'checkpoint'};return{mode:'delta'};}
