// Attendee login endpoint with TypeScript, validation, and security

import type { PagesContext } from '../_shared/types.js';
import {
  createResponse,
  handleCORS,
  verifyPassword,
  generateAttendeeToken,
  checkRateLimit,
  recordLoginAttempt,
  clearRateLimit,
  needsPasswordUpgrade,
  hashPassword
} from '../_shared/auth.js';
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
    const trimmedRef = ref.trim();

    // Get client IP for rate limiting
    const clientIP = context.request.headers.get('CF-Connecting-IP') ||
                     context.request.headers.get('X-Forwarded-For') ||
                     'unknown';

    // Check rate limit
    const rateLimit = await checkRateLimit(context.env.DB, trimmedRef, 'attendee');
    if (!rateLimit.allowed) {
      return createErrorResponse(errors.rateLimited(Math.ceil((rateLimit.resetTime - Date.now()) / 1000), requestId));
    }

    // Query attendee from database
    const { results } = await context.env.DB.prepare(`
      SELECT id, ref_number, password_hash, name
      FROM attendees
      WHERE ref_number = ?
    `).bind(trimmedRef).all();

    if (!results.length) {
      // Record failed attempt
      await recordLoginAttempt(context.env.DB, trimmedRef, 'attendee', false, clientIP);
      return createErrorResponse(errors.unauthorized('Invalid credentials', requestId));
    }

    const attendee = results[0] as unknown as AttendeeRow;

    // Verify password
    const isValid = await verifyPassword(password, attendee.password_hash);

    if (!isValid) {
      // Record failed attempt
      await recordLoginAttempt(context.env.DB, trimmedRef, 'attendee', false, clientIP);
      return createErrorResponse(errors.unauthorized('Invalid credentials', requestId));
    }

    // Record successful login and clear rate limit
    await recordLoginAttempt(context.env.DB, trimmedRef, 'attendee', true, clientIP);
    await clearRateLimit(context.env.DB, trimmedRef, 'attendee');

    // Upgrade password hash if using legacy format
    if (needsPasswordUpgrade(attendee.password_hash)) {
      const newHash = await hashPassword(password);
      await context.env.DB.prepare(`
        UPDATE attendees SET password_hash = ? WHERE id = ?
      `).bind(newHash, attendee.id).run();
    }

    // Record login history and update last_login
    await context.env.DB.prepare(`
      INSERT INTO login_history (user_type, user_id, login_time)
      VALUES ('attendee', ?, CURRENT_TIMESTAMP)
    `).bind(trimmedRef).run();

    await context.env.DB.prepare(`
      UPDATE attendees SET last_login = CURRENT_TIMESTAMP
      WHERE ref_number = ?
    `).bind(trimmedRef).run();

    // Create token with JWT secret from environment
    const token = await generateAttendeeToken(trimmedRef, context.env.JWT_SECRET);

    return createResponse({ token });

  } catch (error) {
    console.error(`[${requestId}] Error in attendee login:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}
