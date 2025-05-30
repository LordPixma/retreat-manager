// worker/index.js
import { initDB } from './db.js';
import * as adminHandlers from './handlers/admin.js';
import * as attendeeHandlers from './handlers/attendee.js';
import { Router } from 'itty-router';
import { notFound, methodNotAllowed } from './utils/http.js';

// Initialize router
const router = Router();

// ***** Admin Routes *****
router.post('/api/admin/login', async request => {
  // Pass env vars to handler if needed
  return await adminHandlers.login(request);
});
router.get('/api/admin/attendees', request => adminHandlers.listAttendees(request));
router.post('/api/admin/attendees', request => adminHandlers.createAttendee(request));
router.get('/api/admin/attendees/:id', request => adminHandlers.getAttendee(request, request.params));
router.put('/api/admin/attendees/:id', request => adminHandlers.updateAttendee(request, request.params));
router.delete('/api/admin/attendees/:id', request => adminHandlers.deleteAttendee(request, request.params));

// ***** Attendee Routes *****
router.post('/api/login', request => attendeeHandlers.login(request));
router.get('/api/me', request => attendeeHandlers.getMe(request));

// Fallbacks
router.all('*', () => notFound());

// Worker entry
export default {
  async fetch(request, env) {
    // Initialize D1 binding
    initDB(env);
    // Bind admin secrets to globalThis for auth module
    globalThis.ADMIN_USER = env.ADMIN_USER;
    globalThis.ADMIN_PASS = env.ADMIN_PASS;
    globalThis.ADMIN_JWT_SECRET = env.ADMIN_JWT_SECRET;
    globalThis.ATTENDEE_JWT_SECRET = env.ATTENDEE_JWT_SECRET;

    try {
      return await router.handle(request, env);
    } catch (err) {
      console.error('Unhandled Error:', err);
      return new Response('Internal Server Error', { status: 500 });
    }
  }
};
