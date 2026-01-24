// Middleware for Cloudflare Pages Functions with TypeScript

import type { PagesContext } from './_shared/types.js';

interface Data {
  requestId?: string;
}

// Add request tracking and error handling
export async function onRequest(context: PagesContext<Record<string, string>, Data>): Promise<Response> {
  // Generate request ID for tracking
  const requestId = `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;

  // Store request ID in context data for downstream handlers
  context.data = context.data || {};
  context.data.requestId = requestId;

  try {
    // Continue to the next handler
    const response = await context.next();

    // Add request ID to response headers for debugging
    const newHeaders = new Headers(response.headers);
    newHeaders.set('X-Request-ID', requestId);

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders
    });

  } catch (error) {
    console.error(`[${requestId}] Unhandled error in middleware:`, error);

    // Return a generic error response
    return new Response(JSON.stringify({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      details: {
        requestId
      }
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }
}
