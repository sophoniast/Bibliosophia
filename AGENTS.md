# AGENTS.md

## Cursor Cloud specific instructions

Bibliosophia is a single-service React + Vite frontend (Bible reading/study app). It renders fully in local fallback mode using the seed data in `src/data/`, so no Supabase credentials or login are required to run, build, or manually test the app. Standard commands live in `package.json` scripts and the README; use those as the source of truth.

Service: React + Vite frontend
- Run (dev): `npm run dev` → serves at `http://localhost:5173/`. Routes: `/` (Hub), `/reader` (Read), `/map` (Map), `/scribe`.
- Build: `npm run build`
- Lint: `npm run lint`

Non-obvious notes:
- `npm run lint` currently exits non-zero on a clean checkout due to two pre-existing source errors (`react-hooks/set-state-in-effect` in `src/pages/HomePage.jsx` and `src/pages/BibleReaderPage.jsx`). This is a code issue, not an environment problem — the ESLint tooling itself is installed and working. Do not assume a failed lint means the environment is broken.
- Supabase is optional and OFF by default. Auth, server persistence, and edge functions only activate when `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are set (see `.env.example`). Without them the app uses local fallback data.
- `npm run supabase:*` scripts and the local Supabase stack (`supabase start`) require Docker, which is not installed in the base environment. The content sync script (`npm run sync:supabase`) needs `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. None of this is needed to develop or test the frontend.
- Node 22 is expected (matches `.github/workflows/ci.yml`).
