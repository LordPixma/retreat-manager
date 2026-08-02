// GET /api/config
//
// Public, unauthenticated. Returns the editable retreat information (name,
// theme, scripture, dates, venue, host, pricing) plus whether registration is
// open, so the login and registration pages can render the current year's
// details without a redeploy. Values fall back to defaults when unset.

import type { PagesContext } from '../_shared/types.js';
import { createResponse, handleCORS } from '../_shared/auth.js';
import { createErrorResponse, generateRequestId, handleError } from '../_shared/errors.js';
import { getRetreatConfig } from '../_shared/retreat-config.js';
import { getRegistrationsOpen } from '../_shared/settings.js';

export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

export async function onRequestGet(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();
  try {
    const config = await getRetreatConfig(context.env.DB);
    const registrations_open = await getRegistrationsOpen(context.env.DB);
    return createResponse({ ...config, registrations_open });
  } catch (error) {
    console.error(`[${requestId}] config GET error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}
