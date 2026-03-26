// Analytics report endpoint — aggregated retreat statistics
// GET /api/admin/reports/analytics

import type { PagesContext } from '../../../_shared/types.js';
import { createResponse, checkAdminAuth, handleCORS } from '../../../_shared/auth.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../../_shared/errors.js';

interface CountRow { count: number }
interface SumRow { total: number }
interface GroupedCount { label: string; count: number }

export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

export async function onRequestGet(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));
    }

    const db = context.env.DB;

    // Run all queries in parallel
    const [
      totalAttendeesRes,
      paymentPlanRes,
      paymentStatusRes,
      roomTypeRes,
      groupRes,
      dietaryRes,
      registrationsRes,
      revenueRes,
      checkedInRes,
      registrationsByMonthRes,
    ] = await Promise.all([
      // Total attendees (non-archived)
      db.prepare('SELECT COUNT(*) as count FROM attendees WHERE is_archived = 0 OR is_archived IS NULL').all(),

      // By payment plan
      db.prepare(`
        SELECT COALESCE(payment_option, 'unknown') as label, COUNT(*) as count
        FROM attendees WHERE is_archived = 0 OR is_archived IS NULL
        GROUP BY payment_option ORDER BY count DESC
      `).all(),

      // By payment status
      db.prepare(`
        SELECT CASE WHEN payment_due = 0 THEN 'paid' ELSE 'outstanding' END as label, COUNT(*) as count
        FROM attendees WHERE is_archived = 0 OR is_archived IS NULL
        GROUP BY label ORDER BY count DESC
      `).all(),

      // By room type (attendees assigned to rooms)
      db.prepare(`
        SELECT COALESCE(r.room_type, 'unassigned') as label, COUNT(*) as count
        FROM attendees a LEFT JOIN rooms r ON a.room_id = r.id
        WHERE a.is_archived = 0 OR a.is_archived IS NULL
        GROUP BY label ORDER BY count DESC
      `).all(),

      // By group
      db.prepare(`
        SELECT COALESCE(g.name, 'Unassigned') as label, COUNT(*) as count
        FROM attendees a LEFT JOIN groups g ON a.group_id = g.id
        WHERE a.is_archived = 0 OR a.is_archived IS NULL
        GROUP BY label ORDER BY count DESC
      `).all(),

      // Dietary requirements (non-null, non-empty)
      db.prepare(`
        SELECT dietary_requirements as label, COUNT(*) as count
        FROM attendees
        WHERE (is_archived = 0 OR is_archived IS NULL)
          AND dietary_requirements IS NOT NULL AND dietary_requirements != ''
        GROUP BY dietary_requirements ORDER BY count DESC
      `).all(),

      // All registrations with family_members JSON
      db.prepare(`
        SELECT family_members, total_amount, member_count, status, payment_option
        FROM registrations
      `).all(),

      // Revenue: total expected vs collected
      db.prepare(`
        SELECT
          COALESCE(SUM(payment_due), 0) as outstanding,
          COUNT(*) as attendee_count
        FROM attendees WHERE is_archived = 0 OR is_archived IS NULL
      `).all(),

      // Checked-in count
      db.prepare(`
        SELECT COUNT(*) as count FROM attendees
        WHERE (is_archived = 0 OR is_archived IS NULL) AND checked_in = 1
      `).all(),

      // Registrations by month
      db.prepare(`
        SELECT strftime('%Y-%m', submitted_at) as label, COUNT(*) as count
        FROM registrations
        GROUP BY label ORDER BY label
      `).all(),
    ]);

    const totalAttendees = (totalAttendeesRes.results[0] as unknown as CountRow).count;
    const checkedIn = (checkedInRes.results[0] as unknown as CountRow).count;

    // Parse family member data from registrations to count adults/children/infants
    const registrations = registrationsRes.results as unknown as Array<{
      family_members: string | null;
      total_amount: number | null;
      member_count: number | null;
      status: string;
      payment_option: string | null;
    }>;

    let totalAdults = 0;
    let totalChildren = 0;
    let totalInfants = 0;
    let totalPeople = 0;

    const approvedRegistrations = registrations.filter(r => r.status === 'approved');
    for (const reg of approvedRegistrations) {
      if (reg.family_members) {
        try {
          const members = JSON.parse(reg.family_members) as Array<{ member_type: string }>;
          for (const m of members) {
            if (m.member_type === 'adult') totalAdults++;
            else if (m.member_type === 'child') totalChildren++;
            else if (m.member_type === 'infant') totalInfants++;
          }
          totalPeople += members.length;
        } catch {
          // Skip malformed JSON
        }
      }
    }

    // Registration status breakdown
    const regStatusMap: Record<string, number> = {};
    for (const reg of registrations) {
      regStatusMap[reg.status] = (regStatusMap[reg.status] || 0) + 1;
    }

    const revenueData = revenueRes.results[0] as unknown as { outstanding: number; attendee_count: number };

    // Collected from payments table
    const collectedRes = await db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'succeeded'
    `).all();
    const totalCollectedPence = (collectedRes.results[0] as unknown as SumRow).total;

    return createResponse({
      summary: {
        total_attendees: totalAttendees,
        checked_in: checkedIn,
        total_people: totalPeople,
        adults: totalAdults,
        children: totalChildren,
        infants: totalInfants,
      },
      financial: {
        total_collected_pence: totalCollectedPence,
        total_outstanding_pounds: revenueData.outstanding,
        attendees_with_balance: revenueData.attendee_count,
      },
      registrations: {
        by_status: regStatusMap,
        by_month: (registrationsByMonthRes.results as unknown as GroupedCount[]).map(r => ({
          month: r.label,
          count: r.count,
        })),
        total: registrations.length,
      },
      breakdowns: {
        by_payment_plan: (paymentPlanRes.results as unknown as GroupedCount[]).map(r => ({
          label: r.label,
          count: r.count,
        })),
        by_payment_status: (paymentStatusRes.results as unknown as GroupedCount[]).map(r => ({
          label: r.label,
          count: r.count,
        })),
        by_room_type: (roomTypeRes.results as unknown as GroupedCount[]).map(r => ({
          label: r.label,
          count: r.count,
        })),
        by_group: (groupRes.results as unknown as GroupedCount[]).map(r => ({
          label: r.label,
          count: r.count,
        })),
        dietary_requirements: (dietaryRes.results as unknown as GroupedCount[]).map(r => ({
          label: r.label,
          count: r.count,
        })),
      },
    });

  } catch (error) {
    console.error(`[${requestId}] Analytics error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}
