// Output-sanitization helpers shared by email templates and CSV exports.

// Escape a string for safe interpolation into HTML body / attribute context.
// Covers the five characters whose unescaped presence enables HTML/JS injection.
export function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// CSV cell escape that defends against:
//   1. Embedded quotes / commas / newlines (RFC 4180 quoting).
//   2. Spreadsheet formula injection — Excel/Sheets evaluates a cell whose
//      content begins with =, +, -, @, tab, or CR. Prefix with a single quote
//      to neutralise without altering visible content.
export function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '""';
  let s = String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
}
