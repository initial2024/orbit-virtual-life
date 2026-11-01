// Virtual Life backend boundary. Never import an issuer private key or use City storage.
const encoder = new TextEncoder();
function decode(value) {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw Error('IDENTITY_FORMAT');
  const raw = atob(value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4-value.length%4)%4));
  return Uint8Array.from(raw, c => c.charCodeAt(0));
}
export async function verifyVirtualLifeTicket(raw, env, purpose = 'game_login') {
  if (!['game_login','account_deprovision'].includes(purpose)) throw Error('IDENTITY_PURPOSE');
  if (typeof raw !== 'string' || raw.length > 8192 || raw.split('.').length !== 3) throw Error('IDENTITY_FORMAT');
  const [head, body, signature] = raw.split('.');
  const header = JSON.parse(new TextDecoder().decode(decode(head)));
  const claims = JSON.parse(new TextDecoder().decode(decode(body)));
  if (header?.alg !== 'EdDSA' || header.typ !== 'JWT' || header.crit !== undefined || header.b64 !== undefined || !claims || Array.isArray(claims)) throw Error('IDENTITY_FORMAT');
  if (!env.ORBIT_ISSUER || !env.ORBIT_AUDIENCE_VIRTUAL_LIFE) throw Error('IDENTITY_NOT_CONFIGURED');
  const jwk = JSON.parse(env.ORBIT_ED25519_PUBLIC_JWK);
  if (jwk.kty !== 'OKP' || jwk.crv !== 'Ed25519' || typeof jwk.x !== 'string' || Object.hasOwn(jwk,'d')) throw Error('IDENTITY_PUBLIC_KEY');
  const key = await crypto.subtle.importKey('jwk', jwk, {name:'Ed25519'}, false, ['verify']);
  if (!await crypto.subtle.verify('Ed25519', key, decode(signature), encoder.encode(head+'.'+body))) throw Error('IDENTITY_SIGNATURE');
  const now = Math.floor(Date.now()/1000);
  if (claims.app_id !== 'virtual-life' || claims.iss !== env.ORBIT_ISSUER || claims.aud !== env.ORBIT_AUDIENCE_VIRTUAL_LIFE || claims.purpose !== purpose ||
      typeof claims.sub !== 'string' || !/^[-A-Za-z0-9_:]{5,128}$/.test(claims.sub) || claims.sub.startsWith('admin:') ||
      typeof claims.jti !== 'string' || !/^[-A-Za-z0-9]{12,128}$/.test(claims.jti) ||
      !Number.isInteger(claims.iat) || !Number.isInteger(claims.nbf) || !Number.isInteger(claims.exp) ||
      claims.iat > now+30 || claims.iat < now-120 || claims.nbf > now+10 || claims.nbf < claims.iat ||
      claims.exp <= now || claims.exp <= claims.nbf || claims.exp <= claims.iat || claims.exp-claims.iat > 120) throw Error('IDENTITY_CLAIMS');
  return claims;
}
export async function consumeVirtualLifeTicket(raw, env, purpose = 'game_login') {
  if (env.GAME_CLOUD_BIND_ENABLED !== 'true' || !env.LIFE_DB) throw Error('LIFE_CLOUD_NOT_CONFIGURED');
  const claims = await verifyVirtualLifeTicket(raw, env, purpose);
  // One atomic insert, shared across login/deprovision purposes: nonce reuse is rejected.
  const result = await env.LIFE_DB.prepare('INSERT OR IGNORE INTO life_identity_tickets(jti,app_id,subject_id,purpose,expires_at) VALUES(?,?,?,?,?)')
    .bind(claims.jti,'virtual-life',claims.sub,claims.purpose,claims.exp).run();
  if (Number(result.meta?.changes) !== 1) throw Error('IDENTITY_REPLAY');
  return claims;
}
