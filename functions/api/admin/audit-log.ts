import type { PagesContext } from '../../_shared/types.js';
import { createResponse, checkAdminAuth, handleCORS } from '../../_shared/auth.js';
import { parsePaginationParams, createPaginatedResponse } from '../../_shared/pagination.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../_shared/errors.js';

export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

// GET /api/admin/audit-log
export async function onRequestGet(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));

    const url = new URL(context.request.url);
    const { limit, offset } = parsePaginationParams(url);

    const { results: countResult } = await context.env.DB.prepare(
      'SELECT COUNT(*) as total FROM audit_log'
    ).all();
    const total = (countResult[0] as { total: number }).total;

    const { results } = await context.env.DB.prepare(`
      SELECT * FROM audit_log ORDER BY created_at DESC LIMIT ? OFFSET ?
    `).bind(limit, offset).all();

    return createResponse(createPaginatedResponse(results, total, limit, offset));

  } catch (error) {
    console.error(`[${requestId}] Audit log error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}
