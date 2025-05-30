// functions/api/me.js - Updated attendee profile endpoint
import { createResponse, checkAttendeeAuth, handleCORS } from '../_shared/auth.js';

// Handle CORS preflight
export async function onRequestOptions() {
  return handleCORS();
}

export async function onRequestGet(context) {
  try {
    const attendee = checkAttendeeAuth(context.request);
    if (!attendee) {
      return createResponse({ error: 'Unauthorized' }, 401);
    }
    
    const ref = attendee.ref;
    
    // Query attendee data with joins
    const { results } = await context.env.DB.prepare(`
      SELECT 
        a.name, 
        a.email,
        a.payment_due,
        r.number AS room_number, 
        r.description AS room_description,
        g.name AS group_name,
        a.group_id
      FROM attendees a
      LEFT JOIN rooms r ON a.room_id = r.id
      LEFT JOIN groups g ON a.group_id = g.id
      WHERE a.ref_number = ?
    `).bind(ref).all();
    
    if (!results.length) {
      return createResponse({ error: 'Attendee not found' }, 404);
    }
    
    const attendeeData = results[0];
    
    // Get group members if attendee is in a group
    let members = [];
    if (attendeeData.group_id) {
      const { results: memberResults } = await context.env.DB.prepare(`
        SELECT name, ref_number 
        FROM attendees 
        WHERE group_id = ? AND ref_number != ?
        ORDER BY name
      `).bind(attendeeData.group_id, ref).all();
      members = memberResults;
    }
    
    // Format response
    const response = {
      name: attendeeData.name,
      email: attendeeData.email,
      payment_due: attendeeData.payment_due || 0,
      room: attendeeData.room_number ? {
        number: attendeeData.room_number,
        description: attendeeData.room_description || ''
      } : null,
      group: attendeeData.group_name ? {
        name: attendeeData.group_name,
        members: members
      } : null
    };
    
    return createResponse(response);
    
  } catch (error) {
    console.error('Error in /api/me:', error);
    return createResponse({ error: 'Internal server error' }, 500);
  }
}