import type { PagesContext } from '../../_shared/types.js';
import { checkAdminAuth, handleCORS } from '../../_shared/auth.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../_shared/errors.js';
import { splitFullName, ageFromDateOfBirth } from '../../_shared/names.js';
import { csvCell } from '../../_shared/sanitize.js';

// Hard cap on rows returned from a single export. D1 has its own row limits,
// and walking everything in one query is fine for the foreseeable retreat
// size (low thousands). If the cap is hit we still return the partial CSV
// rather than erroring — the admin can at least process what came back.
const EXPORT_ROW_CAP = 10_000;

function row(values: unknown[]): string {
  return values.map(v => csvCell(v ?? '')).join(',') + '\n';
}

export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

// GET /api/admin/export?type=attendees|attendees-basic|payments|registrations
export async function onRequestGet(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));

    const url = new URL(context.request.url);
    const type = url.searchParams.get('type') || 'attendees';

    let csv = '';
    let filename = '';

    if (type === 'attendees') {
      const { results } = await context.env.DB.prepare(`
        SELECT a.ref_number, a.name, a.email, a.phone, a.payment_due, a.payment_status,
               a.payment_option, a.dietary_requirements, a.special_requests, a.checked_in,
               r.number AS room, g.name AS group_name, a.created_at
        FROM attendees a
        LEFT JOIN rooms r ON a.room_id = r.id
        LEFT JOIN groups g ON a.group_id = g.id
        WHERE a.is_archived = 0 OR a.is_archived IS NULL
        ORDER BY a.name
        LIMIT ?
      `).bind(EXPORT_ROW_CAP).all();

      csv = 'Reference,Name,Email,Phone,Payment Due,Payment Status,Payment Plan,Dietary,Special Requests,Checked In,Room,Group,Registered\n';
      for (const r of results as Record<string, unknown>[]) {
        csv += row([
          r.ref_number, r.name, r.email, r.phone, r.payment_due, r.payment_status,
          r.payment_option, r.dietary_requirements, r.special_requests,
          r.checked_in ? 'Yes' : 'No', r.room, r.group_name, r.created_at
        ]);
      }
      filename = `attendees-${new Date().toISOString().split('T')[0]}.csv`;

    } else if (type === 'attendees-checkin') {
      // Health & safety roster: who's on-site, where they are, and how to
      // reach next of kin. Designed for printed handover at a fire-warden's
      // station.
      const { results } = await context.env.DB.prepare(`
        SELECT a.ref_number, a.name, a.phone, a.emergency_contact,
               COALESCE(a.checked_in, 0) AS checked_in, a.checked_in_at,
               r.number AS room, g.name AS group_name, a.dietary_requirements
        FROM attendees a
        LEFT JOIN rooms r ON a.room_id = r.id
        LEFT JOIN groups g ON a.group_id = g.id
        WHERE a.is_archived = 0 OR a.is_archived IS NULL
        ORDER BY checked_in DESC, a.name
        LIMIT ?
      `).bind(EXPORT_ROW_CAP).all();

      csv = 'Reference,Name,Phone,Emergency Contact,Status,Checked In At,Room,Group,Dietary\n';
      for (const r of results as Record<string, unknown>[]) {
        csv += row([
          r.ref_number, r.name, r.phone, r.emergency_contact,
          r.checked_in ? 'CHECKED IN' : 'Not yet',
          r.checked_in_at, r.room, r.group_name, r.dietary_requirements,
        ]);
      }
      filename = `attendees-checkin-${new Date().toISOString().split('T')[0]}.csv`;

    } else if (type === 'attendees-basic') {
      const { results } = await context.env.DB.prepare(`
        SELECT first_name, last_name, name, date_of_birth
        FROM attendees
        WHERE is_archived = 0 OR is_archived IS NULL
        ORDER BY last_name, first_name, name
        LIMIT ?
      `).bind(EXPORT_ROW_CAP).all();

      csv = 'First Name,Last Name,Age\n';
      for (const r of results as Record<string, unknown>[]) {
        // Prefer the dedicated columns; fall back to splitting `name` for any
        // legacy rows the migration backfill missed.
        let first = (r.first_name as string | null) ?? null;
        let last = (r.last_name as string | null) ?? null;
        if (!first && !last) {
          const split = splitFullName(r.name as string | null);
          first = split.first;
          last = split.last;
        }
        const age = ageFromDateOfBirth(r.date_of_birth as string | null);
        csv += row([first, last, age]);
      }
      filename = `attendees-basic-${new Date().toISOString().split('T')[0]}.csv`;

    } else if (type === 'payments') {
      const { results } = await context.env.DB.prepare(`
        SELECT p.id, a.ref_number, a.name, p.amount, p.currency, p.status, p.payment_type,
               p.installment_number, p.installment_total, p.description, p.paid_at, p.created_at,
               CASE WHEN p.stripe_checkout_session_id IS NOT NULL THEN 'Card' ELSE 'Bank Transfer' END as method
        FROM payments p LEFT JOIN attendees a ON p.attendee_id = a.id
        ORDER BY p.created_at DESC
        LIMIT ?
      `).bind(EXPORT_ROW_CAP).all();

      csv = 'ID,Reference,Name,Amount (£),Status,Type,Installment,Method,Paid At,Created\n';
      for (const r of results as Record<string, unknown>[]) {
        const amount = ((r.amount as number) / 100).toFixed(2);
        const inst = r.installment_number ? `${r.installment_number}/${r.installment_total}` : '';
        csv += row([r.id, r.ref_number, r.name, amount, r.status, r.payment_type, inst, r.method, r.paid_at, r.created_at]);
      }
      filename = `payments-${new Date().toISOString().split('T')[0]}.csv`;

    } else if (type === 'registrations') {
      const { results } = await context.env.DB.prepare(`
        SELECT id, name, email, phone, status, payment_option, total_amount, member_count, submitted_at, reviewed_at
        FROM registrations
        ORDER BY submitted_at DESC
        LIMIT ?
      `).bind(EXPORT_ROW_CAP).all();

      csv = 'ID,Name,Email,Phone,Status,Payment Option,Total,Members,Submitted,Reviewed\n';
      for (const r of results as Record<string, unknown>[]) {
        csv += row([r.id, r.name, r.email, r.phone, r.status, r.payment_option, r.total_amount, r.member_count, r.submitted_at, r.reviewed_at]);
      }
      filename = `registrations-${new Date().toISOString().split('T')[0]}.csv`;
    } else {
      return createErrorResponse(errors.badRequest('Invalid export type', requestId));
    }

    // Best-effort audit log — exports are bulk PII reads worth recording.
    try {
      await context.env.DB.prepare(
        `INSERT INTO audit_log (admin_user, action, entity_type, entity_id, details)
         VALUES (?, 'export', ?, 0, ?)`
      ).bind(admin.user, type, JSON.stringify({ requestId, filename })).run();
    } catch (err) {
      console.warn(`[${requestId}] audit_log write failed`, err);
    }

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error(`[${requestId}] Export error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}
