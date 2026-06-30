# Duitr Supabase → Neon Migration Status

**Date:** 2026-06-30  
**Supabase project:** `cxqluedeykgqmthzveiw` (ap-southeast-1)  
**Neon project:** `falling-breeze-93808527` / branch `br-weathered-resonance-aorras4t` / database `neondb`

---

## Cloudflare Workers deployment

**Live URL:** https://duitr.faizintifada.com (also https://duitr.faizintifada.workers.dev)

```bash
bun run build          # or bun run deploy
bunx wrangler deploy   # deploy only (after build)
bun run preview        # local Workers preview
```

Set server secret for AI route:
```bash
bunx wrangler secret put GEMINI_API_KEY
```

Custom domain: `duitr.faizintifada.com` is configured in `wrangler.jsonc` routes; DNS must point to Cloudflare Workers.

---

## Environment variables (for app cutover)

Add or update in `.env` / Vercel (do **not** commit secrets):

```env
VITE_DATABASE_PROVIDER=neon

VITE_NEON_AUTH_URL=https://ep-dry-shadow-aoulq0jd.neonauth.c-2.ap-southeast-1.aws.neon.tech/neondb/auth
VITE_NEON_DATA_API_URL=https://ep-dry-shadow-aoulq0jd.apirest.c-2.ap-southeast-1.aws.neon.tech/neondb/rest/v1

# Server-side / direct Postgres (already in .env.local)
VITE_DATABASE_URL=postgresql://neondb_owner:***@ep-dry-shadow-aoulq0jd-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

Legacy Supabase vars can remain until cutover is complete:

```env
VITE_SUPABASE_URL=https://cxqluedeykgqmthzveiw.supabase.co
VITE_SUPABASE_ANON_KEY=<existing>
```

---

## Todo completion

| Todo | Status |
|------|--------|
| `neon-infra` | ✅ Complete |
| `schema-migrate` | ✅ Complete |
| `auth-import` | ✅ Complete |
| `data-migrate` | ✅ Complete |
| `cutover prep` | ✅ This document |

---

## Phase 1: Neon infrastructure

- **Data API:** `https://ep-dry-shadow-aoulq0jd.apirest.c-2.ap-southeast-1.aws.neon.tech/neondb/rest/v1` (auth provider: `neon_auth`)
- **Neon Auth trusted origins:**
  - `https://duitr.my.id`, `http://localhost:8080`
  - `https://duitr.my.id/auth/callback`, `https://duitr.my.id/reset-password`
  - `http://localhost:8080/auth/callback`, `http://localhost:8080/reset-password`
- **Extensions:** `pgcrypto`, `uuid-ossp`, `pg_trgm`

---

## Phase 2: Schema migration

- **10 public tables** migrated (legacy tables skipped: `categories_backup`, `categories_duplicate`, `category_id_mapping`)
- **FK rewrite:** all `auth.users(id)` → `neon_auth."user"(id)`
- **11 functions** on Neon (skipped `log_migration_error` — depends on non-existent `migration_progress`)
- **36 RLS policies** using `auth.uid()` (skipped 6 legacy-table policies + 2 `auth.role()` policies)
- **Triggers:** `set_default_category_trigger`, `set_prediction_timestamp`, `set_subscription_timestamp`
- **`get_user_currency`:** reads `public.user_metadata.preferred_currency` instead of Supabase `raw_user_meta_data`

---

## Phase 3: Auth import

| Metric | Supabase | Neon |
|--------|----------|------|
| Users | 492 | 492 (`neon_auth."user"`) |
| Accounts | 492 identities | 492 (`neon_auth.account`) |
| Google OAuth | 390 | 390 (`providerId: google`) |
| Email/password | 106 | 106 (`providerId: credential`, **no password hash**) |
| `user_metadata` | — | 492 rows |

- UUIDs preserved
- Email users: `emailVerified` set from Supabase `confirmed_at`; **passwords not migrated** — require password reset at cutover
- Orphan FK on `transactions.user_id`: **0**

---

## Phase 4: Data migration (row counts)

| Table | Supabase | Neon | Match |
|-------|----------|------|-------|
| categories | 147 | 147 | ✅ |
| wallets | 424 | 424 | ✅ |
| budgets | 158 | 158 | ✅ |
| transactions | 3643 | 3643 | ✅ |
| exchange_rates | 2 | 2 | ✅ |
| pinjaman_items | 35 | 35 | ✅ |
| want_to_buy_items | 11 | 11 | ✅ |
| notification_subscriptions | 0 | 0 | ✅ |
| budget_predictions | 0 | 0 | ✅ |

**Import method:** Supabase MCP `execute_sql` export + `scripts/migrate-to-neon.ts` / `scripts/apply-sql-file.ts` via `VITE_DATABASE_URL` (pg_dump not available on Windows host).

---

## Blockers / cutover checklist

1. **106 email users** — trigger bulk password-reset emails before or at cutover (Neon Auth credential accounts have no password).
2. **Google OAuth production** — Neon shared OAuth mode; configure BYO Google client + redirect URIs for production.
3. **2 RLS policies not recreated** (Neon has no `auth.role()`):
   - `System can insert predictions` on `budget_predictions`
   - `Service role can access all subscriptions` on `notification_subscriptions`
4. **`anon` role** — `GRANT EXECUTE ON get_user_currency TO anon` failed on Neon; verify Data API role grants if needed.
5. **App SDK cutover** — out of scope for this migration; set `VITE_DATABASE_PROVIDER=neon` and wire Neon Auth + Data API in app code separately.
6. **Schema compare** — Neon `compare_database_schema` compares branch vs parent, not Supabase vs Neon; manual schema migration was applied from `scripts/neon-schema-migration.sql`.

---

## Migration scripts (reference)

| Script | Purpose |
|--------|---------|
| `scripts/neon-schema-migration.sql` | DDL reference |
| `scripts/migrate-to-neon.ts` | Auth + JSON data import |
| `scripts/apply-sql-file.ts` | Apply generated INSERT SQL |
| `scripts/extract-data-json.ts` | Parse Supabase MCP exports |
| `scripts/export/` | Exported JSON/SQL batches |

---

## Recommended cutover sequence

1. Configure production Google OAuth on Neon Auth (BYO credentials).
2. Send password-reset emails to 106 email users.
3. Deploy app with `VITE_DATABASE_PROVIDER=neon` and Neon env vars.
4. Smoke-test auth (Google + password reset), CRUD, RLS.
5. Monitor; keep Supabase read-only as rollback for 48–72h.
