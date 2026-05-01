// Authentication utilities for retreat-manager with enhanced security

import type { AdminAuth, AttendeeAuth } from './types.js';

// Constants
const PBKDF2_ITERATIONS = 100000; // OWASP recommended minimum
const SALT_LENGTH = 16; // 128 bits
const HASH_LENGTH = 32; // 256 bits
const TOKEN_EXPIRY_MS = 8 * 60 * 60 * 1000; // 8 hours
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_LOGIN_ATTEMPTS = 5;

// No default secret — auth fails closed if JWT_SECRET / ADMIN_JWT_SECRET are
// not set in the Cloudflare Pages environment. Hardcoded fallbacks would let
// anyone with repo access mint admin tokens.
function requireSecret(secret: string | undefined): string {
  if (!secret || secret.length < 32) {
    throw new Error(
      'Auth secret missing or too short — set JWT_SECRET (>=32 chars) in Cloudflare Pages env vars'
    );
  }
  return secret;
}

/**
 * Convert ArrayBuffer or Uint8Array to hex string
 */
function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert hex string to Uint8Array
 */
function hexToBuffer(hex: string): Uint8Array {
  const matches = hex.match(/.{1,2}/g);
  if (!matches) return new Uint8Array(0);
  return new Uint8Array(matches.map(byte => parseInt(byte, 16)));
}

/**
 * Generate cryptographically secure random bytes
 */
function generateRandomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

/**
 * Hash password using PBKDF2-SHA256 with random salt
 * Format: $pbkdf2$iterations$salt$hash
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = generateRandomBytes(SALT_LENGTH);
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits']
  );

  // Derive key using PBKDF2
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    HASH_LENGTH * 8
  );

  const saltHex = bufferToHex(salt);
  const hashHex = bufferToHex(derivedBits);

  return `$pbkdf2$${PBKDF2_ITERATIONS}$${saltHex}$${hashHex}`;
}

/**
 * Verify a password against a stored PBKDF2 hash.
 *
 * The legacy `$retreat$` (SHA256 + global static salt) branch was retired on
 * 2026-05-01 after a prod audit confirmed zero remaining legacy hashes (lazy
 * upgrade-on-login had migrated the entire base over time, and migration 014
 * found nothing to flag). If a `$retreat$` hash ever reappears via a future
 * data import, this function will return false and the user will need to be
 * reset by an admin via `must_reset_password`.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (!storedHash.startsWith('$pbkdf2$')) return false;

  const parts = storedHash.split('$');
  if (parts.length !== 5) return false;

  const iterations = parseInt(parts[2]);
  const salt = hexToBuffer(parts[3]);
  const storedHashBytes = parts[4];

  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: iterations,
      hash: 'SHA-256'
    },
    keyMaterial,
    HASH_LENGTH * 8
  );

  const computedHash = bufferToHex(derivedBits);

  // Constant-time comparison to prevent timing attacks
  return timingSafeEqual(computedHash, storedHashBytes);
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Create HMAC-signed token. Default expiry is the session window
 * (TOKEN_EXPIRY_MS); pass `ttlMs` to override (e.g. long-lived tokens for
 * email-link flows).
 */
async function createSignedToken(
  payload: Record<string, unknown>,
  secret: string,
  ttlMs: number = TOKEN_EXPIRY_MS,
): Promise<string> {
  const encoder = new TextEncoder();

  // Create payload with expiry
  const tokenPayload = {
    ...payload,
    iat: Date.now(),
    exp: Date.now() + ttlMs
  };

  const payloadStr = JSON.stringify(tokenPayload);
  const payloadBase64 = btoa(payloadStr);

  // Create HMAC signature
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(payloadBase64)
  );

  const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)));

  // Return token as payload.signature (URL-safe base64)
  return `${payloadBase64}.${signatureBase64}`.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Verify and decode HMAC-signed token
 */
