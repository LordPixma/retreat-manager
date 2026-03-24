import type { PagesContext } from '../../../_shared/types.js';
import { createResponse, checkAdminAuth, handleCORS } from '../../../_shared/auth.js';
import { parsePaginationParams, createPaginatedResponse } from '../../../_shared/pagination.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../../_shared/errors.js';

export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

// GET /api/admin/payments
export async function onRequestGet(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));
    }

    const url = new URL(context.request.url);
    const { limit, offset } = parsePaginationParams(url);
    const statusFilter = url.searchParams.get('status');
    const attendeeIdFilter = url.searchParams.get('attendee_id');

    let countQuery = 'SELECT COUNT(*) as total FROM payments';
    let dataQuery = `
      SELECT p.*, a.name as attendee_name, a.ref_number as attendee_ref
      FROM payments p
      LEFT JOIN attendees a ON p.attendee_id = a.id
    `;

    const conditions: string[] = [];
    const bindings: (string | number)[] = [];

    if (statusFilter) {
      conditions.push('p.status = ?');
      bindings.push(statusFilter);
    }
    if (attendeeIdFilter) {
      conditions.push('p.attendee_id = ?');
      bindings.push(parseInt(attendeeIdFilter));
    }

    if (conditions.length > 0) {
      const where = ' WHERE ' + conditions.join(' AND ');
      countQuery += where.replace(/p\./g, '');
      dataQuery += where;
    }

    dataQuery += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';

    // Get count
    const countStmt = context.env.DB.prepare(countQuery);
    const { results: countResult } = bindings.length > 0
      ? await countStmt.bind(...bindings).all()
      : await countStmt.all();
    const total = (countResult[0] as { total: number }).total;

    // Get data
    const dataStmt = context.env.DB.prepare(dataQuery);
    const allBindings = [...bindings, limit, offset];
    const { results } = await dataStmt.bind(...allBindings).all();

    return createResponse(createPaginatedResponse(results, total, limit, offset));

  } catch (error) {
    console.error(`[${requestId}] Error fetching payments:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}
