export async function onRequestPut(context) {
  try {
    // Check admin authorization
    const auth = context.request.headers.get('Authorization') || '';
    const token = auth.replace('Bearer ', '');
    
    if (!token || !token.startsWith('admin-token-')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const id = context.params.id;
    const { name } = await context.request.json();
    
    if (!name) {
      return new Response(JSON.stringify({ error: 'Group name is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Update group
    const result = await context.env.DB.prepare(`
      UPDATE groups SET name = ? WHERE id = ?
    `).bind(name, id).run();
    
    if (!result.success) {
      throw new Error('Failed to update group');
    }
    
    return new Response(JSON.stringify({ 
      success: true,
      message: 'Group updated successfully'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error updating group:', error);
    return new Response(JSON.stringify({ error: 'Failed to update group' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestDelete(context) {
  try {
    // Check admin authorization
    const auth = context.request.headers.get('Authorization') || '';
    const token = auth.replace('Bearer ', '');
    
    if (!token || !token.startsWith('admin-token-')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const id = context.params.id;
    
    // Check if group has members
    const { results: members } = await context.env.DB.prepare(`
      SELECT COUNT(*) as count FROM attendees WHERE group_id = ?
    `).bind(id).all();
    
    if (members[0].count > 0) {
      return new Response(JSON.stringify({ 
        error: 'Cannot delete group with members. Please reassign attendees first.'
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Delete group
    const result = await context.env.DB.prepare(`
      DELETE FROM groups WHERE id = ?
    `).bind(id).run();
    
    if (!result.success) {
      throw new Error('Failed to delete group');
    }
    
    return new Response(JSON.stringify({ 
      success: true,
      message: 'Group deleted successfully'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error deleting group:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete group' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}