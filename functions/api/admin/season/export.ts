// GET /api/admin/season/export
//
// Super-admin only. Produces a full JSON snapshot of every table in the
// database — the restorable backup an admin downloads BEFORE running a season
// reset. Includes admins/settings too, so the archive is a complete restore
// point (not just the event data being cleared).

import type { PagesContext } from '../../../_shared/types.js';
import { requireSuperAdmin, handleCORS } from '../../../_shared/auth.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../../_shared/errors.js';
import { listUserTables } from '../../../_shared/season.js';

export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

export async function onRequestGet(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const admin = await requireSuperAdmin(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) return createErrorResponse(errors.forbidden('Super-admin role required', requestId));

    const tables = await listUserTables(context.env.DB);
    const dump: Record<string, unknown[]> = {};
    const counts: Record<string, number> = {};

    for (const table of tables) {
      const { results } = await context.env.DB.prepare(`SELECT * FROM "${table}"`).all();
      dump[table] = results as unknown[];
      counts[table] = results.length;
    }

    const archive = {
      _meta: {
        kind: 'retreat-portal-full-backup',
        version: 1,
        exported_by: admin.user || 'admin',
        table_count: tables.length,
        counts,
        // NOTE: no timestamp is generated server-side here to keep the handler
        // deterministic/testable; the download filename carries the date.
      },
      tables: dump,
    };

    const date = new Date().toISOString().split('T')[0];
    return new Response(JSON.stringify(archive, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="retreat-backup-${date}.json"`,
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error(`[${requestId}] season export error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}
