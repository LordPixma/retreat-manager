export async function onRequestPost(context) {
  try {
    const { user, pass } = await context.request.json();
    
    // Validate input
    if (!user || !pass) {
      return new Response(JSON.stringify({ error: 'Missing username or password' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Check credentials against environment variables
    const adminUser = context.env.ADMIN_USER;
    const adminPass = context.env.ADMIN_PASS;
    
    if (!adminUser || !adminPass) {
      console.error('Admin credentials not configured in environment variables');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Verify credentials
    if (user !== adminUser || pass !== adminPass) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Create admin token (simple implementation)
    const token = 'admin-token-' + btoa(user + ':' + Date.now() + ':admin');
    
    return new Response(JSON.stringify({ token }), {
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
    
  } catch (error) {
    console.error('Error in admin login:', error);
    return new Response(JSON.stringify({ error: 'Login failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}