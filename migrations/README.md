# Database migrations

D1 schema changes live here as numbered SQL files (`001_*.sql` … `NNN_*.sql`).
Historically they were applied by hand in the Cloudflare D1 console, which is
how migration 023 shipped in code but never reached production — attendees hit
`D1_ERROR: no such column: a.preferred_name` on login. This directory is now
wired to **`wrangler d1 migrations`** so the schema ships with the code.

## How it works

`wrangler d1 migrations apply` records each applied file in a `d1_migrations`
table and runs **only** the files not yet recorded. The
[`d1-migrations` workflow](../.github/workflows/d1-migrations.yml) runs it
against production whenever a `migrations/**` change lands on `main`, and can
also be run manually from the Actions tab.

## One-time setup (required before the workflow can apply anything)

1. **Add repo secrets** (Settings → Secrets and variables → Actions):
   - `CLOUDFLARE_API_TOKEN` — a token with **D1 edit** permission on the account.
   - `CLOUDFLARE_ACCOUNT_ID` — `9dbefd5c67069aa84dbc395946c55839`.

2. **Baseline the production database.** 001–023 are already applied by hand, so
   wrangler must be told that — otherwise it would consider them pending and
   re-run them, including `002`'s `DROP TABLE attendees`. First make sure every
   listed migration (especially **023** — confirm its seven columns exist on
   `attendees`) is genuinely applied, then run **once**:

   ```bash
   npx wrangler d1 execute attendance_db --remote --file=./scripts/baseline-d1-migrations.sql
   ```

3. **Validate, then trust it.** From the Actions tab → **D1 migrations** →
   *Run workflow* with the default `list` to confirm wrangler reports
   "No migrations to apply" (proof the baseline took). After that, merges that
   touch `migrations/**` apply automatically. The workflow's **Verify baseline**
   step hard-fails if step 2 was skipped, so a misconfigured run can't wipe data.

## Adding a migration

1. Create the next file continuing the **three-digit** sequence, e.g.
   `025_add_widget_table.sql`. (Keep the existing numbering — don't use
   `wrangler d1 migrations create`, which emits four-digit names that sort
   inconsistently against these.)
2. Keep it **additive and console-safe**: one statement per line, no semicolons
   inside comments. SQLite has no `ADD COLUMN IF NOT EXISTS`, so an applied
   migration must not be edited to change behaviour — always add a new file.
   (One narrow exception, documented below: correcting a *missing-column*
   omission in a migration that has only ever been baselined, never run.)
3. Open a PR. On merge to `main`, the workflow applies it to production.

## Known limitation: the 001–023 history is not cleanly re-appliable

These migrations were written and applied incrementally by hand and were never
run as a clean in-order batch. A from-scratch `wrangler d1 migrations apply`
fails partway — e.g. `005` indexes the `announcements` table before `016`
creates it, and `008`'s backfill `SELECT`s `registrations.payment_option`,
which no migration ever adds. Production has the correct schema (built up over
time); the gaps are only in the *files*.

**This does not affect the workflow or production.** `wrangler d1 migrations
apply` runs only files not recorded in `d1_migrations`, and the one-time
baseline records all of `001–023`, so the workflow never re-runs them and never
hits these ordering gaps. New migrations (`024+`) are clean and apply normally.
For disaster recovery, restore a D1 backup rather than replaying migrations
from zero.

Reconciling the historical files into a truly buildable set would mean
re-ordering several already-applied migrations; it's deferred as low-value (the
automation and prod are unaffected). One genuinely-missing column set was worth
adding now, though:

- **`announcements.email_sent` / `email_sent_at`** — added as **`024`**. No
  migration ever created them, yet `announcements/[id]/email.ts` writes them, so
  a database lacking them `500`s when an announcement is emailed. `024` is left
  out of the baseline so the workflow applies it (fixing that `500` if the
  columns are missing in prod); if a check shows prod already has them, baseline
  `024` instead — see `scripts/baseline-d1-migrations.sql`.

### Race note

The migration workflow and the Cloudflare Pages deploy are triggered by the
same merge but run independently, so for a few seconds new code may run against
the old schema. Keep changes **additive** (add columns/tables; backfill;
read both old and new) rather than renaming or dropping in the same release,
and the brief overlap is harmless. For a destructive change, use the
expand/contract pattern across two releases.

## Manual commands

```bash
# What's pending against production
npx wrangler d1 execute attendance_db --remote \
  --command "SELECT name FROM d1_migrations ORDER BY id"
npx wrangler d1 migrations list attendance_db --remote

# Apply pending migrations to production
npx wrangler d1 migrations apply attendance_db --remote
```
