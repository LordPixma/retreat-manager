import { env } from 'cloudflare:test';
import { hashPassword } from '../../functions/_shared/auth.js';
import { createSchema } from './schema.js';

// Fresh focused schema for each test (isolated storage gives each test its own
// D1, so we just (re)create the tables the tested endpoints use).
export async function setupDb() {
  await createSchema();
}

// Seed an attendee and return its id. `password` defaults to a valid one.
export async function seedAttendee(o) {
  const hash = await hashPassword(o.password ?? 'Password123');
  await env.DB.prepare(
    `INSERT INTO attendees (name, first_name, last_name, ref_number, email, password_hash, payment_due, payment_status, must_reset_password, room_id, group_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`
  ).bind(
    o.name ?? 'Test User',
    o.first_name ?? 'Test',
    o.last_name ?? 'User',
    o.ref,
    o.email ?? null,
    hash,
    o.payment_due ?? 0,
    o.must_reset ? 1 : 0,
    o.room_id ?? null,
    o.group_id ?? null
  ).run();
  const row = await env.DB.prepare('SELECT id FROM attendees WHERE ref_number = ?').bind(o.ref).first();
  return row.id;
}

// Build a JSON POST request for a Pages Function handler.
export function jsonRequest(body, headers = {}) {
  return new Request('https://test.local/api', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

// Build a request with a chosen method (for GET/DELETE handlers).
export function methodRequest(method, headers = {}, body) {
  return new Request('https://test.local/api', {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

// Minimal PagesContext stand-in for invoking onRequestX handlers directly.
export function ctx(request, params = {}) {
  return { request, env, params, waitUntil: () => {}, next: async () => new Response(), data: {} };
}

// Authorization header for an attendee token.
export function bearer(token) {
  return { Authorization: `Bearer ${token}` };
}
