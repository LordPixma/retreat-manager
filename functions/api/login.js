// functions/api/login.js - Updated attendee login
import { createResponse, checkAttendeeAuth, handleCORS, hashPassword, verifyPassword } from '../_shared/auth.js';

// Handle CORS preflight
export async function onRequestOptions() {
  return handleCORS();
}

export async function onRequestPost(context) {
  try {
    const { ref, password } = await context.request.json();
    
    console.log('Login attempt for ref:', ref);
    
    if (!ref || !password) {
      return createResponse({ error: 'Missing reference number or password' }, 400);
    }
    
    // Query attendee from database
    const { results } = await context.env.DB.prepare(`
      SELECT id, ref_number, password_hash, name
      FROM attendees 
      WHERE ref_number = ?
    `).bind(ref.trim()).all();
    
    if (!results.length) {
      console.log('No attendee found for ref:', ref);
      return createResponse({ error: 'Unknown reference number' }, 401);
    }
    
    const attendee = results[0];
    console.log('Found attendee:', attendee.name);
    
    // Verify password using standardized method
    const isValid = await verifyPassword(password, attendee.password_hash);
    
    if (!isValid) {
      console.log('Invalid password for:', ref);
      return createResponse({ error: 'Invalid password' }, 401);
    }
    
    console.log('Login successful for:', ref);
    
    // Create token
    const token = 'attendee-token-' + btoa(ref + ':' + Date.now());
    
    return createResponse({ token });
    
  } catch (error) {
    console.error('Error in attendee login:', error);
    return createResponse({ error: 'Login failed' }, 500);
  }
}