import { jsonResponse, badRequest, unauthorized } from '../utils/http.js';
import { verifyAdminJWT, createAdminJWT, hashPassword } from '../auth.js';
import { db } from '../db.js';

export async function login(request) {
  const { user, pass } = await request.json();
  if (user !== globalThis.ADMIN_USER || pass !== globalThis.ADMIN_PASS) {
    return unauthorized('Invalid credentials');
  }
  const token = await createAdminJWT({ user });
  return jsonResponse({ token });
}

async function requireAuth(request) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.replace('Bearer ', '');
  const payload = await verifyAdminJWT(token).catch(() => null);
  if (!payload) throw new Error('Unauthorized');
  return payload;
}

export async function listAttendees(request) {
  try {
    await requireAuth(request);
    const { results } = await db.prepare(
      `SELECT a.id, a.ref_number, a.name, a.payment_due, a.room_id, a.group_id,
              r.number AS room_number, g.name AS group_name
       FROM attendees a
       LEFT JOIN rooms r ON a.room_id = r.id
       LEFT JOIN groups g ON a.group_id = g.id`
    ).all();

    const formatted = results.map(a => ({
      id: a.id,
      ref_number: a.ref_number,
      name: a.name,
      payment_due: a.payment_due,
      room: a.room_number ? { number: a.room_number } : null,
      group: a.group_name ? { name: a.group_name } : null
    }));
    return jsonResponse(formatted);
  } catch {
    return unauthorized();
  }
}

export async function createAttendee(request) {
  try {
    await requireAuth(request);
    const { name, email, ref_number, password, room_id, group_id, payment_due } = await request.json();
    if (!name || !ref_number || !password) {
      return badRequest('Missing required fields');
    }
    const hash = await hashPassword(password);
    const result = await db.prepare(
      `INSERT INTO attendees (name, email, ref_number, password_hash, room_id, group_id, payment_due)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(name, email, ref_number, hash, room_id || null, group_id || null, payment_due || 0);
    return jsonResponse({ id: result.lastInsertRowid }, 201);
  } catch (err) {
    return unauthorized();
  }
}

export async function getAttendee(request, { params }) {
  try {
    await requireAuth(request);
    const id = params.id;
    const { results } = await db.prepare(`SELECT * FROM attendees WHERE id = ?`).all(id);
    if (!results.length) return badRequest('Not found', 404);
    return jsonResponse(results[0]);
  } catch {
    return unauthorized();
  }
}

export async function updateAttendee(request, { params }) {
  try {
    await requireAuth(request);
    const id = params.id;
    const updates = await request.json();
    const fields = Object.keys(updates);
    const values = fields.map(f => updates[f]);
    const setClause = fields.map(f => `${f} = ?`).join(', ');
    await db.prepare(`UPDATE attendees SET ${setClause} WHERE id = ?`).run(...values, id);
    return jsonResponse({ success: true });
  } catch {
    return unauthorized();
  }
}

export async function deleteAttendee(request, { params }) {
  try {
    await requireAuth(request);
    const id = params.id;
    await db.prepare(`DELETE FROM attendees WHERE id = ?`).run(id);
    return jsonResponse({ success: true });
  } catch {
    return unauthorized();
  }
}