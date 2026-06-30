// Public retreat program / schedule endpoint.
//
// Read-only and unauthenticated: the program is the same generic schedule for
// everyone, shown in the attendee portal's Schedule view. Admins manage it via
// /api/admin/program. Items come back as a flat list ordered by sort_order;
// the client groups them by day_label.

import type { PagesContext } from '../_shared/types.js';
import { createResponse, handleCORS } from '../_shared/auth.js';
import { generateRequestId, createErrorResponse, handleError } from '../_shared/errors.js';

export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

export async function onRequestGet(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const { results } = await context.env.DB.prepare(`
      SELECT id, day_label, time_label, title, description, location, sort_order
      FROM program_items
      ORDER BY sort_order ASC, id ASC
    `).all();

    return createResponse({ items: results });
  } catch (error) {
    // Degrade gracefully if the table isn't migrated yet (025): show an empty
    // program rather than 500-ing the attendee Schedule view.
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('no such table')) {
      console.warn(`[${requestId}] program_items table missing; returning empty program`);
      return createResponse({ items: [] });
    }
    console.error(`[${requestId}] Error fetching program:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}
