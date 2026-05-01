// POST /api/change-password
// Lets an attendee replace their password by re-authenticating with the
// current one. Used both for the forced reset of legacy $retreat$ accounts
// (must_reset_password = 1) and as a general self-service flow.

import type { PagesContext } from '../_shared/types.js';
import {
  createResponse,
  handleCORS,
  hashPassword,
  verifyPassword,
  checkRateLimit,
  recordLoginAttempt,
} from '../_shared/auth.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../_shared/errors.js';

interface AttendeeRow {
  id: number;
  password_hash: string;
}

const MIN_PASSWORD_LENGTH = 8;

export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

export async function onRequestPost(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const body = await context.request.json() as Record<string, unknown>;
    const ref = typeof body.ref === 'string' ? body.ref.trim() : '';
    const currentPassword = typeof body.current_password === 'string' ? body.current_password : '';
    const newPassword = typeof body.new_password === 'string' ? body.new_password : '';

    if (!ref || !currentPassword || !newPassword) {
      return createErrorResponse(errors.badRequest('ref, current_password and new_password are required', requestId));
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return createErrorResponse(errors.badRequest(`New password must be at least ${MIN_PASSWORD_LENGTH} characters`, requestId));
    }
    if (newPassword === currentPassword) {
      return createErrorResponse(errors.badRequest('New password must be different from current password', requestId));
    }

    const clientIP = context.request.headers.get('CF-Connecting-IP') ||
                     context.request.headers.get('X-Forwarded-For') ||
                     'unknown';

    // Reuse the login rate limiter — same brute-force surface.
    const rateLimit = await checkRateLimit(context.env.DB, ref, 'attendee', clientIP);
    if (!rateLimit.allowed) {
      return createErrorResponse(errors.rateLimited(Math.ceil((rateLimit.resetTime - Date.now()) / 1000), requestId));
    }

    const { results } = await context.env.DB.prepare(
      'SELECT id, password_hash FROM attendees WHERE ref_number = ?'
    ).bind(ref).all();
    if (!results.length) {
      await recordLoginAttempt(context.env.DB, ref, 'attendee', false, clientIP);
      return createErrorResponse(errors.unauthorized('Invalid credentials', requestId));
    }
    const attendee = results[0] as unknown as AttendeeRow;

    const ok = await verifyPassword(currentPassword, attendee.password_hash);
    if (!ok) {
      await recordLoginAttempt(context.env.DB, ref, 'attendee', false, clientIP);
      return createErrorResponse(errors.unauthorized('Invalid credentials', requestId));
    }

    const newHash = await hashPassword(newPassword);
    await context.env.DB.prepare(
      'UPDATE attendees SET password_hash = ?, must_reset_password = 0 WHERE id = ?'
    ).bind(newHash, attendee.id).run();

    await recordLoginAttempt(context.env.DB, ref, 'attendee', true, clientIP);

    return createResponse({ success: true });
  } catch (error) {
    console.error(`[${requestId}] change-password error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}
