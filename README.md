# Project 14 - Knowledge Platform Frontend

Frontend for the knowledge platform project. This repository is a Next.js App Router application that provides the browser interface for authentication, protected routes, and the user dashboard experience.

## Current Status

This project is currently in a sprint-ready auth-and-shell phase. The repo contains the working frontend foundation for:

- Supabase-powered login with HTTP-only session cookies
- Protected routes and redirect handling for authenticated users
- Dashboard/profile view after sign in
- Chat and admin route shells
- Playwright end-to-end authentication testing

The following remain intentionally stubbed or pending backend hookup:

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
├── app/                           # App Router pages and route shells
│   ├── admin/users/page.tsx
│   ├── chat/page.tsx
│   ├── dashboard/page.tsx
│   ├── login/actions.ts
│   ├── login/page.tsx
│   ├── page.tsx
│   ├── signup/page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── ...
├── components/                    # Reusable UI primitives
│   └── ui/
├── docs/                          # Project documentation and research notes
│   ├── development/
│   └── research/
├── e2e/                           # Playwright tests
├── lib/                           # Shared utilities and API helpers
├── public/                        # Static assets
├── utils/supabase/                # Supabase client/server helpers
├── .env.example                   # Local environment template
├── .github/pull_request_template.md
├── AGENTS.md
├── Dockerfile
├── middleware.ts                  # Protected-route middleware
├── next.config.ts
├── package.json
├── playwright.config.ts
├── README.md
├── tsconfig.json
└── ...
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

- middleware blocks unauthenticated users from protected pages
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

This repo is intended to be deployed to Vercel. The current project is still in the frontend foundation and auth-validation stage, so deployment should be treated as a preview environment until the remaining knowledge-platform features are implemented.

## Sprint Readiness / Next Steps

The backlog for the next sprint should focus on:

1. Completing the `/signup` backend registration flow
2. Building the real `/chat` experience against the backend
3. Adding role-aware admin functionality under `/admin`
4. Expanding the API integration pattern beyond the current auth shell
5. Updating route metadata and app branding for the production product

## Pull Requests

PRs should use the local template at [`.github/pull_request_template.md`](./.github/pull_request_template.md). The template covers summary, story linkage, what changed, how to test, accessibility considerations, and reviewer checklists.
