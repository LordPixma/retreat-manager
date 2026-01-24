// Authentication utilities for retreat-manager with enhanced security

import type { AdminAuth, AttendeeAuth } from './types.js';

// Constants
const PBKDF2_ITERATIONS = 100000; // OWASP recommended minimum
const SALT_LENGTH = 16; // 128 bits
const HASH_LENGTH = 32; // 256 bits
const TOKEN_EXPIRY_MS = 2 * 60 * 60 * 1000; // 2 hours
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_LOGIN_ATTEMPTS = 5;

// Default secret for development (should be overridden in production)
const DEFAULT_SECRET = 'dev-secret-change-in-production-abc123';

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
 * Verify password against stored hash
 * Supports both new PBKDF2 format and legacy SHA-256 format for migration
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  // Check if it's the new PBKDF2 format
  if (storedHash.startsWith('$pbkdf2$')) {
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

  // Legacy format support for migration ($retreat$...)
  if (storedHash.startsWith('$retreat$')) {
    const legacyHash = await legacyHashPassword(password);
    return timingSafeEqual(legacyHash, storedHash);
  }

  return false;
}

/**
 * Legacy password hashing for migration support
 */
async function legacyHashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'retreat_portal_salt_2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashHex = bufferToHex(hashBuffer);
  return '$retreat$' + hashHex;
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
 * Create HMAC-signed token
 */
async function createSignedToken(
  payload: Record<string, unknown>,
  secret: string
): Promise<string> {
  const encoder = new TextEncoder();

  // Create payload with expiry
  const tokenPayload = {
    ...payload,
    iat: Date.now(),
    exp: Date.now() + TOKEN_EXPIRY_MS
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
  const token = await createSignedToken(
    { type: 'admin', user, role },
    secret || DEFAULT_SECRET
  );
  return token;
}

/**
 * Generate attendee token
 */
export async function generateAttendeeToken(ref: string, secret?: string): Promise<string> {
  const token = await createSignedToken(
    { type: 'attendee', ref },
    secret || DEFAULT_SECRET
  );
  return token;
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
    secret || DEFAULT_SECRET
  );

  if (!payload || payload.type !== 'admin') return null;

  return { user: payload.user, role: payload.role };
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
    secret || DEFAULT_SECRET
  );

  if (!payload || payload.type !== 'attendee') return null;

  return { ref: payload.ref };
}

/**
 * Rate limiting - check if login is allowed
 */
export async function checkRateLimit(
  db: D1Database,
  identifier: string,
  userType: 'admin' | 'attendee'
): Promise<{ allowed: boolean; remainingAttempts: number; resetTime: number }> {
  const windowStart = Date.now() - RATE_LIMIT_WINDOW_MS;
  const resetTime = Date.now() + RATE_LIMIT_WINDOW_MS;

  try {
    // Count recent failed attempts
    const { results } = await db.prepare(`
      SELECT COUNT(*) as count FROM login_attempts
      WHERE identifier = ? AND user_type = ? AND attempt_time > ? AND success = 0
    `).bind(identifier, userType, windowStart).all();

    const failedAttempts = (results[0] as unknown as { count: number }).count;
    const remainingAttempts = Math.max(0, MAX_LOGIN_ATTEMPTS - failedAttempts);

    return {
      allowed: failedAttempts < MAX_LOGIN_ATTEMPTS,
      remainingAttempts,
      resetTime
    };
  } catch {
    // If table doesn't exist, allow login
    return { allowed: true, remainingAttempts: MAX_LOGIN_ATTEMPTS, resetTime };
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
 * Create standardized JSON response with CORS headers
 */
export function createResponse<T>(data: T, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Cache-Control': 'no-cache'
    }
  });
}

/**
 * Handle CORS preflight requests
 */
export function handleCORS(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}

/**
 * Check if password needs upgrade from legacy format
 */
export function needsPasswordUpgrade(storedHash: string): boolean {
  return storedHash.startsWith('$retreat$');
}
