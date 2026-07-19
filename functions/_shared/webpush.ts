// Minimal Web Push sender for Cloudflare Workers using Web Crypto.
//
// We send *payload-less* pushes (VAPID auth, empty body). That wakes the
// service worker's `push` event, which shows a generic "new announcement"
// notification and opens the app — no aes128gcm payload encryption needed,
// which keeps this small and reliable. VAPID (RFC 8292) auth is required by
// push services and is implemented here with ES256 (P-256) signing.
//
// Config (set via `wrangler pages secret put` / env vars):
//   VAPID_PUBLIC_KEY   base64url, 65-byte uncompressed EC point (0x04||x||y)
//   VAPID_PRIVATE_KEY  base64url, 32-byte raw private scalar (d)
//   VAPID_SUBJECT      e.g. "mailto:retreat@cloverleafchristiancentre.org"

export interface PushEnvLike {
  VAPID_PUBLIC_KEY?: string;
  VAPID_PRIVATE_KEY?: string;
  VAPID_SUBJECT?: string;
}

export function pushConfigured(env: PushEnvLike): boolean {
  return !!(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY);
}

// ---- base64url ----
export function b64urlToBytes(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function bytesToB64url(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function strToB64url(s: string): string {
  return bytesToB64url(new TextEncoder().encode(s));
}

// Import the VAPID keypair as an ECDSA private key for signing. The private key
// is the 32-byte scalar; x/y come from the 65-byte public point.
async function importVapidKey(publicKeyB64: string, privateKeyB64: string): Promise<CryptoKey> {
  const pub = b64urlToBytes(publicKeyB64); // 0x04 || x(32) || y(32)
  const d = privateKeyB64;
  const x = bytesToB64url(pub.slice(1, 33));
  const y = bytesToB64url(pub.slice(33, 65));
  const jwk: JsonWebKey = { kty: 'EC', crv: 'P-256', d, x, y, ext: true };
  return crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
}

// Build the VAPID Authorization header for a given push endpoint.
export async function vapidAuthHeader(endpoint: string, env: PushEnvLike): Promise<string> {
  const url = new URL(endpoint);
  const aud = `${url.protocol}//${url.host}`;
  const header = { typ: 'JWT', alg: 'ES256' };
  const payload = {
    aud,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
    sub: env.VAPID_SUBJECT || 'mailto:admin@example.com',
  };
  const signingInput = `${strToB64url(JSON.stringify(header))}.${strToB64url(JSON.stringify(payload))}`;

  const key = await importVapidKey(env.VAPID_PUBLIC_KEY!, env.VAPID_PRIVATE_KEY!);
  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    new TextEncoder().encode(signingInput)
  );
  const jwt = `${signingInput}.${bytesToB64url(new Uint8Array(sig))}`;
  return `vapid t=${jwt}, k=${env.VAPID_PUBLIC_KEY}`;
}

export interface SendResult {
  ok: boolean;
  status: number;
  gone: boolean; // 404/410 → subscription expired, delete it
}

// Send a single payload-less push. Never throws — returns a structured result.
export async function sendPush(endpoint: string, env: PushEnvLike): Promise<SendResult> {
  try {
    const auth = await vapidAuthHeader(endpoint, env);
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: auth,
        TTL: '86400',
        Urgency: 'normal',
        'Content-Length': '0',
      },
    });
    return { ok: res.ok, status: res.status, gone: res.status === 404 || res.status === 410 };
  } catch {
    return { ok: false, status: 0, gone: false };
  }
}
