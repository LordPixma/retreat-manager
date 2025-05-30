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
    
    // Get all groups with member info
    const { results } = await context.env.DB.prepare(`
      SELECT 
        g.id,
        g.name,
        COUNT(a.id) as member_count,
        GROUP_CONCAT(a.name, ', ') as members
      FROM groups g
      LEFT JOIN attendees a ON g.id = a.group_id
      GROUP BY g.id, g.name
      ORDER BY g.name
    `).all();
    
    const formattedGroups = results.map(group => ({
      id: group.id,
      name: group.name,
      member_count: group.member_count || 0,
      members: group.members ? group.members.split(', ') : []
    }));
    
    return new Response(JSON.stringify(formattedGroups), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error fetching groups:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch groups' }), {
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
    
    const { name } = await context.request.json();
    
    // Validate required fields
    if (!name) {
      return new Response(JSON.stringify({ error: 'Group name is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Insert new group
    const result = await context.env.DB.prepare(`
      INSERT INTO groups (name) VALUES (?)
    `).bind(name).run();
    
    if (!result.success) {
      throw new Error('Failed to create group');
    }
    
    return new Response(JSON.stringify({ 
      id: result.meta.last_row_id,
      message: 'Group created successfully'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error creating group:', error);
    return new Response(JSON.stringify({ error: 'Failed to create group' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}