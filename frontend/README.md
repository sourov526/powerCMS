# Frontend Worker Boundary

This folder is the **user panel worker** boundary.

Ownership:
- User-facing pages/components/content rendering
- Public routes and UI state

Primary folders:
- `frontend/app`: public route tree
- `frontend/components`: public/shared UI components
- `frontend/lib`: frontend runtime helpers
- `frontend/public`: public static assets
- `frontend/styles`: stylesheets

Run from root:
- `bash run.sh dev`
- `bash run.sh prod`

Runtime/storage policy:
- Local: Node.js runtime + local sqlite `data/dev.db`

# Rendering strategy (App Router)

This Next.js app intentionally mixes **Static**, **ISR/SSG**, and **SSR**:

- `frontend/app/admin/**` is always **SSR** (request-time) to keep auth/role checks and fresh admin data.
- The public/user site is intentionally minimal (only `/` and `/category/news`).

## Route classification map

| Route pattern | Mode | Implementation |
|---|---:|---|
| `frontend/app/admin/**` | SSR | `export const dynamic = "force-dynamic"` on admin pages/layout |
| `/api/*` | SSR | `frontend/app/api/[...path]/route.ts` is `force-dynamic` |
| `/` | Static | Server Components (no request-time APIs) |
| `/category/news` | ISR | `export const revalidate = 300` |

## Loading skeletons

Skeleton boundaries live in `loading.tsx`:

- Public: `frontend/app/loading.tsx`, `frontend/app/category/news/loading.tsx`
- Admin: `frontend/app/admin/loading.tsx` + per-section loadings (`posts`, `users`, `contact`)

## Admin mutations → public revalidation

On publish/archive/delete, admin endpoints call `revalidatePath()` to refresh public ISR pages:

- Posts: `api/admin/posts/*/route.ts` revalidates `/category/news`, `/sitemap`, `/<post-slug>`, and `/category/<slug>`.
- Recruit posts: `api/admin/recruit-posts/*/route.ts` revalidates `/recruit`, `/sitemap`, and `/recruit/<slug>`.
- Categories: `frontend/app/admin/categories/page.tsx` server actions revalidate `/category/*` and `/sitemap`.
