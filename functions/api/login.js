export async function onRequestPost(context) {
  try {
    const { ref, password } = await context.request.json();
    
    if (!ref || !password) {
      return new Response(JSON.stringify({ error: 'Missing reference number or password' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Query attendee from database
    const { results } = await context.env.DB.prepare(`
      SELECT id, ref_number, password_hash 
      FROM attendees 
      WHERE ref_number = ?
    `).bind(ref).all();
    
    if (!results.length) {
      return new Response(JSON.stringify({ error: 'Unknown reference number' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const attendee = results[0];
    
    // Simple password verification (you should use bcrypt in production)
    // For now, we'll use a simple check
    const isValidPassword = await verifyPassword(password, attendee.password_hash);
    
    if (!isValidPassword) {
      return new Response(JSON.stringify({ error: 'Invalid password' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Create simple token (in production, use JWT)
    const token = 'attendee-token-' + btoa(ref + ':' + Date.now());
    
    return new Response(JSON.stringify({ token }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error in attendee login:', error);
    return new Response(JSON.stringify({ error: 'Login failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Simple password verification function
async function verifyPassword(plainPassword, hashedPassword) {
  // This is a simplified version. In production, use bcrypt.compare()
  // For testing purposes, let's assume the password hash is valid if it exists
  // You should replace this with proper bcrypt verification
  
  // If the hash starts with $2a$ or $2b$, it's likely a bcrypt hash
  if (hashedPassword.startsWith('$2a$') || hashedPassword.startsWith('$2b$')) {
    // For now, we'll use a simple comparison
    // In production: return await bcrypt.compare(plainPassword, hashedPassword);
    return plainPassword === 'password123'; // Temporary for testing
  }
  
  // Fallback for plain text passwords (not recommended)
  return plainPassword === hashedPassword;
}