# Next.js Tutorial Summary — Lana Ghanim

> Note: This is a historical learning summary from the Next.js tutorial. It documents the concepts learned during research and should not be treated as the current architecture source of truth. Use the project README and auth documentation for the active sprint implementation.

**Story:** US-130 — Build upon basic Next.js knowledge for production-ready frontend work
**Task:** T-48 [Lana] Complete the official tutorial and write a summary
**Tutorial:** https://nextjs.org/learn

## What I Learned

- The App Router uses folders to define routes — `app/page.tsx` is `/`, `app/about/page.tsx` is `/about`.
- Layouts wrap pages and persist across navigation — `app/layout.tsx` is shared UI for all routes.
- Server Components run on the server by default; Client Components need `"use client"` for interactivity.
- Data fetching happens in Server Components by default using `async`/`await`.
- Deployment to Vercel is automatic when you push to the connected repo.

## Other Next.js Features

- **Linking:** `next/link` enables fast client-side navigation without full page reloads.
- **Images:** `next/image` auto-optimizes images (resizing, lazy loading, modern formats).
- **Fonts:** `next/font` self-hosts Google fonts with zero layout shift (used in `app/layout.tsx` with Geist + Inter).
- **Dynamic routes:** `app/blog/[id]/page.tsx` handles `/blog/1`, `/blog/2` via `params`.
- **Route groups:** `(auth)/login/page.tsx` organizes routes without changing the URL.
- **Loading / error states:** `loading.tsx`, `error.tsx`, and `not-found.tsx` add built-in UI for each route.
- **Metadata:** `export const metadata` in a page/layout sets `<title>` and SEO tags.
- **Route handlers:** `app/api/hello/route.ts` with `GET()` / `POST()` creates backend endpoints for the FastAPI / Supabase calls.
- **Server Actions:** `"use server"` functions let forms call backend code directly without an API route.
- **Rendering:** SSG (static), SSR (per-request), and ISR (`revalidate`) control freshness vs. speed.
- **Middleware:** `middleware.ts` runs before a request — useful for auth checks with Supabase tokens.

## Next Usage in This Project

- Pages go in `app/` — this repo currently has only `app/page.tsx` and `app/layout.tsx`.
- Shared UI goes in `app/layout.tsx` and reusable UI goes in `components/ui/`.
- Styling uses Tailwind CSS via `app/globals.css`.
- Fonts are loaded in `app/layout.tsx` via `next/font/google`.
- Env config uses `.env` based on `.env.example` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
- Future work: `app/(auth)/login/page.tsx`, `app/api/` route handlers to call FastAPI, and `middleware.ts` for Supabase session checks.

Refs: US-130, T-48, #130
