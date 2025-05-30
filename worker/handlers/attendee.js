import { jsonResponse, unauthorized } from '../utils/http.js';
import { verifyAttendeeJWT, createAttendeeJWT, verifyPassword } from '../auth.js';
import { db } from '../db.js';

export async function login(request) {
  const { ref, password } = await request.json();
  const { results } = await db.prepare(
    `SELECT id, password_hash FROM attendees WHERE ref_number = ?`
  ).all(ref);
  if (!results.length) {
    return unauthorized('Unknown reference number');
  }
  const user = results[0];
  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return unauthorized('Invalid password');
  }
  const token = await createAttendeeJWT({ id: user.id, ref });
  return jsonResponse({ token });
}

export async function getMe(request) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.replace('Bearer ', '');
  const payload = await verifyAttendeeJWT(token).catch(() => null);
  if (!payload) return unauthorized();

  const { results } = await db.prepare(
    `SELECT a.name, a.payment_due,
            r.number AS room_number, r.description,
            g.name AS group_name
     FROM attendees a
     LEFT JOIN rooms r ON a.room_id = r.id
     LEFT JOIN groups g ON a.group_id = g.id
     WHERE a.id = ?`
  ).all(payload.id);

  const me = results[0];

  let members = [];
  if (me.group_name) {
    const { results: mems } = await db.prepare(
      `SELECT name, ref_number FROM attendees WHERE group_id = (
         SELECT group_id FROM attendees WHERE id = ?
       ) AND id != ?`
    ).all(payload.id, payload.id);
    members = mems;
  }

  return jsonResponse({
    name: me.name,
    payment_due: me.payment_due,
    room: me.room_number ? { number: me.room_number, description: me.description } : null,
    group: me.group_name ? { name: me.group_name, members } : null
  });
}