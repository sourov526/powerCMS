# Power CMS

Simplified Next.js + API project for:

- Root page (`/`)
- Admin panel (`/admin`)

The API is served through `frontend/app/api/[...path]/route.ts` and routes into `api/`.

## Project Structure

- `frontend/` - Next.js app (root page + admin UI)
- `api/` - backend routes, services, DB schema/migrations
- `data/` - local SQLite database (default: `data/dev.db`)
- `scripts/` - local DB/init and utility scripts

## Requirements

- Node.js 20+
- npm

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create local env files:

```bash
cp api/example.env.local api/.env.local
cp frontend/example.env.local frontend/.env.local
```

3. (Optional) edit `api/.env.local`:

```env
AUTH_SECRET=change-me-local
LOCAL_DB_PATH=data/dev.db
ROOT_USER_EMAIL=sourov@admin.com
ROOT_USER_PASSWORD=sourov@admin.com
```

## Run

Development:

```bash
npm run dev
```

Direct build/start:

```bash
npm run build
npm run start
```

App URLs:

- Root: `http://localhost:3000/`
- Admin: `http://localhost:3000/admin`

## Database

- Local DB is SQLite.
- Default path is `data/dev.db` (configurable via `LOCAL_DB_PATH`).
- On `npm run dev`, `scripts/init-local-db.js` creates the DB automatically if missing and applies `api/db/migrations/*.sql`.

## Authentication

Initial admin credentials are read from:

- `ROOT_USER_EMAIL`
- `ROOT_USER_PASSWORD`

These should be set in `api/.env.local`.
