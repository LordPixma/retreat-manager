// Admin registration detail endpoint
// View, approve, reject, or delete individual registrations

import type { PagesContext } from '../../../_shared/types.js';
import { createResponse, checkAdminAuth, handleCORS, hashPassword } from '../../../_shared/auth.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../../_shared/errors.js';

interface IdParams {
  id: string;
}

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

interface ApprovalInput {
  action: 'approve' | 'reject' | 'waitlist';
  notes?: string;
  room_id?: number;
  group_id?: number;
  payment_due?: number;
}

// Handle CORS preflight
export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

// GET /api/admin/registrations/:id - Get single registration
export async function onRequestGet(context: PagesContext<IdParams>): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));
    }

    const registrationId = context.params.id;
    if (!registrationId) {
      return createErrorResponse(errors.badRequest('Registration ID is required', requestId));
    }

    const { results } = await context.env.DB.prepare(`
      SELECT * FROM registrations WHERE id = ?
    `).bind(registrationId).all();

    if (results.length === 0) {
      return createErrorResponse(errors.notFound('Registration', requestId));
    }

    return createResponse(results[0] as unknown as RegistrationRow);

  } catch (error) {
    console.error(`[${requestId}] Error fetching registration:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}

// PUT /api/admin/registrations/:id - Approve, reject, or update registration
export async function onRequestPut(context: PagesContext<IdParams>): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));
    }

    const registrationId = context.params.id;
    if (!registrationId) {
      return createErrorResponse(errors.badRequest('Registration ID is required', requestId));
    }

    // Get registration
    const { results } = await context.env.DB.prepare(`
      SELECT * FROM registrations WHERE id = ?
    `).bind(registrationId).all();

    if (results.length === 0) {
      return createErrorResponse(errors.notFound('Registration', requestId));
    }

    const registration = results[0] as unknown as RegistrationRow;
    const body = await context.request.json() as ApprovalInput;

    if (!body.action || !['approve', 'reject', 'waitlist'].includes(body.action)) {
      return createErrorResponse(errors.badRequest('Valid action is required (approve, reject, waitlist)', requestId));
    }

    if (body.action === 'approve') {
      // Create attendee from registration
      const refNumber = await generateRefNumber(context.env.DB);
      const tempPassword = generateTempPassword();
      const passwordHash = await hashPassword(tempPassword);

      // Get group_id if group_preference was specified
      let groupId: number | null = body.group_id || null;
      if (!groupId && registration.group_preference) {
        const { results: groups } = await context.env.DB.prepare(`
          SELECT id FROM groups WHERE name = ?
        `).bind(registration.group_preference).all();
        if (groups.length > 0) {
          groupId = (groups[0] as unknown as { id: number }).id;
        }
      }

      // Insert new attendee
      const attendeeResult = await context.env.DB.prepare(`
        INSERT INTO attendees (
          ref_number, name, email, password_hash, phone,
          emergency_contact, dietary_requirements, special_requests,
          room_id, group_id, payment_due, payment_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
      `).bind(
        refNumber,
        registration.name,
        registration.email,
        passwordHash,
        registration.phone,
        registration.emergency_contact,
        registration.dietary_requirements,
        registration.special_requests,
        body.room_id || null,
        groupId,
        body.payment_due || 0
      ).run();

      if (!attendeeResult.success) {
        throw new Error('Failed to create attendee from registration');
      }

      // Update registration status
      await context.env.DB.prepare(`
        UPDATE registrations
        SET status = 'approved', notes = ?, reviewed_at = CURRENT_TIMESTAMP, reviewed_by = ?
        WHERE id = ?
      `).bind(body.notes || null, admin.user || 'Admin', registrationId).run();

      // TODO: Send approval email with login credentials

      return createResponse({
        success: true,
        message: 'Registration approved and attendee created',
        attendee: {
          ref_number: refNumber,
          temp_password: tempPassword // Include temporarily for admin to share
        }
      });

    } else {
      // Reject or waitlist
      const newStatus = body.action === 'reject' ? 'rejected' : 'waitlist';

      await context.env.DB.prepare(`
        UPDATE registrations
        SET status = ?, notes = ?, reviewed_at = CURRENT_TIMESTAMP, reviewed_by = ?
        WHERE id = ?
      `).bind(newStatus, body.notes || null, admin.user || 'Admin', registrationId).run();

      return createResponse({
        success: true,
        message: `Registration ${newStatus === 'rejected' ? 'rejected' : 'added to waitlist'}`
      });
    }

  } catch (error) {
    console.error(`[${requestId}] Error updating registration:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}

// DELETE /api/admin/registrations/:id - Delete registration
export async function onRequestDelete(context: PagesContext<IdParams>): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));
    }

    const registrationId = context.params.id;
    if (!registrationId) {
      return createErrorResponse(errors.badRequest('Registration ID is required', requestId));
    }

    const result = await context.env.DB.prepare(`
      DELETE FROM registrations WHERE id = ?
    `).bind(registrationId).run();

    if (!result.success || result.meta.changes === 0) {
      return createErrorResponse(errors.notFound('Registration', requestId));
    }

    return createResponse({
      success: true,
      message: 'Registration deleted successfully'
    });

  } catch (error) {
    console.error(`[${requestId}] Error deleting registration:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}

// Helper: Generate unique reference number
async function generateRefNumber(db: D1Database): Promise<string> {
  const prefix = 'REF';
  const year = new Date().getFullYear().toString().slice(-2);

  // Get the highest existing number
  const { results } = await db.prepare(`
    SELECT ref_number FROM attendees
    WHERE ref_number LIKE ?
    ORDER BY ref_number DESC
    LIMIT 1
  `).bind(`${prefix}${year}%`).all();

  let nextNumber = 1;
  if (results.length > 0) {
    const lastRef = (results[0] as unknown as { ref_number: string }).ref_number;
    const numPart = parseInt(lastRef.slice(5), 10);
    if (!isNaN(numPart)) {
      nextNumber = numPart + 1;
    }
  }

  return `${prefix}${year}${nextNumber.toString().padStart(4, '0')}`;
}

// Helper: Generate temporary password
function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
