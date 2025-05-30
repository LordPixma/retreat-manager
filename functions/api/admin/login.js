import { jsonResponse, unauthorized } from '../../utils/http.js';
import { createAdminJWT } from '../../auth.js';

export async function onRequestPost(context) {
  try {
    const { user, pass } = await context.request.json();
    
    // Check against environment variables
    if (user !== context.env.ADMIN_USER || pass !== context.env.ADMIN_PASS) {
      return unauthorized('Invalid credentials');
    }
    
    const token = await createAdminJWT({ user });
    return jsonResponse({ token });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Login failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Helper functions (you'll need to copy these)
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function unauthorized(message = 'Unauthorized') {
  return new Response(JSON.stringify({ error: message }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function createAdminJWT(payload) {
  // You'll need to implement this based on your auth.js
  // For now, return a simple token
  return 'admin-jwt-token-' + Date.now();
}