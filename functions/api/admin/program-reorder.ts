// Admin program management — bulk reorder / re-day program items.
//
// Backs the drag-and-drop calendar board: when an admin drops a card, the
// client sends the full desired state for the affected cards as
// { items: [{ id, event_date, sort_order }, ...] }. Each entry's event_date
// (the column it now lives in) and sort_order (its position in that column)
// are written in a single atomic D1 batch so a half-applied reorder can never
// be observed.
//
// Lives at /api/admin/program-reorder (a sibling of the program/ directory)
// rather than program/reorder so it can never be shadowed by the program/[id]
// dynamic route.

import type { PagesContext } from '../../_shared/types.js';
import { createResponse, checkAdminAuth, handleCORS } from '../../_shared/auth.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../_shared/errors.js';

interface ReorderItem {
  id: number;
  sort_order: number;
  event_date?: string;
}

const MAX_ITEMS = 1000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

// PUT /api/admin/program-reorder
export async function onRequestPut(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));
    }

    const body = await context.request.json() as { items?: unknown };
    const rawItems = body?.items;

    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return createErrorResponse(errors.badRequest('items must be a non-empty array', requestId));
    }
    if (rawItems.length > MAX_ITEMS) {
      return createErrorResponse(errors.badRequest(`Cannot reorder more than ${MAX_ITEMS} items at once`, requestId));
    }

    // Validate every entry up front; reject the whole request on the first bad
    // one so we never apply a partial, half-validated reorder.
    const items: ReorderItem[] = [];
    for (const raw of rawItems) {
      const entry = raw as Record<string, unknown>;
      const id = Number(entry.id);
      const sortOrder = Number(entry.sort_order);

      if (!Number.isInteger(id) || id <= 0) {
        return createErrorResponse(errors.badRequest('Each item needs a positive integer id', requestId));
      }
      if (!Number.isInteger(sortOrder)) {
        return createErrorResponse(errors.badRequest('Each item needs an integer sort_order', requestId));
      }

      const item: ReorderItem = { id, sort_order: sortOrder };

      if (entry.event_date !== undefined && entry.event_date !== null && entry.event_date !== '') {
        const date = String(entry.event_date);
        if (!DATE_RE.test(date)) {
          return createErrorResponse(errors.badRequest('event_date must be YYYY-MM-DD', requestId));
        }
        item.event_date = date;
      }

      items.push(item);
    }

    // One prepared statement per item; D1 runs them as a single atomic batch.
    const withDate = context.env.DB.prepare(
      'UPDATE program_items SET event_date = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    );
    const withoutDate = context.env.DB.prepare(
      'UPDATE program_items SET sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    );

    const statements = items.map((item) =>
      item.event_date !== undefined
        ? withDate.bind(item.event_date, item.sort_order, item.id)
        : withoutDate.bind(item.sort_order, item.id)
    );

    await context.env.DB.batch(statements);

    return createResponse({ success: true, updated: items.length });
  } catch (error) {
    console.error(`[${requestId}] Error reordering program items:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}
