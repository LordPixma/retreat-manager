// worker/auth.js
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

// Secrets from environment (set in wrangler.toml or Cloudflare dashboard)
const ADMIN_JWT_SECRET = globalThis.ADMIN_JWT_SECRET;
const ATTENDEE_JWT_SECRET = globalThis.ATTENDEE_JWT_SECRET;

// TextEncoder for jose key
const encoder = new TextEncoder();
const adminKey = encoder.encode(ADMIN_JWT_SECRET);
const attendeeKey = encoder.encode(ATTENDEE_JWT_SECRET);

// Token lifetimes
const ADMIN_EXPIRY = '2h';
const ATTENDEE_EXPIRY = '2h';

// Create signed Admin JWT
export async function createAdminJWT(payload) {
  return await new SignJWT({ ...payload, role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ADMIN_EXPIRY)
    .sign(adminKey);
}

// Verify Admin JWT
export async function verifyAdminJWT(token) {
  const { payload } = await jwtVerify(token, adminKey);
  if (payload.role !== 'admin') throw new Error('Not an admin token');
  return payload;
}

// Create signed Attendee JWT
export async function createAttendeeJWT(payload) {
  return await new SignJWT({ ...payload, role: 'attendee' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ATTENDEE_EXPIRY)
    .sign(attendeeKey);
}

// Verify Attendee JWT
export async function verifyAttendeeJWT(token) {
  const { payload } = await jwtVerify(token, attendeeKey);
  if (payload.role !== 'attendee') throw new Error('Not an attendee token');
  return payload;
}

// Password hashing
export async function hashPassword(plain) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(plain, salt);
}

export async function verifyPassword(plain, hash) {
  return await bcrypt.compare(plain, hash);
}
