// Admin login endpoint with TypeScript, validation, and security

import type { PagesContext } from '../../_shared/types.js';
import {
  createResponse,
  handleCORS,
  generateAdminToken,
  checkRateLimit,
  recordLoginAttempt,
  clearRateLimit
} from '../../_shared/auth.js';
import { validate, adminLoginSchema } from '../../_shared/validation.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../_shared/errors.js';

// Handle CORS preflight
export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

// POST /api/admin/login - Admin login
export async function onRequestPost(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const body = await context.request.json() as Record<string, unknown>;

    // Validate input
    const validation = validate(body, adminLoginSchema);
    if (!validation.valid) {
      return createErrorResponse(errors.validation(validation.errors, requestId));
    }

    const { user, pass } = body as { user: string; pass: string };
    const trimmedUser = user.trim();

    // Get client IP for rate limiting
    const clientIP = context.request.headers.get('CF-Connecting-IP') ||
                     context.request.headers.get('X-Forwarded-For') ||
                     'unknown';

    // Check rate limit
    const rateLimit = await checkRateLimit(context.env.DB, trimmedUser, 'admin');
    if (!rateLimit.allowed) {
      return createErrorResponse(errors.rateLimited(Math.ceil((rateLimit.resetTime - Date.now()) / 1000), requestId));
    }

    // Check credentials against environment variables
    const adminUser = context.env.ADMIN_USER || 'admin';
    const adminPass = context.env.ADMIN_PASS || 'admin123';

    // Verify credentials using constant-time comparison
    const userMatch = timingSafeEqual(trimmedUser, adminUser);
    const passMatch = timingSafeEqual(pass, adminPass);

    if (!userMatch || !passMatch) {
      // Record failed attempt
      await recordLoginAttempt(context.env.DB, trimmedUser, 'admin', false, clientIP);
      return createErrorResponse(errors.unauthorized('Invalid credentials', requestId));
    }

    // Record successful login and clear rate limit
    await recordLoginAttempt(context.env.DB, trimmedUser, 'admin', true, clientIP);
    await clearRateLimit(context.env.DB, trimmedUser, 'admin');

    // Record login history
    await context.env.DB.prepare(`
      INSERT INTO login_history (user_type, user_id, login_time)
      VALUES ('admin', ?, CURRENT_TIMESTAMP)
    `).bind(trimmedUser).run();

    // Create admin token with JWT secret from environment
    const token = await generateAdminToken(trimmedUser, 'admin', context.env.JWT_SECRET);

    return createResponse({ token });

  } catch (error) {
    console.error(`[${requestId}] Error in admin login:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Compare against itself to maintain constant time
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ a.charCodeAt(i);
    }
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
