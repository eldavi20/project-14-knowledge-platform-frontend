# Next.js Tutorial Summary — Lana Ghanim

**Story:** US-130 — Build upon basic Next.js knowledge for production-ready frontend work
**Task:** T-48 [Lana] Complete the official tutorial and write a summary
**Tutorial:** https://nextjs.org/learn

## What I Learned

- The App Router uses folders to define routes — `app/page.tsx` is `/`, `app/about/page.tsx` is `/about`.
- Layouts wrap pages and persist across navigation — `app/layout.tsx` is shared UI for all routes.
- Server Components run on the server by default; Client Components need `"use client"` for interactivity.
- Data fetching happens in Server Components by default using `async`/`await`.
- Deployment to Vercel is automatic when you push to the connected repo.

## Next Usage in This Project

- Pages go in `app/` — this repo currently has only `app/page.tsx` and `app/layout.tsx`.
- Shared UI goes in `app/layout.tsx` and reusable UI goes in `components/ui/`.
- Styling uses Tailwind CSS via `app/globals.css`.
- Env config uses `.env` based on `.env.example` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).

Refs: US-130, T-48, #130
