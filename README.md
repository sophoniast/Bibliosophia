# Bibliosophia

Bibliosophia is a React + Vite frontend designed to pair cleanly with Supabase for storage, auth, and edge functions.

The app now uses:

- Supabase anonymous auth for private per-user state without a signup wall
- Supabase tables for readings, journeys, daily verses, preferences, notes, and highlights
- a Supabase Edge Function for the reader AI endpoint scaffold
- local source files in `src/data/` as the canonical seed source for syncing content into Supabase
- local Supabase CLI config and migration files for repeatable schema deployment

## GitHub-Friendly Setup

Secrets are not committed. Copy [.env.example](/Users/soph/Documents/GitHub/Bibliosophia/.env.example) to `.env.local` and fill in:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_AUTH_OAUTH_PROVIDERS=google,github
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
UNSPLASH_ACCESS_KEY=...
PEXELS_API_KEY=...
PIXABAY_API_KEY=...
```

For GitHub Actions or deploy previews, add the same values as repository secrets.

`VITE_AUTH_OAUTH_PROVIDERS` controls which Supabase OAuth buttons appear in the signup dialog. Enable those
providers in Supabase Auth and add your deployed app URL to the allowed redirect URLs. Organization SSO uses
Supabase `signInWithSSO` by domain, so each SSO domain must be connected in Supabase before that button can redirect.

## Local Development

```bash
npm install --cache ./.npm-cache
npm run dev
```

The frontend still builds without Supabase env vars, using local fallback data, but server-owned persistence only activates when the Supabase values are present.

## Supabase Setup

1. Create a Supabase project and note the project ref, URL, anon key, and service role key.
2. Enable anonymous sign-ins in Supabase Auth.
3. Set the env vars from `.env.example`.
4. Apply the migration in [supabase/migrations/202604220001_initial_schema.sql](/Users/soph/Documents/GitHub/Bibliosophia/supabase/migrations/202604220001_initial_schema.sql) with `supabase db push`, or run [supabase/schema.sql](/Users/soph/Documents/GitHub/Bibliosophia/supabase/schema.sql) manually in the SQL editor.
5. Deploy the edge functions in [supabase/functions/reader-ai/index.ts](/Users/soph/Documents/GitHub/Bibliosophia/supabase/functions/reader-ai/index.ts) and [supabase/functions/image-search/index.ts](/Users/soph/Documents/GitHub/Bibliosophia/supabase/functions/image-search/index.ts).
6. Sync the canonical content into Supabase:

```bash
npm run sync:supabase
```

## Supabase CLI

The project now includes:

- [supabase/config.toml](/Users/soph/Documents/GitHub/Bibliosophia/supabase/config.toml)
- [supabase/migrations/202604220001_initial_schema.sql](/Users/soph/Documents/GitHub/Bibliosophia/supabase/migrations/202604220001_initial_schema.sql)

Useful commands:

```bash
npx supabase --version
npm run supabase:db:push
npm run supabase:functions:serve
```

This machine does not currently have Docker installed, so `supabase start` will not work here until Docker is added.

## Current Data Flow

- `app_readings`, `app_journeys`, and `app_daily_verses` store public content.
- `user_profiles` stores theme and reader preferences per anonymous Supabase user.
- `reader_states` stores notes and highlights per anonymous Supabase user.
- `reader-ai` serves the study-response scaffold.
- `image-search` securely proxies Unsplash, Pexels, Pixabay, and Wikimedia Commons search for the verse image creator without exposing provider keys to the browser.

## Why This Fits Better

- GitHub stays clean because secrets live in env vars, not source files.
- Supabase owns persistence and auth instead of a temporary local SQLite layer.
- The app can still render in fallback mode while infrastructure is being connected.

## Next Step

The strongest next improvement is upgrading from anonymous sessions to full authenticated accounts once you want cross-device sync and durable user identities.

## GitHub Actions

The repo now includes:

- [CI workflow](/Users/soph/Documents/GitHub/Bibliosophia/.github/workflows/ci.yml) for lint/build checks
- [Supabase deploy workflow](/Users/soph/Documents/GitHub/Bibliosophia/.github/workflows/supabase-deploy.yml) for schema, function, and content sync deployment

Add these GitHub secrets before using the deploy workflow:

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_DB_PASSWORD`
- `SUPABASE_PROJECT_ID`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
