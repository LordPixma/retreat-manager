// functions/api/admin/attendees/index.js - Updated with standardized auth
import { createResponse, checkAdminAuth, handleCORS, hashPassword } from '../../../_shared/auth.js';

// Handle CORS preflight
export async function onRequestOptions() {
  return handleCORS();
}

// GET /api/admin/attendees - List all attendees
export async function onRequestGet(context) {
  try {
    // Check admin authorization
    const admin = checkAdminAuth(context.request);
    if (!admin) {
      return createResponse({ error: 'Unauthorized' }, 401);
    }
    
    // Query all attendees with room and group information
    const { results } = await context.env.DB.prepare(`
      SELECT 
        a.id,
        a.ref_number,
        a.name,
        a.email,
        a.payment_due,
        a.room_id,
        a.group_id,
        r.number AS room_number,
        g.name AS group_name
      FROM attendees a
      LEFT JOIN rooms r ON a.room_id = r.id
      LEFT JOIN groups g ON a.group_id = g.id
      ORDER BY a.name
    `).all();
    
    // Format the response to match expected structure
    const formattedResults = results.map(attendee => ({
      id: attendee.id,
      ref_number: attendee.ref_number,
      name: attendee.name,
      email: attendee.email,
      payment_due: attendee.payment_due || 0,
      room_id: attendee.room_id,
      group_id: attendee.group_id,
      room: attendee.room_number ? { number: attendee.room_number } : null,
      group: attendee.group_name ? { name: attendee.group_name } : null
    }));
    
    return createResponse(formattedResults);
    
  } catch (error) {
    console.error('Error fetching attendees:', error);
    return createResponse({ error: 'Failed to fetch attendees' }, 500);
  }
}

// POST /api/admin/attendees - Create new attendee
export async function onRequestPost(context) {
  try {
    // Check admin authorization
    const admin = checkAdminAuth(context.request);
    if (!admin) {
      return createResponse({ error: 'Unauthorized' }, 401);
    }
    
    const { name, email, ref_number, password, room_id, group_id, payment_due } = await context.request.json();
    
    // Validate required fields
    if (!name || !name.trim()) {
      return createResponse({ error: 'Name is required' }, 400);
    }
    if (!ref_number || !ref_number.trim()) {
      return createResponse({ error: 'Reference number is required' }, 400);
    }
    if (!password || !password.trim()) {
      return createResponse({ error: 'Password is required' }, 400);
    }
    
    // Check if reference number already exists
    const { results: existing } = await context.env.DB.prepare(`
      SELECT id FROM attendees WHERE ref_number = ?
    `).bind(ref_number.trim()).all();
    
    if (existing.length > 0) {
      return createResponse({ error: 'Reference number already exists' }, 409);
    }
    
    // Hash password using standardized method
    const password_hash = await hashPassword(password);
    console.log('Creating attendee with ref:', ref_number);
    
    // Insert new attendee
    const result = await context.env.DB.prepare(`
      INSERT INTO attendees (name, email, ref_number, password_hash, room_id, group_id, payment_due)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      name.trim(),
      email?.trim() || null,
      ref_number.trim(),
      password_hash,
      room_id || null,
      group_id || null,
      payment_due || 0
    ).run();
    
    if (!result.success) {
      throw new Error('Failed to create attendee');
    }
    
    return createResponse({ 
      id: result.meta.last_row_id,
      message: 'Attendee created successfully'
    }, 201);
    
  } catch (error) {
    console.error('Error creating attendee:', error);
    
    // Handle unique constraint violation
    if (error.message.includes('UNIQUE constraint failed')) {
      return createResponse({ error: 'Reference number already exists' }, 409);
    }
    
    return createResponse({ error: 'Failed to create attendee' }, 500);
  }
}