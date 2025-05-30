export async function onRequestGet(context) {
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
    
    // Get all rooms with occupancy info
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
      occupants: room.occupants ? room.occupants.split(', ') : []
    }));
    
    return new Response(JSON.stringify(formattedRooms), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch rooms' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestPost(context) {
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
    
    const { number, description } = await context.request.json();
    
    // Validate required fields
    if (!number) {
      return new Response(JSON.stringify({ error: 'Room number is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Insert new room
    const result = await context.env.DB.prepare(`
      INSERT INTO rooms (number, description)
      VALUES (?, ?)
    `).bind(number, description || null).run();
    
    if (!result.success) {
      throw new Error('Failed to create room');
    }
    
    return new Response(JSON.stringify({ 
      id: result.meta.last_row_id,
      message: 'Room created successfully'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error creating room:', error);
    
    if (error.message.includes('UNIQUE constraint failed')) {
      return new Response(JSON.stringify({ error: 'Room number already exists' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ error: 'Failed to create room' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}