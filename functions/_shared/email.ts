// Email-sending wrapper used by every outbound email path in the project.
//
// Backend selection at request time:
//   1. If `env.EMAIL` (Cloudflare Email Send binding) is configured, route
//      through it — single send per message, no batch endpoint exists.
//   2. Else if `env.RESEND_API_KEY` is set, route through Resend's HTTP API.
//      Bulk sends use Resend's /emails/batch endpoint (up to 100 messages
//      per HTTP subrequest), which keeps Cloudflare Workers' subrequest
//      budget healthy even for hundreds of recipients.
//   3. Else short-circuit as "not configured" so callers can fire-and-forget.
//
// Both backends share the same external interface (sendEmail,
// sendEmailOrThrow, sendEmailsBulk) so call sites don't care which is live.

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
  errorsByKey?: Record<string, string>;
}

const BULK_CONCURRENCY = 25;
const RESEND_BATCH_MAX = 100;

type Backend = 'cloudflare' | 'resend' | 'none';

function pickBackend(env: Env): Backend {
  if (env.EMAIL && env.FROM_EMAIL) return 'cloudflare';
  if (env.RESEND_API_KEY && env.FROM_EMAIL) return 'resend';
  return 'none';
}

/**
 * Truthy when either backend is configured. Use this in call-site gates
 * instead of `env.EMAIL && env.FROM_EMAIL` so a Resend-only deployment
 * isn't refused.
 */
export function isEmailReady(env: Env): boolean {
  return pickBackend(env) !== 'none';
}

function stripHeaders(value: string): string {
  // Strip CR/LF defensively so user-supplied text (room number, attendee
  // name) can't inject extra SMTP headers downstream.
  return value.replace(/[\r\n]/g, ' ');
}

function buildCloudflareMessage(env: Env, msg: OutboundEmail): CloudflareEmailMessage {
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

function buildResendBody(env: Env, msg: OutboundEmail): Record<string, unknown> {
  const body: Record<string, unknown> = {
    from: env.FROM_EMAIL!,
    to: [msg.to],
    subject: stripHeaders(msg.subject),
    html: msg.html,
  };
  if (msg.text) body.text = msg.text;
  if (msg.replyTo) body.reply_to = msg.replyTo;
  if (msg.headers) body.headers = msg.headers;
  return body;
}

async function resendSingle(env: Env, msg: OutboundEmail): Promise<{ ok: true } | { ok: false; reason: string }> {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(buildResendBody(env, msg)),
    });
    if (!response.ok) {
      const text = await response.text();
      return { ok: false, reason: `Resend ${response.status}: ${text}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Send one email. Returns true if accepted, false otherwise. Errors are
 * logged but never thrown — every call site treats email as best-effort.
 */
export async function sendEmail(env: Env, msg: OutboundEmail): Promise<boolean> {
  if (!msg.to) return false;
  const backend = pickBackend(env);

  if (backend === 'none') {
    console.warn('[email] send skipped — no backend configured (need EMAIL binding or RESEND_API_KEY + FROM_EMAIL)');
    return false;
  }

  if (backend === 'cloudflare') {
    try {
      await env.EMAIL!.send(buildCloudflareMessage(env, msg));
      return true;
    } catch (err) {
      console.error('[email] cloudflare send failed', err);
      return false;
    }
  }

  // Resend path
  const result = await resendSingle(env, msg);
  if (!result.ok) console.error('[email] resend send failed', result.reason);
  return result.ok;
}

/**
 * Like sendEmail but throws on failure. Used by foreground sends where the
 * admin UI should surface delivery failures (e.g. registration approval).
 */
export async function sendEmailOrThrow(env: Env, msg: OutboundEmail): Promise<void> {
  const backend = pickBackend(env);
  if (backend === 'none') {
    throw new Error('Email service not configured (need EMAIL binding or RESEND_API_KEY + FROM_EMAIL)');
  }
  if (!msg.to) {
    throw new Error('Recipient email address is empty');
  }
  if (backend === 'cloudflare') {
    await env.EMAIL!.send(buildCloudflareMessage(env, msg));
    return;
  }
  const result = await resendSingle(env, msg);
  if (!result.ok) throw new Error(result.reason);
}

/**
 * Bulk fan-out. Each message becomes one subrequest on the Cloudflare path
 * (capped concurrency), or ceil(N/100) subrequests on the Resend path
 * (which has a batch endpoint).
 *
 * `keys` are opaque identifiers paired with `messages` by index — the
 * caller uses them to map sent/failed back to its own records.
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

  const backend = pickBackend(env);
  if (backend === 'none') {
    return {
      sentKeys: [],
      failedKeys: [...keys],
      errorMessage: 'Email service not configured (need EMAIL binding or RESEND_API_KEY + FROM_EMAIL)',
    };
  }

  if (backend === 'cloudflare') {
    return cloudflareBulk(env, messages, keys, opts);
  }
  return resendBulk(env, messages, keys);
}

async function cloudflareBulk<TKey extends string | number>(
  env: Env,
  messages: OutboundEmail[],
  keys: TKey[],
  opts: { concurrency?: number },
): Promise<BulkEmailResult<TKey>> {
  const concurrency = Math.max(1, Math.min(opts.concurrency ?? BULK_CONCURRENCY, 100));
  const sent: TKey[] = [];
  const failed: TKey[] = [];
  const errorsByKey: Record<string, string> = {};
  let lastError: string | null = null;

  for (let i = 0; i < messages.length; i += concurrency) {
    const sliceMsgs = messages.slice(i, i + concurrency);
    const sliceKeys = keys.slice(i, i + concurrency);
    const settled = await Promise.allSettled(
      sliceMsgs.map(m => env.EMAIL!.send(buildCloudflareMessage(env, m))),
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
  return { sentKeys: sent, failedKeys: failed, errorMessage: lastError, errorsByKey: failed.length ? errorsByKey : undefined };
}

async function resendBulk<TKey extends string | number>(
  env: Env,
  messages: OutboundEmail[],
  keys: TKey[],
): Promise<BulkEmailResult<TKey>> {
  // Resend's /emails/batch accepts up to 100 messages per call and returns
  // 2xx for the whole batch or non-2xx if the batch failed. We treat the
  // whole batch as success/fail together — Resend doesn't surface per-
  // recipient failures in this endpoint.
  const sent: TKey[] = [];
  const failed: TKey[] = [];
  const errorsByKey: Record<string, string> = {};
  let lastError: string | null = null;

  for (let i = 0; i < messages.length; i += RESEND_BATCH_MAX) {
    const sliceMsgs = messages.slice(i, i + RESEND_BATCH_MAX);
    const sliceKeys = keys.slice(i, i + RESEND_BATCH_MAX);
    const payload = sliceMsgs.map(m => buildResendBody(env, m));

    try {
      const response = await fetch('https://api.resend.com/emails/batch', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        sent.push(...sliceKeys);
      } else {
        const text = await response.text();
        const reason = `Resend batch ${response.status}: ${text}`;
        lastError = reason;
        for (const k of sliceKeys) {
          failed.push(k);
          errorsByKey[String(k)] = reason;
        }
      }
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      lastError = reason;
      for (const k of sliceKeys) {
        failed.push(k);
        errorsByKey[String(k)] = reason;
      }
    }
  }

  return { sentKeys: sent, failedKeys: failed, errorMessage: lastError, errorsByKey: failed.length ? errorsByKey : undefined };
}
