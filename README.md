# ihostit.app

Discover and explore self-hosted software curated from the awesome-selfhosted list. This app fetches, parses, and presents categorized apps with links to source, websites, and live demos.

Notes:
- Runs entirely in the browser (no backend). Data is cached locally (localStorage) after parsing the upstream README.
- Includes a lightweight in-browser database layer that mirrors a SQLite-style API for future migration.
- A background scheduler uses `setInterval` in the browser to periodically refresh data.

## Quick Start

- Requirements: Node.js 18+

Commands:
- `npm install`
- `npm run dev` — start Vite dev server
- `npm run build` — production build
- `npm run preview` — preview built assets

## Data Flow

- `src/services/github.ts` fetches the awesome-selfhosted README and parses categories and apps.
- `src/db/browserDatabase.ts` persists categories/apps/sync metadata in localStorage.
- `src/services/syncService.ts` orchestrates syncing parsed data into the local DB.
- `src/services/scheduler.ts` periodically checks if a refresh is due and triggers a sync.
- `src/hooks/useAwesomeSelfHosted.ts` reads from the DB and exposes UI-friendly structures.

## Development Notes

- This project uses path alias `@` mapped to `src/` (see `vite.config.ts`).
- The UI guards demo/website/source links to avoid confusing duplicate repo links and only shows a Play button for real demos.

## License

This project is licensed under the Creative Commons Attribution-ShareAlike 3.0 Unported license (CC BY-SA 3.0).

- You must provide attribution and indicate changes.
- Derivatives must be licensed under the same terms.

See `LICENSE` or https://creativecommons.org/licenses/by-sa/3.0/ for details.

Attribution: Portions of the data are derived from the awesome-selfhosted project.
