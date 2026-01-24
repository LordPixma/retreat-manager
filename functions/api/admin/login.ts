// Admin login endpoint with TypeScript and validation

import type { PagesContext } from '../../_shared/types.js';
import { createResponse, handleCORS, generateAdminToken } from '../../_shared/auth.js';
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

    // Check credentials against environment variables
    const adminUser = context.env.ADMIN_USER || 'admin';
    const adminPass = context.env.ADMIN_PASS || 'admin123';

    // Verify credentials
    if (user.trim() !== adminUser || pass !== adminPass) {
      return createErrorResponse(errors.unauthorized('Invalid credentials', requestId));
    }

    // Record login history
    await context.env.DB.prepare(`
      INSERT INTO login_history (user_type, user_id, login_time)
      VALUES ('admin', ?, CURRENT_TIMESTAMP)
    `).bind(user.trim()).run();

    // Create admin token
    const token = generateAdminToken(user);

    return createResponse({ token });

  } catch (error) {
    console.error(`[${requestId}] Error in admin login:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}
