// functions/api/admin/attendees/[id].js - Updated individual attendee operations
import { createResponse, checkAdminAuth, handleCORS, hashPassword } from '../../../_shared/auth.js';

// Handle CORS preflight
export async function onRequestOptions() {
  return handleCORS();
}

// GET /api/admin/attendees/:id - Get single attendee
export async function onRequestGet(context) {
  try {
    // Check admin authorization
    const admin = checkAdminAuth(context.request);
    if (!admin) {
      return createResponse({ error: 'Unauthorized' }, 401);
    }
    
    // Get attendee ID from URL params
    const id = context.params.id;
    
    if (!id) {
      return createResponse({ error: 'Attendee ID is required' }, 400);
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
      return createResponse({ error: 'Attendee not found' }, 404);
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
    
    return createResponse(formattedResult);
    
  } catch (error) {
    console.error('Error fetching attendee:', error);
    return createResponse({ error: 'Failed to fetch attendee' }, 500);
  }
}

// PUT /api/admin/attendees/:id - Update attendee
export async function onRequestPut(context) {
  try {
    // Check admin authorization
    const admin = checkAdminAuth(context.request);
    if (!admin) {
      return createResponse({ error: 'Unauthorized' }, 401);
    }
    
    // Get attendee ID from URL params
    const id = context.params.id;
    
    if (!id) {
      return createResponse({ error: 'Attendee ID is required' }, 400);
    }
    
    // Get update data from request body
    const updateData = await context.request.json();
    
    // Validate that attendee exists
    const { results: existingResults } = await context.env.DB.prepare(
      'SELECT id FROM attendees WHERE id = ?'
    ).bind(id).all();
    
    if (!existingResults.length) {
      return createResponse({ error: 'Attendee not found' }, 404);
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
            const hashedPassword = await hashPassword(value);
            updateFields.push('password_hash = ?');
            updateValues.push(hashedPassword);
            console.log('Updating password for attendee', id);
          }
        } else {
          updateFields.push(`${key} = ?`);
          updateValues.push(value === '' ? null : value);
        }
      }
    }
    
    if (updateFields.length === 0) {
      return createResponse({ error: 'No valid fields to update' }, 400);
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
    
    return createResponse({ 
      success: true,
      message: 'Attendee updated successfully',
      id: id
    });
    
  } catch (error) {
    console.error('Error updating attendee:', error);
    
    // Handle unique constraint violation
    if (error.message.includes('UNIQUE constraint failed')) {
      return createResponse({ error: 'Reference number already exists' }, 409);
    }
    
    return createResponse({ error: 'Failed to update attendee' }, 500);
  }
}

// DELETE /api/admin/attendees/:id - Delete attendee
export async function onRequestDelete(context) {
  try {
    // Check admin authorization
    const admin = checkAdminAuth(context.request);
    if (!admin) {
      return createResponse({ error: 'Unauthorized' }, 401);
    }
    
    // Get attendee ID from URL params
    const id = context.params.id;
    
    if (!id) {
      return createResponse({ error: 'Attendee ID is required' }, 400);
    }
    
    // Check if attendee exists before deleting
    const { results: existingResults } = await context.env.DB.prepare(
      'SELECT id, name, ref_number FROM attendees WHERE id = ?'
    ).bind(id).all();
    
    if (!existingResults.length) {
      return createResponse({ error: 'Attendee not found' }, 404);
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
    
    return createResponse({ 
      success: true,
      message: `Attendee ${attendee.name} deleted successfully`,
      deleted_attendee: {
        id: attendee.id,
        name: attendee.name,
        ref_number: attendee.ref_number
      }
    });
    
  } catch (error) {
    console.error('Error deleting attendee:', error);
    return createResponse({ error: 'Failed to delete attendee' }, 500);
  }
}