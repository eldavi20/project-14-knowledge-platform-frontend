# Next.js Tutorial Summary — Ahmed Sawy

**Story:** US-130 — Build upon basic Next.js knowledge for production-ready frontend work
**Task:** T-51 [Ahmed] Complete the official tutorial and write a summary
**Tutorial:** https://nextjs.org/learn 

## What I Learned

**Foundations (chapters 1–5)**

- The course starts from a starter project: prebuilt UI in `app/ui`, data helpers in `app/lib`, static files in `public`. It runs with `pnpm i` and `pnpm dev`.
- `global.css` is imported once in the root layout. Styling is done with Tailwind utility classes or scoped CSS Modules, and `clsx` toggles classes by condition (for example the paid vs. pending invoice badge).
- `next/font` downloads fonts at build time and serves them with the app, which avoids layout shift. `next/image` handles resizing, lazy loading and modern formats once `width` and `height` are set.
- A folder in `app/` is a route segment and needs a `page.tsx` to be reachable. `layout.tsx` wraps its child pages and stays mounted when navigating (partial rendering).
- `<Link>` gives client-side navigation with code splitting and prefetching. `usePathname()` is a hook, so the file needs `"use client"`; it is used to highlight the active link.

**Data (chapters 6–10)**

- A Postgres database is created, its secrets go into `.env` (kept out of git), and a seed route fills it with placeholder data.
- Server Components can `await` database queries directly, so no `useEffect` is needed. Independent queries should run together with `Promise.all` to avoid request waterfalls.
- Static rendering builds a page once and serves it from cache; dynamic rendering builds it per request. A dynamic page is only as fast as its slowest fetch.
- Streaming fixes that: `loading.tsx` wraps a whole page in Suspense, and `<Suspense fallback={...}>` streams single components behind loading skeletons. Route groups like `(overview)` limit where a `loading.tsx` applies without changing the URL.
- Search and pagination keep their state in the URL (`useSearchParams`, `usePathname`, `useRouter`, and the `searchParams` prop in Server Components). `useDebouncedCallback` avoids a query on every keystroke.

**Mutations, errors and polish (chapters 11–15)**

- Server Actions (`"use server"`) receive `FormData` from a form's `action`. Input is validated with Zod, money is stored in cents, and `revalidatePath` plus `redirect` refresh the list. Editing uses a dynamic `[id]` route and `bind` to pass the id; deleting skips `redirect` because the user stays on the page.
- Error handling has three layers: `try/catch` around database calls (with `redirect` placed after it), `error.tsx` as a client-side boundary with a `reset` function, and `notFound()` with `not-found.tsx` for missing records.
- Accessibility: `eslint-plugin-jsx-a11y` through `pnpm lint`, labels tied to inputs, server-side validation with `useActionState` and `safeParse`, and `aria-describedby` / `aria-live` so screen readers announce field errors.
- Authentication uses NextAuth.js: shared config in `auth.config.ts`, route protection in `proxy.ts` (the newer name for middleware), a Credentials provider with a bcrypt check in `auth.ts`, and sign-in and sign-out through Server Actions.
- Metadata comes from an exported `metadata` object or `generateMetadata`, from file conventions such as `favicon.ico` and `opengraph-image.jpg`, and from a title template (`%s | Acme Dashboard`) in the root layout.

## Other Next.js Features

- **Route handlers:** an `app/.../route.ts` file defines an API endpoint inside the app (the tutorial uses one to test the database query).
- **Server vs. Client Components:** pages stay on the server by default; only the interactive pieces (search box, pagination, nav links, forms with state) become Client Components.
- **Skeletons:** loading placeholders that match the final layout, used as Suspense fallbacks.
- **Dynamic Open Graph images:** the `ImageResponse` constructor can generate link-preview images instead of a static file.
- **SEO files:** `robots.txt` and `sitemap.xml` are also handled through file conventions.
- **Linting:** `pnpm lint` runs the Next.js ESLint config, which includes accessibility checks.

## Next Usage in This Project

- Our frontend runs Next.js 16.4.0, React 19.3.0, Tailwind CSS v4 and shadcn/ui, so I will follow these patterns but check version differences against the docs.
- The tutorial queries a database from Server Components. We will not do that: data comes from the FastAPI backend (for example `POST /api/auth/login` and `POST /api/chat`), so fetches go through a shared API client.
- Login and Chat pages need forms with validation, pending and error states. Validation on the frontend is only for user experience; the real authorization check stays in the backend, and the frontend must never enforce permissions.
- Protected pages can use the `proxy.ts` pattern to redirect users without a valid session to `/login`.
- Admin pages (document list, audit log) can use search and pagination in URL params, plus Suspense skeletons for the tables.
- The chat page can use streaming and Suspense ideas for loading states, and `error.tsx` / `not-found.tsx` for failures, alongside the refusal message the backend returns.

Refs: US-130, T-51, #130
