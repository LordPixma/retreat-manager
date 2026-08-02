// POST /api/admin/season/reset
// Body: { confirm: string }
//
// Super-admin only, and gated behind an exact confirmation phrase. Clears every
// event-specific table (dynamically discovered) while preserving admin/staff
// accounts and app configuration (see KEEP_TABLES). Used once a year to reset
// the platform for the next retreat. The admin is expected to have downloaded a
// full backup (GET /api/admin/season/export) first — the UI enforces that.
//
// This is destructive and irreversible. The confirm phrase + super-admin gate
// are the guardrails; there is intentionally no "are you sure?" shortcut.

import type { PagesContext } from '../../../_shared/types.js';
import { requireSuperAdmin, handleCORS, createResponse } from '../../../_shared/auth.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../../_shared/errors.js';
import { tablesToClear, KEEP_TABLES } from '../../../_shared/season.js';

export const CONFIRM_PHRASE = 'RESET FOR NEW SEASON';

export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

export async function onRequestPost(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const admin = await requireSuperAdmin(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) return createErrorResponse(errors.forbidden('Super-admin role required', requestId));

    const body = await context.request.json().catch(() => ({})) as { confirm?: unknown };
    const confirm = typeof body.confirm === 'string' ? body.confirm.trim() : '';
    if (confirm !== CONFIRM_PHRASE) {
      return createErrorResponse(errors.badRequest(`Confirmation phrase must be exactly "${CONFIRM_PHRASE}"`, requestId));
    }

    const targets = await tablesToClear(context.env.DB);

    // Count rows first so we can report what was removed.
    const cleared: Record<string, number> = {};
    for (const table of targets) {
      const row = await context.env.DB.prepare(`SELECT COUNT(*) AS c FROM "${table}"`).first();
      cleared[table] = (row?.c as number) ?? 0;
    }

    // Atomic wipe of all target tables.
    if (targets.length > 0) {
      const stmts = targets.map(t => context.env.DB.prepare(`DELETE FROM "${t}"`));
      await context.env.DB.batch(stmts);
    }

    // Reset AUTOINCREMENT counters for the cleared tables so next season's IDs
    // start clean. Best-effort — sqlite_sequence only exists if some table uses
    // AUTOINCREMENT, so a failure here must not fail the reset.
    try {
      const placeholders = targets.map(() => '?').join(',');
      if (placeholders) {
        await context.env.DB.prepare(
          `DELETE FROM sqlite_sequence WHERE name IN (${placeholders})`
        ).bind(...targets).run();
      }
    } catch (err) {
      console.warn(`[${requestId}] sqlite_sequence reset skipped`, err);
    }

    // audit_log was just cleared (it's an event table) — write the reset as the
    // first entry of the new season so there's a record of who ran it.
    try {
      await context.env.DB.prepare(
        `INSERT INTO audit_log (admin_user, action, entity_type, entity_id, details)
         VALUES (?, 'season_reset', 'system', 0, ?)`
      ).bind(admin.user, JSON.stringify({ cleared, kept: KEEP_TABLES })).run();
    } catch (err) {
      console.warn(`[${requestId}] audit_log write failed`, err);
    }

    const totalRows = Object.values(cleared).reduce((a, b) => a + b, 0);
    return createResponse({
      success: true,
      cleared,
      kept: KEEP_TABLES,
      tables_cleared: targets.length,
      rows_cleared: totalRows,
      message: `Season reset complete — cleared ${totalRows} rows across ${targets.length} tables. Admin accounts and settings were preserved.`,
    });

  } catch (error) {
    console.error(`[${requestId}] season reset error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}
