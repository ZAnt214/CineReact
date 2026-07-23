# AGENTS.md

## Cursor Cloud specific instructions

CineReact is a single full-stack app: a React 19 + Vite front end served by an Express
backend (`server.ts`) that also exposes the `/api/*` routes. There is no separate
front-end/back-end process — one command runs everything.

### Run

- Dev (use this): `npm run dev` (runs `tsx server.ts`). Serves the app + API on
  `http://0.0.0.0:3000` with Vite in middleware mode. There is no separate `vite dev` step.
- Lint / typecheck: `npm run lint` (`tsc --noEmit`).
- Prod build (not needed for dev): `npm run build` then `npm start`.

### Non-obvious notes

- Package manager: the repo ships a `bun.lock`, but Bun is not installed here. `npm install`
  works against `package.json` and the npm scripts, so use npm. `npm install` regenerates
  `package-lock.json` (left uncommitted).
- Secrets are optional. Without `GEMINI_API_KEY` / `YOUTUBE_API_KEY` the server logs that it
  runs in "simulação inteligente" mode and still boots fully. Without `SUPABASE_URL` /
  `SUPABASE_ANON_KEY` it uses a local JSON store. No `.env` is required to run.
- Data store: in dev, state persists to `db_cine_react.json` in the repo root (this file is
  git-tracked and seeded). Runtime actions (e.g. registering a user) mutate it — revert it
  with `git checkout -- db_cine_react.json` before committing so test data isn't committed.
- Port 3000 is hardcoded in `server.ts`.
- On startup the server makes outbound YouTube calls to sync channel avatars; these logs are
  normal and non-fatal if the network blocks them.
