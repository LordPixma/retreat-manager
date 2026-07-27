// Bulk gender entry for attendees — backs the admin "Set Attendee Gender"
// modal that populates the Activity Teams balance heatmap without editing
// people one at a time.
//
//   GET  /api/admin/attendees/bulk-gender  -> every active attendee + current gender
//   POST /api/admin/attendees/bulk-gender  -> { updates: [{ id, gender }] } applied in one batch
//
// Static route file — precedes the sibling [id].ts dynamic route for this
// literal path. Both verbs degrade gracefully if the optional `gender` column
// (migration 031) hasn't been applied yet.

import type { PagesContext } from '../../../_shared/types.js';
import { createResponse, checkAdminAuth, handleCORS } from '../../../_shared/auth.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../../_shared/errors.js';

const MAX_UPDATES = 5000;

function normaliseGender(input: unknown): 'male' | 'female' | null {
  if (typeof input !== 'string') return null;
  const v = input.trim().toLowerCase();
  return v === 'male' || v === 'female' ? v : null;
}

export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

// List active attendees with their current gender for the bulk editor.
export async function onRequestGet(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));

    const select = (genderExpr: string) => `
      SELECT a.id, a.ref_number, a.name, ${genderExpr} AS gender, g.name AS group_name
      FROM attendees a
      LEFT JOIN groups g ON a.group_id = g.id
      WHERE a.is_archived = 0 OR a.is_archived IS NULL
      ORDER BY a.name
    `;

    let genderAvailable = true;
    let results: Record<string, unknown>[];
    try {
      ({ results } = await context.env.DB.prepare(select('a.gender')).all() as { results: Record<string, unknown>[] });
    } catch (err) {
      if (/no such column|gender/i.test(String((err as Error)?.message))) {
        genderAvailable = false;
        ({ results } = await context.env.DB.prepare(select('NULL')).all() as { results: Record<string, unknown>[] });
      } else {
        throw err;
      }
    }

    const attendees = results.map(r => ({
      id: r.id as number,
      ref_number: r.ref_number as string,
      name: r.name as string,
      gender: normaliseGender(r.gender),
      group_name: (r.group_name as string | null) ?? null,
    }));

    return createResponse({ attendees, gender_available: genderAvailable, total: attendees.length });

  } catch (error) {
    console.error(`[${requestId}] bulk-gender GET error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}

// Apply a batch of { id, gender } updates. Unknown/invalid gender clears the
// field (stores NULL). Returns how many rows were written.
export async function onRequestPost(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));

    const body = await context.request.json() as { updates?: Array<{ id?: unknown; gender?: unknown }> };
    const updates = Array.isArray(body?.updates) ? body.updates : null;
    if (!updates) return createErrorResponse(errors.badRequest('updates array is required', requestId));
    if (updates.length === 0) return createResponse({ updated: 0 });
    if (updates.length > MAX_UPDATES) {
      return createErrorResponse(errors.badRequest(`Too many updates (max ${MAX_UPDATES})`, requestId));
    }

    const stmt = context.env.DB.prepare('UPDATE attendees SET gender = ? WHERE id = ?');
    const batch = [];
    for (const u of updates) {
      const id = Number(u?.id);
      if (!Number.isInteger(id) || id <= 0) {
        return createErrorResponse(errors.badRequest('Each update needs a valid attendee id', requestId));
      }
      batch.push(stmt.bind(normaliseGender(u?.gender), id));
    }

    try {
      await context.env.DB.batch(batch);
    } catch (err) {
      if (/no such column|gender/i.test(String((err as Error)?.message))) {
        return createErrorResponse(errors.badRequest('Gender column not available yet — apply migration 031.', requestId));
      }
      throw err;
    }

    // Best-effort audit trail — this is a bulk PII write.
    try {
      await context.env.DB.prepare(
        `INSERT INTO audit_log (admin_user, action, entity_type, entity_id, details)
         VALUES (?, 'bulk_gender', 'attendee', 0, ?)`
      ).bind(admin.user, JSON.stringify({ count: batch.length })).run();
    } catch (err) {
      console.warn(`[${requestId}] audit_log write failed`, err);
    }

    return createResponse({ updated: batch.length });

  } catch (error) {
    console.error(`[${requestId}] bulk-gender POST error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}
