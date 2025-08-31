# ihostit.app

Discover and explore self-hosted software curated from the awesome-selfhosted list. The backend syncs and stores data in SQLite; the React frontend consumes a simple HTTP API.

Highlights:
- Server-side SQLite (better-sqlite3): fast, reliable, single-file DB.
- Scheduled sync on the server via cron to keep data fresh.
- Client fetches pre-parsed categories and apps from `/api` endpoints.

## Quick Start (Dev)

- Requirements: Node.js 18+

Commands:
- `npm install`
- `npm run build:server` — compile the Node API
- `npm run start:server` — start the Node API (defaults to http://localhost:8787)
- `npm run dev` — start Vite dev server (proxies `/api` to 8787)
- `npm run build` — production build of the client
- `npm run preview` — preview built assets

## Data Flow

- Server:
  - `server/index.ts` exposes `/api` routes.
  - `server/sync.ts` runs the sync, writing to SQLite via `src/db/database.ts`.
  - `src/db/database.ts` is the Node-only DB service (better-sqlite3).
  - A cron job runs daily at 02:00 UTC to refresh data.
- Client:
  - `src/services/github.ts` contains the parser used by the server.
  - `src/hooks/useAwesomeSelfHosted.ts` fetches `{ categories, apps }` from `/api/data`.
  - UI components render cards and links.

Note: A browser-only localStorage DB was replaced in favor of server-side SQLite.

## Deploying on Ubuntu (outline)

1) Install Node.js 18+ and build:
- `npm ci`
- `npm run build` and `npm run build:server`

2) Run the API (behind a process manager like systemd/PM2):
- `node server-dist/server/index.js`

3) Serve the client (static hosting or reverse proxy):
- `npm run preview` or host `dist/` via Nginx/Apache and proxy `/api` to the API port.

## Development Notes

- This project uses path alias `@` mapped to `src/` (see `vite.config.ts`).
- The UI guards demo/website/source links to avoid confusing duplicate repo links and only shows a Play button for real demos.

## License

This project is licensed under the Creative Commons Attribution-ShareAlike 3.0 Unported license (CC BY-SA 3.0).

- You must provide attribution and indicate changes.
- Derivatives must be licensed under the same terms.

See `LICENSE` or https://creativecommons.org/licenses/by-sa/3.0/ for details.

Attribution: Portions of the data are derived from the awesome-selfhosted project.
