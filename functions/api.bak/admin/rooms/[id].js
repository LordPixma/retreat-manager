// functions/api/admin/rooms/[id].js
import { createResponse, checkAdminAuth, handleCORS } from '../../../_shared/auth.js';

// Handle CORS preflight
export async function onRequestOptions() {
  return handleCORS();
}

// GET /api/admin/rooms/:id - Get single room
export async function onRequestGet(context) {
  try {
    const admin = checkAdminAuth(context.request);
    if (!admin) {
      return createResponse({ error: 'Unauthorized' }, 401);
    }
    
    const id = context.params.id;
    
    const { results } = await context.env.DB.prepare(`
      SELECT 
        r.id,
        r.number,
        r.description,
        COUNT(a.id) as occupant_count,
        GROUP_CONCAT(a.name, ', ') as occupants
      FROM rooms r
      LEFT JOIN attendees a ON r.id = a.room_id
      WHERE r.id = ?
      GROUP BY r.id, r.number, r.description
    `).bind(id).all();
    
    if (!results.length) {
      return createResponse({ error: 'Room not found' }, 404);
    }
    
    const room = results[0];
    const formattedRoom = {
      id: room.id,
      number: room.number,
      description: room.description || '',
      occupant_count: room.occupant_count || 0,
      occupants: room.occupants ? room.occupants.split(', ').filter(Boolean) : []
    };
    
    return createResponse(formattedRoom);
    
  } catch (error) {
    console.error('Error fetching room:', error);
    return createResponse({ error: 'Failed to fetch room' }, 500);
  }
}

// PUT /api/admin/rooms/:id - Update room
export async function onRequestPut(context) {
  try {
    const admin = checkAdminAuth(context.request);
    if (!admin) {
      return createResponse({ error: 'Unauthorized' }, 401);
    }
    
    const id = context.params.id;
    const { number, description } = await context.request.json();
    
    if (!number || !number.trim()) {
      return createResponse({ error: 'Room number is required' }, 400);
    }
    
    // Check if room exists
    const { results: existing } = await context.env.DB.prepare(`
      SELECT id FROM rooms WHERE id = ?
    `).bind(id).all();
    
    if (!existing.length) {
      return createResponse({ error: 'Room not found' }, 404);
    }
    
    // Check if new number conflicts with another room
    const { results: conflict } = await context.env.DB.prepare(`
      SELECT id FROM rooms WHERE number = ? AND id != ?
    `).bind(number.trim(), id).all();
    
    if (conflict.length > 0) {
      return createResponse({ error: 'Room number already exists' }, 409);
    }
    
    // Update room
    const result = await context.env.DB.prepare(`
      UPDATE rooms SET number = ?, description = ? WHERE id = ?
    `).bind(number.trim(), description?.trim() || null, id).run();
    
    if (!result.success) {
      throw new Error('Failed to update room');
    }
    
    return createResponse({ 
      success: true,
      message: 'Room updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating room:', error);
    return createResponse({ error: 'Failed to update room' }, 500);
  }
}

// DELETE /api/admin/rooms/:id - Delete room
export async function onRequestDelete(context) {
  try {
    const admin = checkAdminAuth(context.request);
    if (!admin) {
      return createResponse({ error: 'Unauthorized' }, 401);
    }
    
    const id = context.params.id;
    
    // Check if room exists
    const { results: existing } = await context.env.DB.prepare(`
      SELECT id, number FROM rooms WHERE id = ?
    `).bind(id).all();
    
    if (!existing.length) {
      return createResponse({ error: 'Room not found' }, 404);
    }
    
    // Check if room has occupants
    const { results: occupants } = await context.env.DB.prepare(`
      SELECT COUNT(*) as count FROM attendees WHERE room_id = ?
    `).bind(id).all();
    
    if (occupants[0].count > 0) {
      return createResponse({ 
        error: 'Cannot delete room with occupants. Please reassign attendees first.'
      }, 409);
    }
    
    // Delete room
    const result = await context.env.DB.prepare(`
      DELETE FROM rooms WHERE id = ?
    `).bind(id).run();
    
    if (!result.success) {
      throw new Error('Failed to delete room');
    }
    
    return createResponse({ 
      success: true,
      message: `Room ${existing[0].number} deleted successfully`
    });
    
  } catch (error) {
    console.error('Error deleting room:', error);
    return createResponse({ error: 'Failed to delete room' }, 500);
  }
}