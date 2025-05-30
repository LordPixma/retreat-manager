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
    const { number, description } = await context.request.json();
    
    if (!number) {
      return new Response(JSON.stringify({ error: 'Room number is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Update room
    const result = await context.env.DB.prepare(`
      UPDATE rooms SET number = ?, description = ? WHERE id = ?
    `).bind(number, description || null, id).run();
    
    if (!result.success) {
      throw new Error('Failed to update room');
    }
    
    return new Response(JSON.stringify({ 
      success: true,
      message: 'Room updated successfully'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error updating room:', error);
    return new Response(JSON.stringify({ error: 'Failed to update room' }), {
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
    
    // Check if room has occupants
    const { results: occupants } = await context.env.DB.prepare(`
      SELECT COUNT(*) as count FROM attendees WHERE room_id = ?
    `).bind(id).all();
    
    if (occupants[0].count > 0) {
      return new Response(JSON.stringify({ 
        error: 'Cannot delete room with occupants. Please reassign attendees first.'
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Delete room
    const result = await context.env.DB.prepare(`
      DELETE FROM rooms WHERE id = ?
    `).bind(id).run();
    
    if (!result.success) {
      throw new Error('Failed to delete room');
    }
    
    return new Response(JSON.stringify({ 
      success: true,
      message: 'Room deleted successfully'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error deleting room:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete room' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}