import assert from 'node:assert/strict';
import test from 'node:test';
import {verifyVirtualLifeTicket,consumeVirtualLifeTicket} from '../src/identity-ticket.mjs';
const pair=await crypto.subtle.generateKey('Ed25519',true,['sign','verify']);
const publicJwk=await crypto.subtle.exportKey('jwk',pair.publicKey);
const env={ORBIT_ISSUER:'orbit-test-issuer',ORBIT_AUDIENCE_VIRTUAL_LIFE:'orbit-virtual-life',ORBIT_ED25519_PUBLIC_JWK:JSON.stringify(publicJwk)};
const b64=s=>Buffer.from(s).toString('base64url');
async function ticket(overrides={},header={alg:'EdDSA',typ:'JWT'}) {
 const now=Math.floor(Date.now()/1000);
 const claims={iss:env.ORBIT_ISSUER,aud:env.ORBIT_AUDIENCE_VIRTUAL_LIFE,app_id:'virtual-life',sub:'player-test-001',purpose:'game_login',jti:crypto.randomUUID(),iat:now,nbf:now,exp:now+90,...overrides};
 const part=b64(JSON.stringify(header))+'.'+b64(JSON.stringify(claims));
 return part+'.'+b64(await crypto.subtle.sign('Ed25519',pair.privateKey,Buffer.from(part)));
}
test('valid life login and account deprovision require different purposes',async()=>{
 assert.equal((await verifyVirtualLifeTicket(await ticket(),env)).app_id,'virtual-life');
 const raw=await ticket({purpose:'account_deprovision'});
 await assert.rejects(verifyVirtualLifeTicket(raw,env));
 assert.equal((await verifyVirtualLifeTicket(raw,env,'account_deprovision')).purpose,'account_deprovision');
});
for(const [name,override] of Object.entries({city:{app_id:'city-sim'},missingApp:{app_id:undefined},legacyAudience:{aud:'orbit-city-sim'},wrongIssuer:{iss:'untrusted'},admin:{sub:'admin:1'},adminPurpose:{purpose:'game_admin'},missingNonce:{jti:undefined},missingNbf:{nbf:undefined},expired:{exp:1},future:{iat:9999999999,nbf:9999999999,exp:9999999999},longLifetime:{exp:Math.floor(Date.now()/1000)+600}})) {
 test('reject signed '+name+' ticket',async()=>{await assert.rejects(verifyVirtualLifeTicket(await ticket(override),env));});
}
test('reject signature tampering, private keys, legacy config and unsupported JOSE headers',async()=>{
 const raw=await ticket();const pieces=raw.split('.');pieces[1]=b64(JSON.stringify({app_id:'virtual-life'}));
 await assert.rejects(verifyVirtualLifeTicket(pieces.join('.'),env));
 await assert.rejects(verifyVirtualLifeTicket(raw,{...env,ORBIT_ED25519_PUBLIC_JWK:JSON.stringify(await crypto.subtle.exportKey('jwk',pair.privateKey))}));
 await assert.rejects(verifyVirtualLifeTicket(raw,{...env,ORBIT_AUDIENCE_VIRTUAL_LIFE:undefined,ORBIT_AUDIENCE:'orbit-virtual-life'}));
 await assert.rejects(verifyVirtualLifeTicket(await ticket({}, {alg:'EdDSA',typ:'JWT',crit:['unknown']}),env));
 await assert.rejects(verifyVirtualLifeTicket(raw,env,'game_admin'));
});
test('cloud defaults off and never falls back to City GAME_DB',async()=>{
 const raw=await ticket();let touched=false;const db={prepare(){touched=true;throw Error('unexpected')}};
 await assert.rejects(consumeVirtualLifeTicket(raw,{...env,LIFE_DB:db}),/LIFE_CLOUD_NOT_CONFIGURED/);
 await assert.rejects(consumeVirtualLifeTicket(raw,{...env,GAME_CLOUD_BIND_ENABLED:'true',GAME_DB:db}),/LIFE_CLOUD_NOT_CONFIGURED/);
 assert.equal(touched,false);
});
test('wrong-app rejection precedes storage and concurrent nonce consumption succeeds once',async()=>{
 const seen=new Set();let writes=0;
 const LIFE_DB={prepare(sql){assert.match(sql,/INSERT OR IGNORE INTO life_identity_tickets/);return {bind(...args){return {async run(){writes++;const changes=seen.has(args[0])?0:1;seen.add(args[0]);return {meta:{changes}}}}}}}};
 const cfg={...env,LIFE_DB,GAME_CLOUD_BIND_ENABLED:'true'};
 await assert.rejects(consumeVirtualLifeTicket(await ticket({app_id:'city-sim'}),cfg));assert.equal(writes,0);
 const raw=await ticket();const results=await Promise.allSettled(Array.from({length:32},()=>consumeVirtualLifeTicket(raw,cfg)));
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
 assert.equal(results.filter(r=>r.status==='rejected'&&r.reason.message==='IDENTITY_REPLAY').length,31);
});
