// Attendee login endpoint with TypeScript and validation

import type { PagesContext } from '../_shared/types.js';
import { createResponse, handleCORS, verifyPassword, generateAttendeeToken } from '../_shared/auth.js';
import { validate, loginSchema } from '../_shared/validation.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../_shared/errors.js';

interface AttendeeRow {
  id: number;
  ref_number: string;
  password_hash: string;
  name: string;
}

// Handle CORS preflight
export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

// POST /api/login - Attendee login
export async function onRequestPost(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const body = await context.request.json() as Record<string, unknown>;

    // Validate input
    const validation = validate(body, loginSchema);
    if (!validation.valid) {
      return createErrorResponse(errors.validation(validation.errors, requestId));
    }

    const { ref, password } = body as { ref: string; password: string };

    // Query attendee from database
    const { results } = await context.env.DB.prepare(`
      SELECT id, ref_number, password_hash, name
      FROM attendees
      WHERE ref_number = ?
    `).bind(ref.trim()).all();

    if (!results.length) {
      return createErrorResponse(errors.unauthorized('Unknown reference number', requestId));
    }

    const attendee = results[0] as unknown as AttendeeRow;

    // Verify password
    const isValid = await verifyPassword(password, attendee.password_hash);

    if (!isValid) {
      return createErrorResponse(errors.unauthorized('Invalid password', requestId));
    }

    // Record login history and update last_login
    await context.env.DB.prepare(`
      INSERT INTO login_history (user_type, user_id, login_time)
      VALUES ('attendee', ?, CURRENT_TIMESTAMP)
    `).bind(ref.trim()).run();

    await context.env.DB.prepare(`
      UPDATE attendees SET last_login = CURRENT_TIMESTAMP
      WHERE ref_number = ?
    `).bind(ref.trim()).run();

    // Create token
    const token = generateAttendeeToken(ref);

    return createResponse({ token });

  } catch (error) {
    console.error(`[${requestId}] Error in attendee login:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}
