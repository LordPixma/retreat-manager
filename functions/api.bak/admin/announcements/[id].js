// functions/api/admin/announcements/[id].js
import { createResponse, checkAdminAuth, handleCORS } from '../../../_shared/auth.js';

// Handle CORS preflight
export async function onRequestOptions() {
  return handleCORS();
}

// GET /api/admin/announcements/:id - Get single announcement
export async function onRequestGet(context) {
  try {
    const admin = checkAdminAuth(context.request);
    if (!admin) {
      return createResponse({ error: 'Unauthorized' }, 401);
    }
    
    const id = context.params.id;
    
    const { results } = await context.env.DB.prepare(`
      SELECT * FROM announcements WHERE id = ?
    `).bind(id).all();
    
    if (!results.length) {
      return createResponse({ error: 'Announcement not found' }, 404);
    }
    
    const announcement = results[0];
    return createResponse({
      ...announcement,
      is_active: Boolean(announcement.is_active),
      target_groups: announcement.target_groups ? JSON.parse(announcement.target_groups) : null
    });
    
  } catch (error) {
    console.error('Error fetching announcement:', error);
    return createResponse({ error: 'Failed to fetch announcement' }, 500);
  }
}

// PUT /api/admin/announcements/:id - Update announcement
export async function onRequestPut(context) {
  try {
    const admin = checkAdminAuth(context.request);
    if (!admin) {
      return createResponse({ error: 'Unauthorized' }, 401);
    }
    
    const id = context.params.id;
    const updateData = await context.request.json();
    
    // Check if announcement exists
    const { results: existing } = await context.env.DB.prepare(
      'SELECT id FROM announcements WHERE id = ?'
    ).bind(id).all();
    
    if (!existing.length) {
      return createResponse({ error: 'Announcement not found' }, 404);
    }
    
    // Build dynamic UPDATE query
    const allowedFields = [
      'title', 'content', 'type', 'priority', 'is_active', 
      'target_audience', 'target_groups', 'starts_at', 'expires_at'
    ];
    const updateFields = [];
    const updateValues = [];
    
    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        if (key === 'target_groups' && Array.isArray(value)) {
          updateFields.push(`${key} = ?`);
          updateValues.push(JSON.stringify(value));
        } else if (key === 'is_active') {
          updateFields.push(`${key} = ?`);
          updateValues.push(value ? 1 : 0);
        } else {
          updateFields.push(`${key} = ?`);
          updateValues.push(value === '' ? null : value);
        }
      }
    }
    
    if (updateFields.length === 0) {
      return createResponse({ error: 'No valid fields to update' }, 400);
    }
    
    // Add the ID as the last parameter
    updateValues.push(id);
    
    // Execute the update
    const updateQuery = `UPDATE announcements SET ${updateFields.join(', ')} WHERE id = ?`;
    const result = await context.env.DB.prepare(updateQuery).bind(...updateValues).run();
    
    if (!result.success) {
      throw new Error('Failed to update announcement');
    }
    
    return createResponse({ 
      success: true,
      message: 'Announcement updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating announcement:', error);
    return createResponse({ error: 'Failed to update announcement' }, 500);
  }
}

// DELETE /api/admin/announcements/:id - Delete announcement
export async function onRequestDelete(context) {
  try {
    const admin = checkAdminAuth(context.request);
    if (!admin) {
      return createResponse({ error: 'Unauthorized' }, 401);
    }
    
    const id = context.params.id;
    
    // Check if announcement exists
    const { results: existing } = await context.env.DB.prepare(
      'SELECT id, title FROM announcements WHERE id = ?'
    ).bind(id).all();
    
    if (!existing.length) {
      return createResponse({ error: 'Announcement not found' }, 404);
    }
    
    const announcement = existing[0];
    
    // Delete the announcement
    const result = await context.env.DB.prepare(
      'DELETE FROM announcements WHERE id = ?'
    ).bind(id).run();
    
    if (!result.success) {
      throw new Error('Failed to delete announcement');
    }
    
    return createResponse({ 
      success: true,
      message: `Announcement "${announcement.title}" deleted successfully`
    });
    
  } catch (error) {
    console.error('Error deleting announcement:', error);
    return createResponse({ error: 'Failed to delete announcement' }, 500);
  }
}