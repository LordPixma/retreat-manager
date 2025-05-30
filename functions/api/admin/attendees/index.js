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
      room: attendee.room_number ? { number: attendee.room_number } : null,
      group: attendee.group_name ? { name: attendee.group_name } : null
    }));
    
    return new Response(JSON.stringify(formattedResults), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error fetching attendees:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch attendees' }), {
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
    
    const { name, email, ref_number, password, room_id, group_id, payment_due } = await context.request.json();
    
    // Validate required fields
    if (!name || !ref_number || !password) {
      return new Response(JSON.stringify({ error: 'Missing required fields: name, ref_number, password' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Hash password (simplified for now)
    const password_hash = await hashPassword(password);
    
    // Insert new attendee
    const result = await context.env.DB.prepare(`
      INSERT INTO attendees (name, email, ref_number, password_hash, room_id, group_id, payment_due)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      name,
      email || null,
      ref_number,
      password_hash,
      room_id || null,
      group_id || null,
      payment_due || 0
    ).run();
    
    if (!result.success) {
      throw new Error('Failed to create attendee');
    }
    
    return new Response(JSON.stringify({ 
      id: result.meta.last_row_id,
      message: 'Attendee created successfully'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error creating attendee:', error);
    
    // Handle unique constraint violation
    if (error.message.includes('UNIQUE constraint failed')) {
      return new Response(JSON.stringify({ error: 'Reference number already exists' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ error: 'Failed to create attendee' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Simple password hashing function
async function hashPassword(password) {
  // This is a simplified version. In production, use bcrypt.hash()
  // For now, we'll use a basic approach
  
  // Generate a simple hash (not secure, just for testing)
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'salt123');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  // For compatibility with bcrypt format, prefix with $2a$10$
  return '$2a$10$' + hashHex.substring(0, 53);
}