import type { PagesContext } from '../../../_shared/types.js';
import { createResponse, checkAdminAuth, handleCORS } from '../../../_shared/auth.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../../_shared/errors.js';

export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

// GET /api/admin/payments/summary
export async function onRequestGet(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));
    }

    // Total collected (succeeded payments)
    const { results: collectedRows } = await context.env.DB.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count
      FROM payments WHERE status = 'succeeded'
    `).all();

    // Total outstanding (sum of all attendee payment_due)
    const { results: outstandingRows } = await context.env.DB.prepare(`
      SELECT COALESCE(SUM(payment_due), 0) as total, COUNT(*) as count
      FROM attendees WHERE payment_due > 0
    `).all();

    // By status
    const { results: byStatusRows } = await context.env.DB.prepare(`
      SELECT status, COUNT(*) as count, COALESCE(SUM(amount), 0) as total
      FROM payments GROUP BY status
    `).all();

    // By payment type
    const { results: byTypeRows } = await context.env.DB.prepare(`
      SELECT payment_type, COUNT(*) as count, COALESCE(SUM(amount), 0) as total
      FROM payments WHERE status = 'succeeded' GROUP BY payment_type
    `).all();

    // Active installment schedules
    const { results: installmentRows } = await context.env.DB.prepare(`
      SELECT COUNT(*) as active_count
      FROM installment_schedules WHERE status = 'active'
    `).all();

    const collected = collectedRows[0] as { total: number; count: number };
    const outstanding = outstandingRows[0] as { total: number; count: number };
    const activeInstallments = (installmentRows[0] as { active_count: number }).active_count;

    const byStatus: Record<string, { count: number; total: number }> = {};
    for (const row of byStatusRows as { status: string; count: number; total: number }[]) {
      byStatus[row.status] = { count: row.count, total: row.total };
    }

    const byType: Record<string, { count: number; total: number }> = {};
    for (const row of byTypeRows as { payment_type: string; count: number; total: number }[]) {
      byType[row.payment_type] = { count: row.count, total: row.total };
    }

    return createResponse({
      total_collected_pence: collected.total,
      total_collected_count: collected.count,
      total_outstanding_pounds: outstanding.total,
      outstanding_attendees: outstanding.count,
      active_installment_plans: activeInstallments,
      by_status: byStatus,
      by_type: byType,
    });

  } catch (error) {
    console.error(`[${requestId}] Payment summary error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}
