// Cryptographically-random temporary password, used by the admin attendee
// reset and the self-service forgot-password flows. Charset excludes visually
// ambiguous characters (0/O, 1/l/I) so a temp password read over the phone or
// out of an email is easy to type. Matches the shape used elsewhere in the app.
export function generateTempPassword(len = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const buf = crypto.getRandomValues(new Uint32Array(len));
  let out = '';
  for (let i = 0; i < len; i++) out += chars.charAt(buf[i] % chars.length);
  return out;
}
