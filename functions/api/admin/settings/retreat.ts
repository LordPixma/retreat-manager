// GET/PUT /api/admin/settings/retreat
//
// Read or update the per-year retreat information shown on the login and
// registration pages (name, tagline, scripture, dates, venue, host, pricing).
// PUT accepts any subset of those fields.

import type { PagesContext } from '../../../_shared/types.js';
import { createResponse, checkAdminAuth, handleCORS } from '../../../_shared/auth.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../../_shared/errors.js';
import {
  getRetreatConfig,
  setRetreatConfig,
  STRING_FIELDS,
  PRICE_FIELDS,
  type RetreatConfig,
} from '../../../_shared/retreat-config.js';

const MAX_LENGTHS: Record<string, number> = {
  name: 120,
  tagline: 120,
  scripture: 500,
  dates: 120,
  venue: 160,
  host: 160,
};
const MAX_PRICE = 100000;

export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

export async function onRequestGet(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();
  try {
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));

    const config = await getRetreatConfig(context.env.DB);
    return createResponse(config);
  } catch (error) {
    console.error(`[${requestId}] retreat settings GET error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}

export async function onRequestPut(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();
  try {
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));

    const body = await context.request.json().catch(() => ({})) as Record<string, unknown>;
    const partial: Partial<RetreatConfig> = {};

    for (const f of STRING_FIELDS) {
      if (body[f] === undefined) continue;
      if (typeof body[f] !== 'string') {
        return createErrorResponse(errors.badRequest(`${f} must be text`, requestId));
      }
      const v = (body[f] as string).trim();
      if (v === '') {
        return createErrorResponse(errors.badRequest(`${f} cannot be empty`, requestId));
      }
      if (v.length > (MAX_LENGTHS[f] ?? 200)) {
        return createErrorResponse(errors.badRequest(`${f} is too long (max ${MAX_LENGTHS[f]})`, requestId));
      }
      (partial[f] as string) = v;
    }

    for (const f of PRICE_FIELDS) {
      if (body[f] === undefined) continue;
      const n = Number(body[f]);
      if (!Number.isFinite(n) || n < 0 || n > MAX_PRICE) {
        return createErrorResponse(errors.badRequest(`${f} must be a number between 0 and ${MAX_PRICE}`, requestId));
      }
      (partial[f] as number) = Math.round(n * 100) / 100;
    }

    if (Object.keys(partial).length === 0) {
      return createErrorResponse(errors.badRequest('No valid fields to update', requestId));
    }

    await setRetreatConfig(context.env.DB, partial, admin.user);

    try {
      await context.env.DB.prepare(
        `INSERT INTO audit_log (admin_user, action, entity_type, entity_id, details)
         VALUES (?, 'update_retreat_config', 'settings', 0, ?)`
      ).bind(admin.user, JSON.stringify({ fields: Object.keys(partial) })).run();
    } catch (err) {
      console.warn(`[${requestId}] audit_log write failed`, err);
    }

    const updated = await getRetreatConfig(context.env.DB);
    return createResponse(updated);
  } catch (error) {
    console.error(`[${requestId}] retreat settings PUT error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}
