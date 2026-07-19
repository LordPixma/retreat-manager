// GET /api/push/config → the VAPID public key the client needs to subscribe.
// Public: the VAPID *public* key is not a secret. Returns enabled:false when
// push isn't configured so the client can hide the toggle.

import type { PagesContext } from '../../_shared/types.js';
import { createResponse, handleCORS } from '../../_shared/auth.js';
import { generateRequestId, createErrorResponse, handleError } from '../../_shared/errors.js';
import { pushConfigured } from '../../_shared/webpush.js';

export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

export async function onRequestGet(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();
  try {
    const enabled = pushConfigured(context.env);
    return createResponse({
      enabled,
      vapid_public_key: enabled ? context.env.VAPID_PUBLIC_KEY : null,
    });
  } catch (error) {
    return createErrorResponse(handleError(error, requestId));
  }
}
