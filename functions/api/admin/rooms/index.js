// functions/api/admin/rooms/index.js
import { createResponse, checkAdminAuth, handleCORS } from '../../../_shared/auth.js';

// Handle CORS preflight
export async function onRequestOptions() {
  return handleCORS();
}

// GET /api/admin/rooms - List all rooms
export async function onRequestGet(context) {
  try {
    // Check admin authorization
    const admin = checkAdminAuth(context.request);
    if (!admin) {
      return createResponse({ error: 'Unauthorized' }, 401);
    }
    
    // Get all rooms with occupancy information
    const { results } = await context.env.DB.prepare(`
      SELECT 
        r.id,
        r.number,
        r.description,
        COUNT(a.id) as occupant_count,
        GROUP_CONCAT(a.name, ', ') as occupants
      FROM rooms r
      LEFT JOIN attendees a ON r.id = a.room_id
      GROUP BY r.id, r.number, r.description
      ORDER BY r.number
    `).all();
    
    const formattedRooms = results.map(room => ({
      id: room.id,
      number: room.number,
      description: room.description || '',
      occupant_count: room.occupant_count || 0,
      occupants: room.occupants ? room.occupants.split(', ').filter(Boolean) : []
    }));
    
    return createResponse(formattedRooms);
    
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return createResponse({ error: 'Failed to fetch rooms' }, 500);
  }
}

// POST /api/admin/rooms - Create new room
export async function onRequestPost(context) {
  try {
    // Check admin authorization
    const admin = checkAdminAuth(context.request);
    if (!admin) {
      return createResponse({ error: 'Unauthorized' }, 401);
    }
    
    const { number, description } = await context.request.json();
    
    // Validate required fields
    if (!number || !number.trim()) {
      return createResponse({ error: 'Room number is required' }, 400);
    }
    
    // Check if room number already exists
    const { results: existing } = await context.env.DB.prepare(`
      SELECT id FROM rooms WHERE number = ?
    `).bind(number.trim()).all();
    
    if (existing.length > 0) {
      return createResponse({ error: 'Room number already exists' }, 409);
    }
    
    // Insert new room
    const result = await context.env.DB.prepare(`
      INSERT INTO rooms (number, description)
      VALUES (?, ?)
    `).bind(number.trim(), description?.trim() || null).run();
    
    if (!result.success) {
      throw new Error('Failed to create room');
    }
    
    return createResponse({ 
      id: result.meta.last_row_id,
      message: 'Room created successfully'
    }, 201);
    
  } catch (error) {
    console.error('Error creating room:', error);
    return createResponse({ error: 'Failed to create room' }, 500);
  }
}