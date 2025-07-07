// functions/_shared/auth.js
// Standardized authentication utilities for all functions

/**
 * Consistent password hashing using crypto.subtle
 * This replaces both bcrypt and the custom implementation
 */
export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'retreat_portal_salt_2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  // Use a consistent format
  return '$retreat$' + hashHex;
}

/**
 * Verify password against stored hash
 */
export async function verifyPassword(password, storedHash) {
  const generatedHash = await hashPassword(password);
  return generatedHash === storedHash;
}

/**
 * Check admin authorization
 */
export function checkAdminAuth(request) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.replace('Bearer ', '');
  
  if (!token || !token.startsWith('admin-token-')) {
    return null;
  }
  
  // Simple token validation (in production, use proper JWT)
  try {
    const decoded = atob(token.replace('admin-token-', ''));
    const [user, timestamp, role] = decoded.split(':');
    
    // Check if token is not too old (2 hours = 7200000ms)
    const tokenAge = Date.now() - parseInt(timestamp);
    if (tokenAge > 7200000) {
      return null;
    }
    
    return { user, role };
  } catch {
    return null;
  }
}

/**
 * Check attendee authorization
 */
export function checkAttendeeAuth(request) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.replace('Bearer ', '');
  
  if (!token || !token.startsWith('attendee-token-')) {
    return null;
  }
  
  try {
    const decoded = atob(token.replace('attendee-token-', ''));
    const [ref, timestamp] = decoded.split(':');
    
    // Check if token is not too old (2 hours)
    const tokenAge = Date.now() - parseInt(timestamp);
    if (tokenAge > 7200000) {
      return null;
    }
    
    return { ref };
  } catch {
    return null;
  }
}

/**
 * Create standardized JSON response with CORS headers
 */
export function createResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Cache-Control': 'no-cache'
    }
  });
}

/**
 * Handle CORS preflight requests
 */
export function handleCORS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}

/**
 * Extract the client IP address from request headers
 * Returns 'unknown' if no valid IP can be determined
 */
export function getClientIP(request) {
  const cf = request.headers.get('CF-Connecting-IP');
  const xff = request.headers.get('X-Forwarded-For');
  const real = request.headers.get('X-Real-IP');
  const raw = cf || xff || real || '';
  const first = raw.split(',')[0].trim();
  return isValidIP(first) ? first : 'unknown';
}

/**
 * Basic IPv4/IPv6 validation
 */
function isValidIP(ip) {
  if (!ip) return false;
  const ipv4 = /^((25[0-5]|2[0-4]\d|1?\d?\d)(\.|$)){4}$/;
  const ipv6 = /^[0-9a-fA-F:]{2,45}$/;
  return ipv4.test(ip) || ipv6.test(ip);
}