async function verifySignedToken<T extends Record<string, unknown>>(
  token: string,
  secret: string
): Promise<T | null> {
  try {
    // Restore base64 padding
    const normalizedToken = token.replace(/-/g, '+').replace(/_/g, '/');
    const parts = normalizedToken.split('.');

    if (parts.length !== 2) return null;

    const [payloadBase64, signatureBase64] = parts;

    // Verify signature
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    // Pad base64 if needed
    const paddedSignature = signatureBase64 + '='.repeat((4 - signatureBase64.length % 4) % 4);
    const signatureBytes = Uint8Array.from(atob(paddedSignature), c => c.charCodeAt(0));

    const paddedPayload = payloadBase64 + '='.repeat((4 - payloadBase64.length % 4) % 4);

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes,
      encoder.encode(paddedPayload)
    );

    if (!isValid) return null;

    // Decode payload
    const payloadStr = atob(paddedPayload);
    const payload = JSON.parse(payloadStr) as T & { exp: number };

    // Check expiry
    if (payload.exp && Date.now() > payload.exp) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Generate admin token
 */
export async function generateAdminToken(user: string, role: string = 'admin', secret?: string): Promise<string> {
  return createSignedToken({ type: 'admin', user, role }, requireSecret(secret));
}

/**
 * Generate attendee token
 */
export async function generateAttendeeToken(ref: string, secret?: string): Promise<string> {
  return createSignedToken({ type: 'attendee', ref }, requireSecret(secret));
}

/**
 * Check admin authorization from request
 */
export async function checkAdminAuth(request: Request, secret?: string): Promise<AdminAuth | null> {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.replace('Bearer ', '');

  if (!token) return null;

  const payload = await verifySignedToken<{ type: string; user: string; role: string }>(
    token,
    requireSecret(secret)
  );

  if (!payload || payload.type !== 'admin') return null;

  return { user: payload.user, role: payload.role };
}

// 30-day expiry for tokens that authenticate the public allergy form via
// email link. Long enough that legitimate recipients can come back to it but
// short enough to limit the window if a hash leaks.
const ALLERGY_FORM_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export async function generateAllergyFormToken(attendeeId: number, secret?: string): Promise<string> {
  return createSignedToken(
    { type: 'allergy_form', attendee_id: attendeeId },
    requireSecret(secret),
    ALLERGY_FORM_TTL_MS,
  );
}

export async function verifyAllergyFormToken(token: string, secret?: string): Promise<{ attendee_id: number } | null> {
  const payload = await verifySignedToken<{ type: string; attendee_id: number }>(
    token,
    requireSecret(secret),
  );
  if (!payload || payload.type !== 'allergy_form') return null;
  if (typeof payload.attendee_id !== 'number') return null;
  return { attendee_id: payload.attendee_id };
}

/**
 * Check attendee authorization from request
 */
export async function checkAttendeeAuth(request: Request, secret?: string): Promise<AttendeeAuth | null> {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.replace('Bearer ', '');

  if (!token) return null;

  const payload = await verifySignedToken<{ type: string; ref: string }>(
    token,
    requireSecret(secret)
  );

  if (!payload || payload.type !== 'attendee') return null;

  return { ref: payload.ref };
}

// Per-IP cap is intentionally higher than per-identifier so a shared NAT
// (office, school) doesn't block a legitimate user when one teammate fails.
const MAX_LOGIN_ATTEMPTS_PER_IP = 20;

/**
 * Rate limiting — check if login is allowed.
 *
 * Checks two independent caps in the same window:
 *   * per-identifier (5 failures) — slows credential-stuffing on one account
 *   * per-IP (20 failures)        — slows password-spraying across accounts
 *
 * Fails CLOSED on DB error: a broken `login_attempts` table must not become
 * a rate-limit bypass. Operators see the error in logs and can repair.
 */
export async function checkRateLimit(
  db: D1Database,
  identifier: string,
  userType: 'admin' | 'attendee',
  ipAddress?: string | null
): Promise<{ allowed: boolean; remainingAttempts: number; resetTime: number; reason?: string }> {
  const windowStart = Date.now() - RATE_LIMIT_WINDOW_MS;
  const resetTime = Date.now() + RATE_LIMIT_WINDOW_MS;

  try {
    const { results: idRows } = await db.prepare(`
      SELECT COUNT(*) as count FROM login_attempts
      WHERE identifier = ? AND user_type = ? AND attempt_time > ? AND success = 0
    `).bind(identifier, userType, windowStart).all();

    const idFails = (idRows[0] as unknown as { count: number }).count;

    let ipFails = 0;
    if (ipAddress) {
      const { results: ipRows } = await db.prepare(`
        SELECT COUNT(*) as count FROM login_attempts
        WHERE ip_address = ? AND attempt_time > ? AND success = 0
      `).bind(ipAddress, windowStart).all();
      ipFails = (ipRows[0] as unknown as { count: number }).count;
    }

    if (idFails >= MAX_LOGIN_ATTEMPTS) {
      return { allowed: false, remainingAttempts: 0, resetTime, reason: 'identifier' };
    }
    if (ipFails >= MAX_LOGIN_ATTEMPTS_PER_IP) {
      return { allowed: false, remainingAttempts: 0, resetTime, reason: 'ip' };
    }

    return {
      allowed: true,
      remainingAttempts: Math.max(0, MAX_LOGIN_ATTEMPTS - idFails),
      resetTime
    };
  } catch (err) {
    console.error('[rate-limit] check failed; failing closed', err);
    return { allowed: false, remainingAttempts: 0, resetTime, reason: 'error' };
  }
}

/**
 * Record login attempt for rate limiting
 */
export async function recordLoginAttempt(
  db: D1Database,
  identifier: string,
  userType: 'admin' | 'attendee',
  success: boolean,
  ipAddress?: string
): Promise<void> {
  try {
    await db.prepare(`
      INSERT INTO login_attempts (identifier, user_type, success, ip_address, attempt_time)
      VALUES (?, ?, ?, ?, ?)
    `).bind(identifier, userType, success ? 1 : 0, ipAddress || null, Date.now()).run();

    // Clean up old attempts (older than 24 hours)
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    await db.prepare(`
      DELETE FROM login_attempts WHERE attempt_time < ?
    `).bind(dayAgo).run();
  } catch {
    // Silently fail if table doesn't exist
  }
}

/**
 * Clear rate limit for successful login
 */
export async function clearRateLimit(
  db: D1Database,
  identifier: string,
  userType: 'admin' | 'attendee'
): Promise<void> {
  try {
    await db.prepare(`
      DELETE FROM login_attempts
      WHERE identifier = ? AND user_type = ? AND success = 0
    `).bind(identifier, userType).run();
  } catch {
    // Silently fail if table doesn't exist
  }
}

/**
 * Pick the CORS allow-origin to echo for this response.
 *
 * If `ALLOWED_ORIGINS` is set in the env (comma-separated list) and the
 * request's `Origin` matches, we echo that origin (locking access to the
 * known portal domain). Otherwise we fall through to `*` so the API stays
 * accessible to same-origin browsers and tools — the auth header is bearer
 * token, not cookies, so `*` is not a credential-leak vector by itself.
 *
 * Pass `null` for `request` (e.g. webhook responses) to skip the lookup.
 */
function pickCorsOrigin(request: Request | null, allowedOrigins?: string): string {
  if (!request || !allowedOrigins) return '*';
  const origin = request.headers.get('Origin');
  if (!origin) return '*';
  const allowed = allowedOrigins.split(',').map(o => o.trim()).filter(Boolean);
  return allowed.includes(origin) ? origin : (allowed[0] || '*');
}

/**
 * Create standardized JSON response with CORS headers
 */
export function createResponse<T>(data: T, status: number = 200, request?: Request, allowedOrigins?: string): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': pickCorsOrigin(request ?? null, allowedOrigins),
      'Vary': 'Origin',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Cache-Control': 'no-cache'
    }
  });
}

/**
 * Handle CORS preflight requests
 */
export function handleCORS(request?: Request, allowedOrigins?: string): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': pickCorsOrigin(request ?? null, allowedOrigins),
      'Vary': 'Origin',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}

