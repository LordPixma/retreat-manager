import { describe, it, expect, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import { generateAttendeeToken } from '../functions/_shared/auth.js';
import { onRequestGet as listPosts, onRequestPost as createPost } from '../functions/api/community/index.js';
import { onRequestDelete as deletePost } from '../functions/api/community/[id].js';
import { setupDb, seedAttendee, jsonRequest, methodRequest, bearer, ctx } from './helpers/db.js';

async function tokenFor(ref) {
  return generateAttendeeToken(ref, env.JWT_SECRET);
}

describe('Community wall API', () => {
  let saraToken, tomToken;

  beforeEach(async () => {
    await setupDb();
    await seedAttendee({ ref: 'REF260001', name: 'Sarah Johnson' });
    await seedAttendee({ ref: 'REF260002', name: 'Tom Fox' });
    saraToken = await tokenFor('REF260001');
    tomToken = await tokenFor('REF260002');
  });

  it('requires auth to list', async () => {
    const res = await listPosts(ctx(methodRequest('GET')));
    expect(res.status).toBe(401);
  });

  it('creates a post and lists it with is_mine', async () => {
    const created = await createPost(ctx(jsonRequest({ content: 'Please pray for safe travels', post_type: 'prayer' }, bearer(saraToken))));
    expect(created.status).toBe(201);

    const res = await listPosts(ctx(methodRequest('GET', bearer(saraToken))));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.posts).toHaveLength(1);
    expect(json.posts[0]).toMatchObject({
      author_name: 'Sarah Johnson',
      post_type: 'prayer',
      content: 'Please pray for safe travels',
      is_mine: true,
    });
  });

  it('marks other people\'s posts as not mine', async () => {
    await createPost(ctx(jsonRequest({ content: 'Grateful to be here', post_type: 'praise' }, bearer(tomToken))));
    const res = await listPosts(ctx(methodRequest('GET', bearer(saraToken))));
    const json = await res.json();
    expect(json.posts[0].is_mine).toBe(false);
  });

  it('rejects empty content', async () => {
    const res = await createPost(ctx(jsonRequest({ content: '   ' }, bearer(saraToken))));
    expect(res.status).toBe(400);
  });

  it('coerces an unknown post_type to note', async () => {
    await createPost(ctx(jsonRequest({ content: 'hello', post_type: 'spam' }, bearer(saraToken))));
    const res = await listPosts(ctx(methodRequest('GET', bearer(saraToken))));
    const json = await res.json();
    expect(json.posts[0].post_type).toBe('note');
  });

  it('excludes hidden posts from the wall', async () => {
    await env.DB.prepare(
      "INSERT INTO community_posts (attendee_id, author_name, post_type, content, is_hidden) VALUES (1, 'Sarah Johnson', 'note', 'hidden one', 1)"
    ).run();
    const res = await listPosts(ctx(methodRequest('GET', bearer(saraToken))));
    const json = await res.json();
    expect(json.posts).toHaveLength(0);
  });

  it('lets an author delete their own post', async () => {
    await createPost(ctx(jsonRequest({ content: 'mine to remove' }, bearer(saraToken))));
    const row = await env.DB.prepare('SELECT id FROM community_posts LIMIT 1').first();
    const res = await deletePost(ctx(methodRequest('DELETE', bearer(saraToken)), { id: String(row.id) }));
    expect(res.status).toBe(200);
    const after = await env.DB.prepare('SELECT COUNT(*) AS n FROM community_posts').first();
    expect(after.n).toBe(0);
  });

  it('forbids deleting someone else\'s post', async () => {
    await createPost(ctx(jsonRequest({ content: 'toms post' }, bearer(tomToken))));
    const row = await env.DB.prepare('SELECT id FROM community_posts LIMIT 1').first();
    const res = await deletePost(ctx(methodRequest('DELETE', bearer(saraToken)), { id: String(row.id) }));
    expect(res.status).toBe(403);
    const after = await env.DB.prepare('SELECT COUNT(*) AS n FROM community_posts').first();
    expect(after.n).toBe(1); // untouched
  });
});
