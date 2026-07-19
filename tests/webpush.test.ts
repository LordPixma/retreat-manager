import { describe, it, expect } from 'vitest';
import { vapidAuthHeader, b64urlToBytes, bytesToB64url } from '../functions/_shared/webpush.js';

describe('webpush VAPID signing', () => {
  it('produces a JWT that verifies against the VAPID public key', async () => {
    // A real VAPID keypair: public = 65-byte raw EC point, private = jwk.d.
    const kp = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
    const rawPub = new Uint8Array(await crypto.subtle.exportKey('raw', kp.publicKey));
    const jwk = await crypto.subtle.exportKey('jwk', kp.privateKey);

    const env = {
      VAPID_PUBLIC_KEY: bytesToB64url(rawPub),
      VAPID_PRIVATE_KEY: jwk.d,
      VAPID_SUBJECT: 'mailto:test@example.com',
    };

    const header = await vapidAuthHeader('https://fcm.googleapis.com/fcm/send/abc123', env);
    const m = header.match(/^vapid t=([^,]+), k=(.+)$/);
    expect(m).toBeTruthy();
    expect(m![2]).toBe(env.VAPID_PUBLIC_KEY);

    const [h, p, s] = m![1].split('.');
    const verifyKey = await crypto.subtle.importKey('raw', rawPub, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
    const ok = await crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      verifyKey,
      b64urlToBytes(s),
      new TextEncoder().encode(`${h}.${p}`)
    );
    expect(ok).toBe(true);

    const payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(p)));
    expect(payload.aud).toBe('https://fcm.googleapis.com');
    expect(payload.sub).toBe('mailto:test@example.com');
    expect(payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it('round-trips base64url', () => {
    const bytes = new Uint8Array([0, 1, 2, 250, 251, 252, 253, 254, 255]);
    expect(Array.from(b64urlToBytes(bytesToB64url(bytes)))).toEqual(Array.from(bytes));
  });
});
