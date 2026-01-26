// Login history report endpoint with TypeScript and pagination

import type { PagesContext } from '../../../_shared/types.js';
import { createResponse, checkAdminAuth, handleCORS } from '../../../_shared/auth.js';
import { parsePaginationParams, createPaginatedResponse } from '../../../_shared/pagination.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../../_shared/errors.js';

interface LoginHistoryRow {
  id: number;
  user_type: 'attendee' | 'admin';
  user_id: string;
  login_time: string;
}

interface CountResult {
  total: number;
}

// Handle CORS preflight
export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

// GET /api/admin/reports/login-history - Get recent login records with pagination
export async function onRequestGet(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));
    }

    const url = new URL(context.request.url);
    const { limit, offset } = parsePaginationParams(url);

    // Get total count
    const { results: countResult } = await context.env.DB.prepare(
      'SELECT COUNT(*) as total FROM login_history'
    ).all();
    const total = (countResult[0] as unknown as CountResult).total;

    // Get login history with pagination
    const { results } = await context.env.DB.prepare(`
      SELECT id, user_type, user_id, login_time
      FROM login_history
      ORDER BY datetime(login_time) DESC
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all();

    return createResponse(createPaginatedResponse(results as unknown as LoginHistoryRow[], total, limit, offset));

  } catch (error) {
    console.error(`[${requestId}] Error fetching login history:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}
