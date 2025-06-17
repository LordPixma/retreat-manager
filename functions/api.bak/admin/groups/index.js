// functions/api/admin/groups/index.js
import { createResponse, checkAdminAuth, handleCORS } from '../../../_shared/auth.js';

// Handle CORS preflight
export async function onRequestOptions() {
  return handleCORS();
}

// GET /api/admin/groups - List all groups
export async function onRequestGet(context) {
  try {
    // Check admin authorization
    const admin = checkAdminAuth(context.request);
    if (!admin) {
      return createResponse({ error: 'Unauthorized' }, 401);
    }
    
    // Get all groups with member information
    const { results } = await context.env.DB.prepare(`
      SELECT 
        g.id,
        g.name,
        COUNT(a.id) as member_count,
        GROUP_CONCAT(a.name, ', ') as members,
        GROUP_CONCAT(a.ref_number, ', ') as member_refs
      FROM groups g
      LEFT JOIN attendees a ON g.id = a.group_id
      GROUP BY g.id, g.name
      ORDER BY g.name
    `).all();
    
    const formattedGroups = results.map(group => {
      const memberNames = group.members ? group.members.split(', ').filter(Boolean) : [];
      const memberRefs = group.member_refs ? group.member_refs.split(', ').filter(Boolean) : [];
      
      const members = memberNames.map((name, index) => ({
        name,
        ref_number: memberRefs[index] || ''
      }));
      
      return {
        id: group.id,
        name: group.name,
        member_count: group.member_count || 0,
        members
      };
    });
    
    return createResponse(formattedGroups);
    
  } catch (error) {
    console.error('Error fetching groups:', error);
    return createResponse({ error: 'Failed to fetch groups' }, 500);
  }
}

// POST /api/admin/groups - Create new group
export async function onRequestPost(context) {
  try {
    // Check admin authorization
    const admin = checkAdminAuth(context.request);
    if (!admin) {
      return createResponse({ error: 'Unauthorized' }, 401);
    }
    
    const { name } = await context.request.json();
    
    // Validate required fields
    if (!name || !name.trim()) {
      return createResponse({ error: 'Group name is required' }, 400);
    }
    
    // Check if group name already exists
    const { results: existing } = await context.env.DB.prepare(`
      SELECT id FROM groups WHERE name = ?
    `).bind(name.trim()).all();
    
    if (existing.length > 0) {
      return createResponse({ error: 'Group name already exists' }, 409);
    }
    
    // Insert new group
    const result = await context.env.DB.prepare(`
      INSERT INTO groups (name) VALUES (?)
    `).bind(name.trim()).run();
    
    if (!result.success) {
      throw new Error('Failed to create group');
    }
    
    return createResponse({ 
      id: result.meta.last_row_id,
      message: 'Group created successfully'
    }, 201);
    
  } catch (error) {
    console.error('Error creating group:', error);
    return createResponse({ error: 'Failed to create group' }, 500);
  }
}