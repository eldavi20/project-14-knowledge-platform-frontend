# Project 14 — Knowledge Platform Frontend

**SER 401 — Software Engineering Project**

Frontend for the knowledge platform project. This repository is a Next.js App Router application that provides the browser interface for authentication, protected routes, and the user dashboard experience.

## Current Status

This project is currently in an authentication and app-shell phase. The repository contains the working frontend foundation for:

- Supabase-powered login with HTTP-only session cookies
- Protected routes and redirect handling for authenticated users
- Dashboard/profile view after sign in
- Chat and admin route shells
- Playwright end-to-end authentication testing

The following remain intentionally stubbed or pending backend integration:

- `/signup` submission is currently a frontend validation stub and does not yet call a registration endpoint
- chat and admin pages are placeholder shells rather than full knowledge workflows
- knowledge retrieval, permissions, and document ingestion are not yet wired into this frontend

## Technology Stack

- Framework: [Next.js 16](https://nextjs.org/) (App Router)
- Runtime: [React 19](https://react.dev/)
- Language: [TypeScript](https://www.typescriptlang.org/)
- Styling: [Tailwind CSS](https://tailwindcss.com/)
- UI: [shadcn/ui](https://ui.shadcn.com/)
- Auth: [Supabase Auth](https://supabase.com/auth)
- Testing: [Playwright](https://playwright.dev/)
- Deployment target: [Vercel](https://vercel.com/)

## Repository Purpose

This repository is the browser-facing part of the platform. It is designed to:

- present the app shell and landing page
- enable secure sign-in and sign-out through Supabase SSR
- protect authenticated pages and preserve deep links via `?next=` redirects
- provide a base for future chat, admin, and document-management features

## Project Structure

```text
project-14-knowledge-platform-frontend/
├── app/                           # App Router pages, layouts, and server actions
│   ├── admin/                     # Admin shell and user-management route
│   ├── chat/                      # Chat route shell
│   ├── dashboard/                 # Authenticated profile view
│   ├── login/                     # Sign-in page and server actions
│   ├── signup/                    # Signup form with pending backend wiring
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── admin/                     # Admin dashboard components
│   └── ui/                        # shadcn/ui primitives
├── docs/                          # Architecture, development, planning, and research docs
├── e2e/                           # Playwright end-to-end tests
├── hooks/useAuth.ts               # Shared authentication state
├── lib/                           # API client, Supabase client, and utilities
├── tests/hooks/                   # Vitest unit tests
├── utils/supabase/                # Supabase client, server, and middleware helpers
├── .env.example                   # Local environment template
├── .github/pull_request_template.md
├── AGENTS.md
├── Dockerfile
├── proxy.ts                       # Protected-route and session-refresh proxy
├── next.config.ts
├── package.json
├── playwright.config.ts
├── README.md
├── tsconfig.json
├── vitest.config.ts
└── vitest.setup.ts
```

## Current Feature Set

### Authenticated user experience

- `/` landing page with login CTA
- `/login` with client-side validation and server action sign-in
- `/dashboard` protected profile page with user email and role
- `/chat` protected route shell
- `/admin/users` protected route shell
- `/signup` UI with validation and messaging that the backend connection is pending

### Security behavior

- `proxy.ts` blocks unauthenticated users from protected pages
- successful login preserves a deep-link destination through `?next=`
- signed-out users are redirected back to `/login`
- protected routes redirect guests to the correct login page

## Requirements

Use Node.js 20+ and npm.

## Environment Variables

Create a local `.env.local` file in the project root based on `.env.example`.

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-publishable-key>
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Notes:

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are required for Supabase Auth.
- `NEXT_PUBLIC_API_URL` is used by the frontend API helper when calling the backend and may be adjusted when the backend is running elsewhere.
- Playwright auth tests may also use `E2E_USER_EMAIL` and `E2E_USER_PASSWORD` if you want to override the default credentials.

## Local Setup

```bash
git clone https://github.com/eldavi20/project-14-knowledge-platform-frontend.git
cd project-14-knowledge-platform-frontend
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Running the App

```bash
npm run dev
```

For a production build:

```bash
npm run build
npm run start
```

## Testing

Run the end-to-end auth suite:

```bash
npm run test:e2e
```

This covers unauthenticated route redirects, invalid credentials, successful login, deep-link preservation, and logout behavior.

## Deployment Notes

This repository is intended to be deployed to Vercel. The project is still in the frontend foundation and authentication-validation stage, so deployment should be treated as a preview environment until the remaining knowledge-platform features are implemented.

## Sprint Readiness and Next Steps

The backlog for the next sprint should focus on:

1. Completing the `/signup` backend registration flow
2. Building the real `/chat` experience against the backend
3. Adding role-aware admin functionality under `/admin`
4. Expanding the API integration pattern beyond the current auth shell
5. Updating route metadata and app branding for the production product

## Pull Requests

Pull requests must use the local template at [`.github/pull_request_template.md`](./.github/pull_request_template.md). The template covers the summary, story linkage, changed files, testing, accessibility considerations, and reviewer checklist.

Branch names follow `<type>/us-<story>-t-<task>-<short-description>`, and commit messages follow Conventional Commits as defined in the project's pull request process documentation.

## Documentation

- [`docs/START_HERE.md`](docs/START_HERE.md) — documentation index and reading path.
- [`docs/development/DOCUMENTATION_STYLE.md`](docs/development/DOCUMENTATION_STYLE.md) — shared backend and frontend style guide.
- [`docs/development/auth.md`](docs/development/auth.md) — authentication flow and backend integration status.
- [`docs/architecture/REPOSITORY_STRUCTURE.md`](docs/architecture/REPOSITORY_STRUCTURE.md) — current and target repository layout.

The project is intentionally kept minimal at this stage. Additional components will be added as development progresses.
