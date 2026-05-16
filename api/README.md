# API Boundary

Backend/tRPC boundary used by `frontend` and `admin`.

Primary folders:

- `api/trpc`: tRPC context, procedures, server setup
- `api/routers`: tRPC routers
- `api/services`: business logic
- `api/utils`: helper utilities
- `api/libs`: reusable backend/internal libraries
- `api/db`: schema and database assets
- `api/middleware`: backend middleware
- `api/scripts`: runnable scripts
- `api/app`: route handlers mounted as `/api/*`

Run from root:

- `bash run.sh dev`

Runtime/storage policy:

- `dev`: Node.js runtime + local sqlite `data/dev.db`
