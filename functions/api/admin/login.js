// functions/api/admin/login.js - Updated admin login
import { createResponse, handleCORS } from '../../_shared/auth.js';

// Handle CORS preflight
export async function onRequestOptions() {
  return handleCORS();
}

export async function onRequestPost(context) {
  try {
    const { user, pass } = await context.request.json();
    
    // Validate input
    if (!user || !pass) {
      return createResponse({ error: 'Missing username or password' }, 400);
    }
    
    // Check credentials against environment variables
    const adminUser = context.env.ADMIN_USER || 'admin';
    const adminPass = context.env.ADMIN_PASS || 'admin123';
    
    console.log('Admin login attempt for user:', user);
    console.log('Expected user:', adminUser);
    
    // Verify credentials
    if (user.trim() !== adminUser || pass !== adminPass) {
      console.log('Invalid admin credentials');
      return createResponse({ error: 'Invalid credentials' }, 401);
    }
    
    console.log('Admin login successful for:', user);
    
    // Create admin token
    const token = 'admin-token-' + btoa(user + ':' + Date.now() + ':admin');
    
    return createResponse({ token });
    
  } catch (error) {
    console.error('Error in admin login:', error);
    return createResponse({ error: 'Login failed' }, 500);
  }
}
