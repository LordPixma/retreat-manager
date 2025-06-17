// functions/api/admin/groups/[id].js
import { createResponse, checkAdminAuth, handleCORS } from '../../../_shared/auth.js';

// Handle CORS preflight
export async function onRequestOptions() {
  return handleCORS();
}

// GET /api/admin/groups/:id - Get single group
export async function onRequestGet(context) {
  try {
    const admin = checkAdminAuth(context.request);
    if (!admin) {
      return createResponse({ error: 'Unauthorized' }, 401);
    }
    
    const id = context.params.id;
    
    const { results } = await context.env.DB.prepare(`
      SELECT 
        g.id,
        g.name,
        COUNT(a.id) as member_count,
        GROUP_CONCAT(a.name, ', ') as members,
        GROUP_CONCAT(a.ref_number, ', ') as member_refs
      FROM groups g
      LEFT JOIN attendees a ON g.id = a.group_id
      WHERE g.id = ?
      GROUP BY g.id, g.name
    `).bind(id).all();
    
    if (!results.length) {
      return createResponse({ error: 'Group not found' }, 404);
    }
    
    const group = results[0];
    const memberNames = group.members ? group.members.split(', ').filter(Boolean) : [];
    const memberRefs = group.member_refs ? group.member_refs.split(', ').filter(Boolean) : [];
    
    const members = memberNames.map((name, index) => ({
      name,
      ref_number: memberRefs[index] || ''
    }));
    
    const formattedGroup = {
      id: group.id,
      name: group.name,
      member_count: group.member_count || 0,
      members
    };
    
    return createResponse(formattedGroup);
    
  } catch (error) {
    console.error('Error fetching group:', error);
    return createResponse({ error: 'Failed to fetch group' }, 500);
  }
}

// PUT /api/admin/groups/:id - Update group
export async function onRequestPut(context) {
  try {
    const admin = checkAdminAuth(context.request);
    if (!admin) {
      return createResponse({ error: 'Unauthorized' }, 401);
    }
    
    const id = context.params.id;
    const { name } = await context.request.json();
    
    if (!name || !name.trim()) {
      return createResponse({ error: 'Group name is required' }, 400);
    }
    
    // Check if group exists
    const { results: existing } = await context.env.DB.prepare(`
      SELECT id FROM groups WHERE id = ?
    `).bind(id).all();
    
    if (!existing.length) {
      return createResponse({ error: 'Group not found' }, 404);
    }
    
    // Check if new name conflicts with another group
    const { results: conflict } = await context.env.DB.prepare(`
      SELECT id FROM groups WHERE name = ? AND id != ?
    `).bind(name.trim(), id).all();
    
    if (conflict.length > 0) {
      return createResponse({ error: 'Group name already exists' }, 409);
    }
    
    // Update group
    const result = await context.env.DB.prepare(`
      UPDATE groups SET name = ? WHERE id = ?
    `).bind(name.trim(), id).run();
    
    if (!result.success) {
      throw new Error('Failed to update group');
    }
    
    return createResponse({ 
      success: true,
      message: 'Group updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating group:', error);
    return createResponse({ error: 'Failed to update group' }, 500);
  }
}

// DELETE /api/admin/groups/:id - Delete group
export async function onRequestDelete(context) {
  try {
    const admin = checkAdminAuth(context.request);
    if (!admin) {
      return createResponse({ error: 'Unauthorized' }, 401);
    }
    
    const id = context.params.id;
    
    // Check if group exists
    const { results: existing } = await context.env.DB.prepare(`
      SELECT id, name FROM groups WHERE id = ?
    `).bind(id).all();
    
    if (!existing.length) {
      return createResponse({ error: 'Group not found' }, 404);
    }
    
    // Check if group has members
    const { results: members } = await context.env.DB.prepare(`
      SELECT COUNT(*) as count FROM attendees WHERE group_id = ?
    `).bind(id).all();
    
    if (members[0].count > 0) {
      return createResponse({ 
        error: 'Cannot delete group with members. Please reassign attendees first.'
      }, 409);
    }
    
    // Delete group
    const result = await context.env.DB.prepare(`
      DELETE FROM groups WHERE id = ?
    `).bind(id).run();
    
    if (!result.success) {
      throw new Error('Failed to delete group');
    }
    
    return createResponse({ 
      success: true,
      message: `Group ${existing[0].name} deleted successfully`
    });
    
  } catch (error) {
    console.error('Error deleting group:', error);
    return createResponse({ error: 'Failed to delete group' }, 500);
  }
}