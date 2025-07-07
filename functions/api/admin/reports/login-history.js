// functions/api/admin/reports/login-history.js
import { createResponse, checkAdminAuth, handleCORS } from '../../../_shared/auth.js';

// Handle CORS preflight
export async function onRequestOptions() {
  return handleCORS();
}

// GET /api/admin/reports/login-history - Get recent login records
export async function onRequestGet(context) {
  try {
    const admin = checkAdminAuth(context.request);
    if (!admin) {
      return createResponse({ error: 'Unauthorized' }, 401);
    }

    const { results } = await context.env.DB.prepare(`
      SELECT id, user_type, user_id, login_time
      FROM login_history
      ORDER BY datetime(login_time) DESC
      LIMIT 20
    `).all();

    return createResponse(results);
  } catch (error) {
    console.error('Error fetching login history:', error);
    return createResponse({ error: 'Failed to fetch login history' }, 500);
  }
}
