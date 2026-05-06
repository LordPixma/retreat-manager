// Cloudflare Email Send wrapper.
//
// Replaces the Resend HTTP integration the project used previously. Exposes
// two helpers:
//   - sendEmail(env, msg): single-recipient send, returns true on success
//   - sendEmailsBulk(env, msgs): fan-out for bulk sends (announcements,
//     payment/login reminders, allergy forms). Cloudflare has no /emails/batch
//     analogue, so we send each message as its own subrequest with bounded
//     concurrency and aggregate the result.
//
// Both helpers no-op (return false / failure result) when the EMAIL binding or
// FROM_EMAIL is not configured, so callers can fire-and-forget without guards.

import type { Env, CloudflareEmailMessage } from './types.js';

export interface OutboundEmail {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  headers?: Record<string, string>;
}

export interface BulkEmailResult<TKey = string> {
  sentKeys: TKey[];
  failedKeys: TKey[];
  errorMessage: string | null;
  // Per-key error so callers (e.g. payment reminders) can surface specific
  // failures instead of just the last one.
  errorsByKey?: Record<string, string>;
}

const BULK_CONCURRENCY = 25;

function isEmailConfigured(env: Env): boolean {
  return Boolean(env.EMAIL && env.FROM_EMAIL);
}

function stripHeaders(value: string): string {
  // Strip CR/LF defensively in case admin-provided text (room number, attendee
  // name) sneaks newlines that could become SMTP header injections downstream.
  return value.replace(/[\r\n]/g, ' ');
}

function buildMessage(env: Env, msg: OutboundEmail): CloudflareEmailMessage {
  return {
    from: env.FROM_EMAIL!,
    to: msg.to,
    subject: stripHeaders(msg.subject),
    html: msg.html,
    text: msg.text,
    replyTo: msg.replyTo,
    headers: msg.headers,
  };
}

/**
 * Send one email via the Cloudflare Email Send binding.
 *
 * Returns true if accepted by Cloudflare, false if skipped (unconfigured /
 * missing recipient) or rejected. Errors are logged but never thrown — every
 * call site treats email as best-effort.
 */
export async function sendEmail(env: Env, msg: OutboundEmail): Promise<boolean> {
  if (!msg.to) return false;
  if (!isEmailConfigured(env)) {
    console.warn('[email] send skipped — Cloudflare Email Send not configured (EMAIL binding / FROM_EMAIL)');
    return false;
  }
  try {
    await env.EMAIL!.send(buildMessage(env, msg));
    return true;
  } catch (err) {
    console.error('[email] send failed', err);
    return false;
  }
}

/**
 * Like sendEmail but throws on failure. Useful for foreground sends where the
 * admin UI should hear about the failure (e.g. registration approval — we
 * previously returned a non-throwing result and surfaced "email_sent: false").
 */
export async function sendEmailOrThrow(env: Env, msg: OutboundEmail): Promise<void> {
  if (!isEmailConfigured(env)) {
    throw new Error('Cloudflare Email Send not configured (EMAIL binding / FROM_EMAIL)');
  }
  if (!msg.to) {
    throw new Error('Recipient email address is empty');
  }
  await env.EMAIL!.send(buildMessage(env, msg));
}

/**
 * Bulk fan-out. Each message becomes one Cloudflare subrequest (no batch
 * endpoint exists). We cap concurrency so a 200-recipient blast doesn't burn
 * the entire subrequest budget in one burst.
 *
 * `key` is an opaque identifier (attendee_id, email, …) the caller uses to
 * map sent/failed back to its own records. Pass keys.length === messages.length
 * — they're paired by index.
 */
export async function sendEmailsBulk<TKey extends string | number>(
  env: Env,
  messages: OutboundEmail[],
  keys: TKey[],
  opts: { concurrency?: number } = {},
): Promise<BulkEmailResult<TKey>> {
  if (messages.length !== keys.length) {
    throw new Error('sendEmailsBulk: messages.length must equal keys.length');
  }
  if (messages.length === 0) {
    return { sentKeys: [], failedKeys: [], errorMessage: null };
  }
  if (!isEmailConfigured(env)) {
    return {
      sentKeys: [],
      failedKeys: [...keys],
      errorMessage: 'Cloudflare Email Send not configured (EMAIL binding / FROM_EMAIL)',
    };
  }

  const concurrency = Math.max(1, Math.min(opts.concurrency ?? BULK_CONCURRENCY, 100));
  const sent: TKey[] = [];
  const failed: TKey[] = [];
  const errorsByKey: Record<string, string> = {};
  let lastError: string | null = null;

  for (let i = 0; i < messages.length; i += concurrency) {
    const sliceMsgs = messages.slice(i, i + concurrency);
    const sliceKeys = keys.slice(i, i + concurrency);
    const settled = await Promise.allSettled(
      sliceMsgs.map(m => env.EMAIL!.send(buildMessage(env, m))),
    );
    settled.forEach((res, idx) => {
      const key = sliceKeys[idx];
      if (res.status === 'fulfilled') {
        sent.push(key);
      } else {
        failed.push(key);
        const reason = res.reason instanceof Error ? res.reason.message : String(res.reason);
        lastError = reason;
        errorsByKey[String(key)] = reason;
      }
    });
  }

  return {
    sentKeys: sent,
    failedKeys: failed,
    errorMessage: lastError,
    errorsByKey: failed.length ? errorsByKey : undefined,
  };
}
