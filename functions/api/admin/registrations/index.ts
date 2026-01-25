// Admin registrations management endpoint with TypeScript
// List and manage pending registrations

import type { PagesContext } from '../../../_shared/types.js';
import { createResponse, checkAdminAuth, handleCORS } from '../../../_shared/auth.js';
import { parsePaginationParams, createPaginatedResponse } from '../../../_shared/pagination.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../../_shared/errors.js';

interface RegistrationRow {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  emergency_contact: string | null;
  dietary_requirements: string | null;
  special_requests: string | null;
  preferred_room_type: string;
  payment_option: string;
  status: string;
  notes: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

interface CountResult {
  total: number;
}

// Handle CORS preflight
export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

// GET /api/admin/registrations - List all registrations with pagination
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

    // Build query with optional status filter
    let countQuery = 'SELECT COUNT(*) as total FROM registrations';
    let dataQuery = `
      SELECT id, name, email, phone, emergency_contact,
             dietary_requirements, special_requests,
             preferred_room_type, group_preference, status,
             notes, submitted_at, reviewed_at, reviewed_by
      FROM registrations
    `;

    const bindings: (string | number)[] = [];

    if (statusFilter && ['pending', 'approved', 'rejected', 'waitlist'].includes(statusFilter)) {
      countQuery += ' WHERE status = ?';
      dataQuery += ' WHERE status = ?';
      bindings.push(statusFilter);
    }

    dataQuery += ' ORDER BY submitted_at DESC LIMIT ? OFFSET ?';

    // Get total count
    const countStmt = statusFilter
      ? context.env.DB.prepare(countQuery).bind(statusFilter)
      : context.env.DB.prepare(countQuery);
    const { results: countResult } = await countStmt.all();
    const total = (countResult[0] as unknown as CountResult).total;

    // Get registrations with pagination
    const stmt = statusFilter
      ? context.env.DB.prepare(dataQuery).bind(statusFilter, limit, offset)
      : context.env.DB.prepare(dataQuery).bind(limit, offset);
    const { results } = await stmt.all();

    return createResponse(createPaginatedResponse(results as unknown as RegistrationRow[], total, limit, offset));

  } catch (error) {
    console.error(`[${requestId}] Error fetching registrations:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}
