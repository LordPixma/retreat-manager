export async function onRequestGet(context) {
  try {
    const auth = context.request.headers.get('Authorization') || '';
    const token = auth.replace('Bearer ', '');
    
    if (!token || !token.startsWith('attendee-token-')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Extract attendee ref from token (simple implementation)
    const decoded = atob(token.replace('attendee-token-', ''));
    const ref = decoded.split(':')[0];
    
    // Query attendee data with joins
    const { results } = await context.env.DB.prepare(`
      SELECT 
        a.name, 
        a.payment_due,
        r.number AS room_number, 
        r.description AS room_description,
        g.name AS group_name,
        a.group_id
      FROM attendees a
      LEFT JOIN rooms r ON a.room_id = r.id
      LEFT JOIN groups g ON a.group_id = g.id
      WHERE a.ref_number = ?
    `).bind(ref).all();
    
    if (!results.length) {
      return new Response(JSON.stringify({ error: 'Attendee not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const attendee = results[0];
    
    // Get group members if attendee is in a group
    let members = [];
    if (attendee.group_id) {
      const { results: memberResults } = await context.env.DB.prepare(`
        SELECT name, ref_number 
        FROM attendees 
        WHERE group_id = ? AND ref_number != ?
      `).bind(attendee.group_id, ref).all();
      members = memberResults;
    }
    
    // Format response
    const response = {
      name: attendee.name,
      payment_due: attendee.payment_due || 0,
      room: attendee.room_number ? {
        number: attendee.room_number,
        description: attendee.room_description || ''
      } : null,
      group: attendee.group_name ? {
        name: attendee.group_name,
        members: members
      } : null
    };
    
    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error in /api/me:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}