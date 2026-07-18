// Community wall — attendee-facing list + create.
//
//   GET  /api/community  → visible posts, newest first (attendee auth)
//   POST /api/community  → create a post (attendee auth)
//
// Posts are short prayer requests / praise reports / notes shown to everyone
// at the retreat. Admins moderate via /api/admin/community.

import type { PagesContext } from '../../_shared/types.js';
import { createResponse, checkAttendeeAuth, handleCORS } from '../../_shared/auth.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../_shared/errors.js';

const POST_TYPES = ['prayer', 'praise', 'note'] as const;
const MAX_CONTENT = 500;

interface PostRow {
  id: number;
  attendee_id: number | null;
  author_name: string;
  post_type: string;
  content: string;
  created_at: string;
}

export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

// GET /api/community
export async function onRequestGet(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();
  try {
    const auth = await checkAttendeeAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!auth) return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));

    // Resolve the caller's attendee id so the client can flag their own posts.
    const meRows = await context.env.DB.prepare('SELECT id FROM attendees WHERE ref_number = ?').bind(auth.ref).all();
    const myId = meRows.results.length ? (meRows.results[0] as { id: number }).id : null;

    const { results } = await context.env.DB.prepare(`
      SELECT id, attendee_id, author_name, post_type, content, created_at
      FROM community_posts
      WHERE is_hidden = 0
      ORDER BY created_at DESC, id DESC
      LIMIT 200
    `).all();

    const posts = (results as unknown as PostRow[]).map(p => ({
      id: p.id,
      author_name: p.author_name,
      post_type: p.post_type,
      content: p.content,
      created_at: p.created_at,
      is_mine: myId != null && p.attendee_id === myId,
    }));

    return createResponse({ posts });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('no such table')) return createResponse({ posts: [] });
    console.error(`[${requestId}] community GET error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}

// POST /api/community
export async function onRequestPost(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();
  try {
    const auth = await checkAttendeeAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!auth) return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));

    const body = await context.request.json().catch(() => ({})) as { content?: string; post_type?: string };
    const content = (body.content ?? '').toString().trim();
    if (!content) return createErrorResponse(errors.badRequest('Message cannot be empty', requestId));
    if (content.length > MAX_CONTENT) {
      return createErrorResponse(errors.badRequest(`Message is too long (max ${MAX_CONTENT} characters)`, requestId));
    }
    const postType = POST_TYPES.includes((body.post_type ?? '') as typeof POST_TYPES[number])
      ? body.post_type as string
      : 'note';

    const meRows = await context.env.DB.prepare(
      'SELECT id, name FROM attendees WHERE ref_number = ?'
    ).bind(auth.ref).all();
    if (!meRows.results.length) return createErrorResponse(errors.notFound('Attendee', requestId));
    const me = meRows.results[0] as { id: number; name: string };

    const result = await context.env.DB.prepare(
      'INSERT INTO community_posts (attendee_id, author_name, post_type, content) VALUES (?, ?, ?, ?)'
    ).bind(me.id, me.name, postType, content).run();

    return createResponse({ id: result.meta.last_row_id, message: 'Posted' }, 201);
  } catch (error) {
    console.error(`[${requestId}] community POST error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}
