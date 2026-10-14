import test from "node:test";import assert from "node:assert/strict";
import {makeCommand,makeBatch,makeHead,shouldFetchCheckpoint,syncPlan,SYNC_LIMITS} from "../src/shared-sync.mjs";
const cmd=i=>makeCommand({appId:"virtual-life",accountId:"acct:12345",deviceId:"device:abcdefgh",requestId:"request-"+String(i).padStart(16,"0"),expectedRevision:i,type:"COMPANY_UPDATE",payload:{companyId:"company:1",field:"x"}});
test("row commands and batches stay bounded",()=>{const a=cmd(1);assert.ok(JSON.stringify(a).length<SYNC_LIMITS.commandBytes);const b=makeBatch([cmd(1),cmd(2)]);assert.equal(b.commands.length,2);});
test("head avoids unnecessary checkpoint download",()=>{const h=makeHead({appId:"virtual-life",revision:5,digest:"a".repeat(32),checkpointRevision:4,updatedAt:1});assert.equal(shouldFetchCheckpoint(h,h),false);assert.equal(shouldFetchCheckpoint({...h,checkpointRevision:3},h),true);});
test("dirty actions prefer batch until bounded checkpoint",()=>{assert.equal(syncPlan({dirtyActions:4,lastCheckpointAt:Date.now()-1000}).mode,"batch");assert.equal(syncPlan({dirtyActions:80,lastCheckpointAt:Date.now()-1000}).mode,"checkpoint");});
