// GET /api/family/members
//
// Returns the authenticated attendee's group + full member details
// (contact, dietary, allergies). Any group member can call this so
// they can see basic info; the response includes `editable: boolean`
// per member so the UI knows whether to render edit affordances.
//
// `editable` is true only when the requester is the group's lead.

import type { PagesContext } from '../../../_shared/types.js';
import { createResponse, checkAttendeeAuth, handleCORS } from '../../../_shared/auth.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../../_shared/errors.js';

interface MeRow {
  id: number;
  group_id: number | null;
  is_group_lead: number;
}

interface MemberDetailRow {
  id: number;
  ref_number: string;
  name: string;
  first_name: string | null;
  last_name: string | null;
  preferred_name: string | null;
  date_of_birth: string | null;
  email: string | null;
  phone: string | null;
  emergency_contact: string | null;
  postal_address: string | null;
  dietary_requirements: string | null;
  medical_conditions: string | null;
  accessibility_needs: string | null;
  special_requests: string | null;
  tshirt_size: string | null;
  arrival_method: string | null;
  vehicle_registration: string | null;
  payment_due: number;
  payment_status: string;
  is_group_lead: number;
}

export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

export async function onRequestGet(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();
  try {
    const auth = await checkAttendeeAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!auth) return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));

    const { results: meRows } = await context.env.DB.prepare(
      'SELECT id, group_id, COALESCE(is_group_lead, 0) AS is_group_lead FROM attendees WHERE ref_number = ?',
    ).bind(auth.ref).all();
    if (!meRows.length) return createErrorResponse(errors.notFound('Attendee', requestId));
    const me = meRows[0] as unknown as MeRow;

    if (me.group_id === null) {
      return createResponse({ group: null, members: [], is_lead: false });
    }

    const { results: gRows } = await context.env.DB.prepare(
      'SELECT id, name FROM groups WHERE id = ?',
    ).bind(me.group_id).all();
    if (!gRows.length) return createResponse({ group: null, members: [], is_lead: false });
    const group = gRows[0] as { id: number; name: string };

    const isLead = me.is_group_lead === 1;

    const { results: memberRows } = await context.env.DB.prepare(`
      SELECT
        id, ref_number, name, first_name, last_name, preferred_name, date_of_birth,
        email, phone, emergency_contact, postal_address,
        dietary_requirements, medical_conditions, accessibility_needs, special_requests,
        tshirt_size, arrival_method, vehicle_registration,
        payment_due, payment_status,
        COALESCE(is_group_lead, 0) AS is_group_lead
      FROM attendees
      WHERE group_id = ?
        AND (is_archived = 0 OR is_archived IS NULL)
      ORDER BY (id = ?) DESC, name
    `).bind(me.group_id, me.id).all();

    const members = (memberRows as unknown as MemberDetailRow[]).map((m) => ({
      id: m.id,
      ref_number: m.ref_number,
      name: m.name,
      first_name: m.first_name,
      last_name: m.last_name,
      preferred_name: m.preferred_name,
      date_of_birth: m.date_of_birth,
      email: m.email,
      phone: m.phone,
      emergency_contact: m.emergency_contact,
      postal_address: m.postal_address,
      dietary_requirements: m.dietary_requirements,
      medical_conditions: m.medical_conditions,
      accessibility_needs: m.accessibility_needs,
      special_requests: m.special_requests,
      tshirt_size: m.tshirt_size,
      arrival_method: m.arrival_method,
      vehicle_registration: m.vehicle_registration,
      payment_due: m.payment_due || 0,
      payment_status: m.payment_status,
      is_group_lead: m.is_group_lead === 1,
      is_self: m.id === me.id,
      // Self can always edit own profile via /api/attendee/profile.
      // Other members are editable only if requester is lead.
      editable: m.id === me.id || isLead,
    }));

    return createResponse({ group, members, is_lead: isLead });
  } catch (error) {
    console.error(`[${requestId}] family members list error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}
