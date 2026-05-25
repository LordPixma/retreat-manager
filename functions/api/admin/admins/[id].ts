// PUT    /api/admin/admins/:id — update name/email/role/is_active.
//                                Role / is_active changes require super-admin.
//                                Name/email may be edited by the admin themselves.
// DELETE /api/admin/admins/:id — soft-delete by setting is_active = 0
//                                (super-admin only).
//
// Safety rules baked in:
//   * The last active super-admin cannot be demoted or deactivated.
//   * An admin cannot deactivate their own account (use a different super
//     to do that — prevents accidental lockout).

import type { AdminRole, PagesContext } from '../../../_shared/types.js';
import {
  createResponse,
  checkAdminAuth,
  requireSuperAdmin,
  handleCORS,
} from '../../../_shared/auth.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../../_shared/errors.js';

interface IdParams { id: string; }
interface AdminRow {
  id: number;
  username: string;
  role: AdminRole;
  full_name: string | null;
  email: string | null;
  is_active: number;
}

const VALID_ROLES: AdminRole[] = ['admin', 'super_admin'];

export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

export async function onRequestPut(context: PagesContext<IdParams>): Promise<Response> {
  const requestId = generateRequestId();
  try {
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));

    const id = parseInt(context.params.id, 10);
    if (!id) return createErrorResponse(errors.badRequest('Admin id required', requestId));

    const body = await context.request.json() as {
      full_name?: string;
      email?: string;
      role?: string;
      is_active?: boolean | number;
    };

    const target = await loadAdmin(context, id);
    if (!target) return createErrorResponse(errors.notFound('Admin', requestId));

    // Non-super-admins can only edit themselves and only the safe fields
    // (name / email). Role and is_active changes require super-admin.
    const isSelf = admin.admin_id === id;
    const isSuper = admin.role === 'super_admin';
    const wantsRoleChange = body.role !== undefined && body.role !== target.role;
    const wantsActiveChange = body.is_active !== undefined && Number(!!body.is_active) !== target.is_active;

    if ((wantsRoleChange || wantsActiveChange) && !isSuper) {
      return createErrorResponse(errors.forbidden('Super-admin role required for role / activation changes', requestId));
    }
    if (!isSelf && !isSuper) {
      return createErrorResponse(errors.forbidden('You can only edit your own profile', requestId));
    }
    if (wantsActiveChange && isSelf && !body.is_active) {
      return createErrorResponse(errors.badRequest('You cannot deactivate your own account', requestId));
    }
    if (wantsRoleChange && !VALID_ROLES.includes(body.role as AdminRole)) {
      return createErrorResponse(errors.badRequest('Invalid role', requestId));
    }
    // Prevent removing the last active super-admin.
    if ((wantsRoleChange && body.role !== 'super_admin' && target.role === 'super_admin')
        || (wantsActiveChange && !body.is_active && target.role === 'super_admin')) {
      const lastSuper = await isLastActiveSuperAdmin(context, id);
      if (lastSuper) return createErrorResponse(errors.badRequest('Cannot demote or deactivate the last active super-admin', requestId));
    }

    const fields: string[] = [];
    const values: (string | number | null)[] = [];
    if (body.full_name !== undefined) { fields.push('full_name = ?'); values.push(body.full_name?.trim() || null); }
    if (body.email !== undefined) { fields.push('email = ?'); values.push(body.email?.trim() || null); }
    if (wantsRoleChange && isSuper) { fields.push('role = ?'); values.push(body.role!); }
    if (wantsActiveChange && isSuper) { fields.push('is_active = ?'); values.push(body.is_active ? 1 : 0); }

    if (fields.length === 0) return createErrorResponse(errors.badRequest('No valid fields to update', requestId));

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    await context.env.DB.prepare(
      `UPDATE admins SET ${fields.join(', ')} WHERE id = ?`
    ).bind(...values).run();

    try {
      await context.env.DB.prepare(
        `INSERT INTO audit_log (admin_user, action, entity_type, entity_id, details)
         VALUES (?, 'admin_update', 'admin', ?, ?)`
      ).bind(admin.user, id, JSON.stringify({ fields })).run();
    } catch (err) {
      console.warn(`[${requestId}] audit_log write failed`, err);
    }

    return createResponse({ success: true, id });
  } catch (error) {
    console.error(`[${requestId}] admins update error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}

export async function onRequestDelete(context: PagesContext<IdParams>): Promise<Response> {
  const requestId = generateRequestId();
  try {
    const admin = await requireSuperAdmin(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) return createErrorResponse(errors.forbidden('Super-admin role required', requestId));

    const id = parseInt(context.params.id, 10);
    if (!id) return createErrorResponse(errors.badRequest('Admin id required', requestId));
    if (admin.admin_id === id) {
      return createErrorResponse(errors.badRequest('You cannot deactivate your own account', requestId));
    }

    const target = await loadAdmin(context, id);
    if (!target) return createErrorResponse(errors.notFound('Admin', requestId));

    if (target.role === 'super_admin' && await isLastActiveSuperAdmin(context, id)) {
      return createErrorResponse(errors.badRequest('Cannot deactivate the last active super-admin', requestId));
    }

    await context.env.DB.prepare(
      `UPDATE admins SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).bind(id).run();

    try {
      await context.env.DB.prepare(
        `INSERT INTO audit_log (admin_user, action, entity_type, entity_id, details)
         VALUES (?, 'admin_deactivate', 'admin', ?, ?)`
      ).bind(admin.user, id, JSON.stringify({ username: target.username })).run();
    } catch (err) {
      console.warn(`[${requestId}] audit_log write failed`, err);
    }

    return createResponse({ success: true, message: `Admin ${target.username} deactivated` });
  } catch (error) {
    console.error(`[${requestId}] admins delete error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}

async function loadAdmin(context: PagesContext<IdParams>, id: number): Promise<AdminRow | null> {
  const { results } = await context.env.DB.prepare(
    `SELECT id, username, role, full_name, email, is_active FROM admins WHERE id = ?`
  ).bind(id).all();
  if (!results.length) return null;
  return results[0] as unknown as AdminRow;
}

async function isLastActiveSuperAdmin(context: PagesContext<IdParams>, excludingId: number): Promise<boolean> {
  const { results } = await context.env.DB.prepare(
    `SELECT COUNT(*) AS n FROM admins WHERE role = 'super_admin' AND is_active = 1 AND id != ?`
  ).bind(excludingId).all();
  const count = (results[0] as { n: number }).n;
  return count === 0;
}
