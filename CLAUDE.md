# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A personal, offline-first workout log built as an installable PWA for iPhone. No backend, no accounts — all data lives in the browser's IndexedDB. React + Vite, deployed as a static site to GitHub Pages.

## Commands

```bash
npm run dev       # start Vite dev server (port 5173)
npm run build     # production build to dist/
npm run preview   # preview the production build
npm run lint      # oxlint
npm run icons     # regenerate PWA icons (scripts/gen-icons.mjs) from public/ source
npm run deploy    # build + publish dist/ to gh-pages branch (manual alternative to CI)
```

There is no test suite configured in this repo.

Deployment to GitHub Pages normally happens automatically via `.github/workflows/deploy.yml` on push to `main` (builds and deploys through GitHub Actions, not the `gh-pages` npm script).

## Architecture

**Data layer (`src/db.js`)** — the single source of truth for persistence. Wraps IndexedDB (via `idb`) with three object stores: `exercises`, `sessions`, `entries` (an entry is one logged set, linked to a session and an exercise). All reads/writes go through exported functions here (`getExercises`, `addSession`, `deleteSession`, `exportAll`/`importAll` for backup, etc.) — components never touch IndexedDB directly. The DB is versioned (`DB_VERSION`) with an `upgrade()` migration function; it also seeds a large built-in exercise catalog on first run / version bump.

**No router.** `src/App.jsx` holds a single `view` state object (`{ name, ...params }`) and switches over `view.name` to pick which page component to render (`sessions`, `newSession`, `progress`, `exercises`, `settings`). Navigation is just calling `setView(...)` — there are no URLs/routes.

**Pages vs components.** `src/pages/*` are the top-level screens rendered by `App.jsx`; each owns its own data loading via `useEffect` + `db.js` calls and manages its own local state (no global store/context). `src/components/*` are reusable pieces shared across pages (e.g. `ExercisePicker`, `Modal`, `NavBar`, `Toast`).

**`src/lib/`** holds pure, side-effect-free helper logic split out of components:
- `progress.js` — `evaluateProgress()` compares a new set against prior history to flag PRs / "beat last time".
- `fuzzySearch.js` — typo-tolerant exercise name search (substring + Levenshtein) used by `ExercisePicker`.
- `date.js` — local-timezone-safe date helpers (`today()`, `formatDate()`); dates are stored as `YYYY-MM-DD` strings.
- `backup.js` — JSON export/import (download-as-file and restore-from-file) built on `db.js`'s `exportAll`/`importAll`.

**PWA config** lives in `vite.config.js` (via `vite-plugin-pwa`) — `base: '/workout-tracker/'` matches the GitHub Pages subpath, so this must stay in sync with the repo name if it ever changes.

## Conventions observed in this codebase

- Functional components with hooks; no class components, no external state management library.
- Weights are stored in kilograms (`weightKg`) regardless of display.
- IDs are generated client-side with `crypto.randomUUID()`.
- Styling is plain CSS in `src/index.css` (terminal/cyberpunk theme) using utility-ish class names (`card`, `field`, `btn-primary`, `btn-text`, `muted`, etc.) rather than CSS modules or a CSS-in-JS library.
