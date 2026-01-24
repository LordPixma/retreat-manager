// Authentication utilities for retreat-manager

import type { AdminAuth, AttendeeAuth } from './types.js';

/**
 * Hash password using SHA-256 with salt
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'retreat_portal_salt_2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return '$retreat$' + hashHex;
}

/**
 * Verify password against stored hash
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const generatedHash = await hashPassword(password);
  return generatedHash === storedHash;
}

/**
 * Check admin authorization from request
 */
export function checkAdminAuth(request: Request): AdminAuth | null {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.replace('Bearer ', '');

  if (!token || !token.startsWith('admin-token-')) {
    return null;
  }

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
 * Check attendee authorization from request
 */
export function checkAttendeeAuth(request: Request): AttendeeAuth | null {
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
export function createResponse<T>(data: T, status: number = 200): Response {
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
export function handleCORS(): Response {
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
 * Generate admin token
 */
export function generateAdminToken(user: string, role: string = 'admin'): string {
  return 'admin-token-' + btoa(`${user}:${Date.now()}:${role}`);
}

/**
 * Generate attendee token
 */
export function generateAttendeeToken(ref: string): string {
  return 'attendee-token-' + btoa(`${ref}:${Date.now()}`);
}
