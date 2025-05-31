// functions/api/admin/announcements/index.js
import { createResponse, checkAdminAuth, handleCORS } from '../../../_shared/auth.js';

// Handle CORS preflight
export async function onRequestOptions() {
  return handleCORS();
}

// GET /api/admin/announcements - List all announcements
export async function onRequestGet(context) {
  try {
    // Check admin authorization
    const admin = checkAdminAuth(context.request);
    if (!admin) {
      return createResponse({ error: 'Unauthorized' }, 401);
    }
    
    // Get all announcements
    const { results } = await context.env.DB.prepare(`
      SELECT 
        id,
        title,
        content,
        type,
        priority,
        is_active,
        target_audience,
        target_groups,
        author_name,
        starts_at,
        expires_at,
        created_at,
        updated_at
      FROM announcements
      ORDER BY priority DESC, created_at DESC
    `).all();
    
    // Format results
    const formattedAnnouncements = results.map(announcement => ({
      ...announcement,
      is_active: Boolean(announcement.is_active),
      target_groups: announcement.target_groups ? JSON.parse(announcement.target_groups) : null
    }));
    
    return createResponse(formattedAnnouncements);
    
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return createResponse({ error: 'Failed to fetch announcements' }, 500);
  }
}

// POST /api/admin/announcements - Create new announcement
export async function onRequestPost(context) {
  try {
    // Check admin authorization
    const admin = checkAdminAuth(context.request);
    if (!admin) {
      return createResponse({ error: 'Unauthorized' }, 401);
    }
    
    const { 
      title, 
      content, 
      type = 'general', 
      priority = 1, 
      target_audience = 'all',
      target_groups,
      starts_at,
      expires_at
    } = await context.request.json();
    
    // Validate required fields
    if (!title || !title.trim()) {
      return createResponse({ error: 'Title is required' }, 400);
    }
    if (!content || !content.trim()) {
      return createResponse({ error: 'Content is required' }, 400);
    }
    
    // Validate type
    const validTypes = ['general', 'urgent', 'event', 'reminder'];
    if (!validTypes.includes(type)) {
      return createResponse({ error: 'Invalid announcement type' }, 400);
    }
    
    // Validate priority
    if (priority < 1 || priority > 5) {
      return createResponse({ error: 'Priority must be between 1 and 5' }, 400);
    }
    
    // Validate target audience
    const validAudiences = ['all', 'vip', 'groups'];
    if (!validAudiences.includes(target_audience)) {
      return createResponse({ error: 'Invalid target audience' }, 400);
    }
    
    // Process target groups
    let targetGroupsJson = null;
    if (target_audience === 'groups' && target_groups && Array.isArray(target_groups)) {
      targetGroupsJson = JSON.stringify(target_groups);
    }
    
    // Insert new announcement
    const result = await context.env.DB.prepare(`
      INSERT INTO announcements (
        title, content, type, priority, target_audience, target_groups,
        author_name, starts_at, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      title.trim(),
      content.trim(),
      type,
      priority,
      target_audience,
      targetGroupsJson,
      admin.user || 'Admin',
      starts_at || null,
      expires_at || null
    ).run();
    
    if (!result.success) {
      throw new Error('Failed to create announcement');
    }
    
    return createResponse({ 
      id: result.meta.last_row_id,
      message: 'Announcement created successfully'
    }, 201);
    
  } catch (error) {
    console.error('Error creating announcement:', error);
    return createResponse({ error: 'Failed to create announcement' }, 500);
  }
}