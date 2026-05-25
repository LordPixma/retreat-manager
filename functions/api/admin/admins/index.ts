// GET  /api/admin/admins — list all admins (any admin can view).
// POST /api/admin/admins — create a new admin (super-admin only).
//
// The created admin gets a temp password the caller supplies, and is
// flagged must_reset_password so their first login forces a password
// change via /api/change-password (existing legacy-reset machinery).

import type { PagesContext, AdminRole } from '../../../_shared/types.js';
import {
  createResponse,
  checkAdminAuth,
  requireSuperAdmin,
  handleCORS,
  hashPassword,
} from '../../../_shared/auth.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../../_shared/errors.js';

const MIN_PASSWORD_LENGTH = 8;
const VALID_ROLES: AdminRole[] = ['admin', 'super_admin'];

export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

export async function onRequestGet(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();
  try {
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));

    const { results } = await context.env.DB.prepare(
      `SELECT id, username, role, full_name, email, is_active, must_reset_password, last_login, created_at
       FROM admins ORDER BY (role = 'super_admin') DESC, username`
    ).all();

    return createResponse({ admins: results, count: results.length });
  } catch (error) {
    console.error(`[${requestId}] admins list error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}

export async function onRequestPost(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();
  try {
    const admin = await requireSuperAdmin(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) return createErrorResponse(errors.forbidden('Super-admin role required', requestId));

    const body = await context.request.json() as {
      username?: string;
      password?: string;
      role?: string;
      full_name?: string;
      email?: string;
    };

    const username = body.username?.trim();
    const password = body.password ?? '';
    const role = (body.role as AdminRole) || 'admin';
    const full_name = body.full_name?.trim() || username;
    const email = body.email?.trim() || null;

    if (!username) return createErrorResponse(errors.badRequest('username is required', requestId));
    if (!VALID_ROLES.includes(role)) return createErrorResponse(errors.badRequest('Invalid role', requestId));
    if (!password || password.length < MIN_PASSWORD_LENGTH) {
      return createErrorResponse(errors.badRequest(`Initial password must be at least ${MIN_PASSWORD_LENGTH} characters`, requestId));
    }

    const { results: dupe } = await context.env.DB.prepare('SELECT id FROM admins WHERE username = ?').bind(username).all();
    if (dupe.length) return createErrorResponse(errors.conflict('An admin with that username already exists', requestId));

    const hash = await hashPassword(password);
    const result = await context.env.DB.prepare(
      `INSERT INTO admins (username, password_hash, role, full_name, email, is_active, must_reset_password, created_by)
       VALUES (?, ?, ?, ?, ?, 1, 1, ?)`
    ).bind(username, hash, role, full_name, email, admin.admin_id).run();

    const newId = result.meta.last_row_id;

    try {
      await context.env.DB.prepare(
        `INSERT INTO audit_log (admin_user, action, entity_type, entity_id, details)
         VALUES (?, 'admin_create', 'admin', ?, ?)`
      ).bind(admin.user, newId, JSON.stringify({ username, role, full_name })).run();
    } catch (err) {
      console.warn(`[${requestId}] audit_log write failed`, err);
    }

    return createResponse({
      id: newId,
      username,
      role,
      full_name,
      email,
      is_active: 1,
      must_reset_password: 1,
      message: `Admin ${username} created — they will be forced to reset password on first login.`,
    }, 201);
  } catch (error) {
    console.error(`[${requestId}] admins create error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}
