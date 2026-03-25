import type { PagesContext } from '../_shared/types.js';
import { createResponse, checkAttendeeAuth, handleCORS } from '../_shared/auth.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../_shared/errors.js';

export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

// PUT /api/profile — attendee self-edit
export async function onRequestPut(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const auth = await checkAttendeeAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!auth) {
      return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));
    }

    const body = await context.request.json() as Record<string, unknown>;

    // Only allow these fields to be self-edited
    const allowedFields = ['phone', 'emergency_contact', 'dietary_requirements', 'special_requests'];
    const updates: string[] = [];
    const values: (string | null)[] = [];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(typeof body[field] === 'string' ? (body[field] as string).trim() || null : null);
      }
    }

    if (updates.length === 0) {
      return createErrorResponse(errors.badRequest('No valid fields to update', requestId));
    }

    values.push(auth.ref);
    await context.env.DB.prepare(
      `UPDATE attendees SET ${updates.join(', ')} WHERE ref_number = ?`
    ).bind(...values).run();

    return createResponse({ message: 'Profile updated successfully' });

  } catch (error) {
    console.error(`[${requestId}] Profile update error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}
