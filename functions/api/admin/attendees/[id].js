// functions/api/admin/attendees/[id].js
// Handles GET, PUT, and DELETE requests for individual attendees

// GET /api/admin/attendees/:id - Get single attendee
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
    
    // Get attendee ID from URL params
    const id = context.params.id;
    
    if (!id) {
      return new Response(JSON.stringify({ error: 'Attendee ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Query specific attendee with room and group information
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
        r.description AS room_description,
        g.name AS group_name
      FROM attendees a
      LEFT JOIN rooms r ON a.room_id = r.id
      LEFT JOIN groups g ON a.group_id = g.id
      WHERE a.id = ?
    `).bind(id).all();
    
    if (!results.length) {
      return new Response(JSON.stringify({ error: 'Attendee not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const attendee = results[0];
    
    // Format the response
    const formattedResult = {
      id: attendee.id,
      ref_number: attendee.ref_number,
      name: attendee.name,
      email: attendee.email,
      payment_due: attendee.payment_due || 0,
      room_id: attendee.room_id,
      group_id: attendee.group_id,
      room: attendee.room_number ? { 
        number: attendee.room_number,
        description: attendee.room_description 
      } : null,
      group: attendee.group_name ? { name: attendee.group_name } : null
    };
    
    return new Response(JSON.stringify(formattedResult), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error fetching attendee:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch attendee' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// PUT /api/admin/attendees/:id - Update attendee
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
    
    // Get attendee ID from URL params
    const id = context.params.id;
    
    if (!id) {
      return new Response(JSON.stringify({ error: 'Attendee ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get update data from request body
    const updateData = await context.request.json();
    
    // Validate that attendee exists
    const { results: existingResults } = await context.env.DB.prepare(
      'SELECT id FROM attendees WHERE id = ?'
    ).bind(id).all();
    
    if (!existingResults.length) {
      return new Response(JSON.stringify({ error: 'Attendee not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Build dynamic UPDATE query
    const allowedFields = ['name', 'email', 'ref_number', 'room_id', 'group_id', 'payment_due', 'password'];
    const updateFields = [];
    const updateValues = [];
    
    // Only update fields that are provided and allowed
    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        if (key === 'password') {
          // Hash the password if it's being updated
          if (value && value.trim() !== '') {
            updateFields.push('password_hash = ?');
            updateValues.push(await hashPassword(value));
          }
        } else {
          updateFields.push(`${key} = ?`);
          updateValues.push(value === '' ? null : value);
        }
      }
    }
    
    if (updateFields.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid fields to update' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Add the ID as the last parameter
    updateValues.push(id);
    
    // Execute the update
    const updateQuery = `UPDATE attendees SET ${updateFields.join(', ')} WHERE id = ?`;
    const result = await context.env.DB.prepare(updateQuery).bind(...updateValues).run();
    
    if (!result.success) {
      throw new Error('Failed to update attendee');
    }
    
    console.log('Successfully updated attendee:', id);
    
    return new Response(JSON.stringify({ 
      success: true,
      message: 'Attendee updated successfully',
      id: id
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error updating attendee:', error);
    
    // Handle unique constraint violation
    if (error.message.includes('UNIQUE constraint failed')) {
      return new Response(JSON.stringify({ error: 'Reference number already exists' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ error: 'Failed to update attendee' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// DELETE /api/admin/attendees/:id - Delete attendee
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
    
    // Get attendee ID from URL params
    const id = context.params.id;
    
    if (!id) {
      return new Response(JSON.stringify({ error: 'Attendee ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Check if attendee exists before deleting
    const { results: existingResults } = await context.env.DB.prepare(
      'SELECT id, name, ref_number FROM attendees WHERE id = ?'
    ).bind(id).all();
    
    if (!existingResults.length) {
      return new Response(JSON.stringify({ error: 'Attendee not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const attendee = existingResults[0];
    
    // Delete the attendee
    const result = await context.env.DB.prepare(
      'DELETE FROM attendees WHERE id = ?'
    ).bind(id).run();
    
    if (!result.success) {
      throw new Error('Failed to delete attendee');
    }
    
    console.log('Successfully deleted attendee:', attendee.name, '(', attendee.ref_number, ')');
    
    return new Response(JSON.stringify({ 
      success: true,
      message: `Attendee ${attendee.name} deleted successfully`,
      deleted_attendee: {
        id: attendee.id,
        name: attendee.name,
        ref_number: attendee.ref_number
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error deleting attendee:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete attendee' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Helper function for password hashing (same as in other files)
async function hashPassword(password) {
  // This is a simplified version. In production, use bcrypt.hash()
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'salt123');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  // For compatibility with bcrypt format, prefix with $2a$10$
  return '$2a$10$' + hashHex.substring(0, 53);
}