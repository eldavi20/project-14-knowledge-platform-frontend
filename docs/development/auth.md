# Authentication Flow & Architecture

**Status:** Current as of 2 Nov 2026. This document reflects the live frontend implementation in this repo: login/logout, proxy route guards, dashboard access, and the current signup stub status.

**Stories:** US-74 (Frontend Setup & Login) · US-105 (Employee Signup) · US-110 (Verification, Logout & Docs)<br>
**Date:** 27 Oct 2026 · **Last verified:** 2 Nov 2026<br>
**Purpose:** End-to-end documentation of the frontend authentication lifecycle, session management with Supabase SSR, route protection, containerization, and automated Playwright testing.

---

## 1. Story Context & Inter-Story Relationships

The frontend authentication and user onboarding architecture spans three interconnected stories:

### Breakdown by User Story

- **US-74 (Frontend Foundation & Login):**
  - Initialized Next.js App Router, shadcn/ui components, and route shells (T-75).
  - Implemented containerized production `Dockerfile` (T-76).
  - Built `/login` with React Hook Form + Zod and hooked it to Supabase SSR (`signInWithPassword`) in T-102.
  - Added edge `proxy.ts` for route protection and query parameter preservation (`?next=...`) in T-103.
- **US-105 (Employee Onboarding & Registration):**
  - **T-109 (Frontend, PR #6 - Merged):** Created the `/signup` page using shadcn/ui (`card`, `input`, `label`). Features client-side validation (email format, minimum 8-character password, password confirmation match), accessibility bindings (`aria-invalid`, `aria-describedby`), and a footer link back to `/login`. Submit is still a documented frontend stub; the backend `/api/auth/signup` endpoint exists but is not wired to this page yet.
  - **T-106 / T-107 / T-108 (Backend):** Implement Supabase user registration, duplicate email handling (HTTP 409 Conflict), and automated API tests.
- **US-110 (End-to-End Verification, Logout & Documentation):**
  - **T-111:** Playwright E2E automated test suite verifying unauthenticated redirects, invalid credentials, full browser login, and `/chat` deep linking.
  - **T-112:** Server action `logout()` using `supabase.auth.signOut()`, session cookie clearing, and dashboard UI button.
  - **T-113:** Complete architectural documentation and test guides (this file).

---

## 2. Key Architectural Components

| Component                 | File                                             | Responsibility                                                                                                                    | Story & Task Origin   |
| :------------------------ | :----------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------- | :-------------------- |
| **Edge Proxy**            | `proxy.ts` / `utils/supabase/middleware.ts` | Intercepts requests, validates session tokens, enforces route guards, and refreshes auth tokens before rendering.                 | US-74 (T-103)         |
| **Login Server Action**   | `app/login/actions.ts` (`login`)                 | Authenticates user via `signInWithPassword`, sets HTTP-only cookies, and safely redirects.                                        | US-74 (T-102)         |
| **Logout Server Action**  | `app/login/actions.ts` (`logout`)                | Revokes session via `signOut()`, deletes auth cookies, and revalidates Next.js layout cache.                                      | US-110 (T-112)        |
| **Server Client**         | `utils/supabase/server.ts`                       | Grants Server Components access to Supabase via cookies (`cookies()`).                                                            | US-74 (T-102)         |
| **Browser Client**        | `utils/supabase/client.ts`                       | Grants Client Components browser-level Supabase access.                                                                           | US-74 (T-102)         |
| **Login Page**            | `app/login/page.tsx`                             | Accessible login form with React Hook Form, Zod validation, and error alert banners.                                              | US-74 (T-102)         |
| **Signup Page**           | `app/signup/page.tsx`                            | Client form with email, password (min 8), and confirm-password validation. Submit is still stubbed; backend endpoint exists but is not wired. | US-105 (T-109, PR #6) |
| **Protected Dashboard**   | `app/dashboard/page.tsx`                         | Server Component with `<Suspense>` streaming displaying user identity (`user-email`), role (`user-role`), and the Log out button. | US-110 (T-111, T-112) |
| **Production Dockerfile** | `Dockerfile`                                     | Multi-stage Node.js build for production deployment.                                                                              | US-74 (T-76)          |
| **E2E Test Suite**        | `e2e/auth.spec.ts`                               | Playwright test suite covering all positive, negative, redirect, deep-link, and logout scenarios.                                 | US-110 (T-111, T-112) |

---

## 3. End-to-End Sequence Diagrams

### Diagram 1: Unauthenticated Route Guard & Deep Linking

```text
Browser / User                     Next.js Middleware                  /login Page
      │                                    │                                │
   1. │ ─── GET /dashboard (no cookies) ─▶ │                                │
      │                                    │ 2. Check cookies:              │
      │                                    │    No active session found     │
   3. │ ◀── 307 Redirect (/login?next=...)─│                                │
      │                                                                     │
   4. │ ─── GET /login?next=/dashboard ───────────────────────────────────▶ │
      │ ◀── Render Login Form with ?next preserved ──────────────────────── │
```

### Diagram 2: Login & Session Establishment

```text
User / Browser               /login Page           login() Server Action      Supabase Auth Server       /dashboard
      │                           │                         │                          │                      │
   1. │ ── Fill email/password ─▶ │                         │                          │                      │
   2. │ ── Click "Sign in" ─────▶ │ ── POST Server Action ─▶│                          │                      │
      │                           │    with credentials     │                          │                      │
      │                           │                         │ ── signInWithPassword ─▶ │                      │
      │                           │                         │                          │                      │
      │                           │                         │ ◀── Auth Session + JWT ──│                      │
      │                           │                         │                          │                      │
      │                           │                         │ 3. Set HTTP-only cookies │                      │
      │                           │                         │ 4. Sanitize ?next param  │                      │
   5. │ ◀── 303 Redirect to destination (/dashboard) ──────│                          │                      │
      │                                                                                │                      │
   6. │ ── GET /dashboard (with auth cookies) ──────────────────────────────────────────────────────────────▶ │
      │                                                                                │                      │ 7. getUser()
      │                                                                                │ ◀── User Data ────── │
   8. │ ◀── Render Dashboard with user email & role ("authenticated") ─────────────────────────────────────── │
```

### Diagram 3: Logout & Session Invalidation

```text
User / Browser               /dashboard            logout() Server Action     Supabase Auth Server       Middleware / Login
      │                           │                         │                          │                          │
   1. │ ── Click "Log out" ─────▶ │ ── POST Server Action ─▶│                          │                          │
      │                           │    logout()             │                          │                          │
      │                           │                         │ ── supabase.signOut() ─▶ │                          │
      │                           │                         │ ◀── Session Revoked ─────│                          │
      │                           │                         │                                                     │
      │                           │                         │ 2. Clear auth cookies                               │
      │                           │                         │ 3. revalidatePath('/', 'layout')                    │
   4. │ ◀── 303 Redirect to /login ─────────────────────────│                                                     │
      │                                                                                                           │
      │ 5. Subsequent access blocked:                                                                             │
   6. │ ── Attempt GET /dashboard (or click browser Back button) ───────────────────────────────────────────────▶ │
      │                                                                                                           │ 7. No cookies
   8. │ ◀── 307 Redirect to /login?next=/dashboard ────────────────────────────────────────────────────────────── │
```

---

## 4. Route Access Matrix

| Route        | Access Level | Unauthenticated Behavior                                             | Authenticated Behavior                            | Implementation Status                                                |
| :----------- | :----------- | :------------------------------------------------------------------- | :------------------------------------------------ | :------------------------------------------------------------------- |
| `/`          | Public       | Allowed (renders landing page with "Log in" and "Dashboard" buttons) | Allowed                                           | Active                                                               |
| `/login`     | Guest Only   | Allowed (renders sign-in form)                                       | Redirects to `/dashboard`                         | Active (US-74 T-102)                                                 |
| `/signup`    | Guest Only   | Allowed (client validation active; submit is stubbed)                | Redirects to `/dashboard`                         | Frontend merged (PR #6 / T-109); backend `/api/auth/signup` exists, frontend wiring pending |
| `/dashboard` | Protected    | Redirects to `/login?next=/dashboard`                                | Allowed (displays user profile & Log out button)  | Active (US-110 T-111, T-112)                                         |
| `/chat`      | Protected    | Redirects to `/login?next=/chat`                                     | Allowed                                           | Active page shell (T-75)                                             |
| `/admin/*`   | Protected    | Redirects to `/login?next=/admin/...`                                | Allowed (pending RBAC role check in future story) | Page shell (T-75)                                                    |

---

## 5. Environment Variables

Ensure `.env.local` in `project-14-knowledge-platform-frontend` contains:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-publishable-key>
NEXT_PUBLIC_API_URL=http://localhost:8000
```

If you run the Playwright auth suite against a specific environment, you can also set:

```bash
E2E_USER_EMAIL=test@example.com
E2E_USER_PASSWORD=Password123!
```

Test credentials used by automated Playwright E2E suites:

```bash
E2E_USER_EMAIL=test@example.com
E2E_USER_PASSWORD=Password123!
```

---

## 6. Testing & Quality Verification

### Automated Playwright Tests (`e2e/auth.spec.ts`)

Run all end-to-end tests from `project-14-knowledge-platform-frontend`:

1. **Headless Execution (CI mode):**
   ```bash
   npm run test:e2e
   ```
2. **Visual Headed Mode (Watch tests run in real browser):**
   ```bash
   npx playwright test --headed
   ```
3. **Interactive UI Mode (Step-by-step debugger & DOM inspection):**
   ```bash
   npx playwright test --ui
   ```

### Scenarios Covered

1. **Unauthenticated Guard:** Visiting `/dashboard` without session redirects to `/login?next=%2Fdashboard` and renders the sign-in form.
2. **Invalid Credential Handling:** Submitting wrong credentials shows `[data-testid="auth-error-alert"]` with `"Invalid login credentials"` and preserves the login page.
3. **Full Login & Role Display:** Opening `/` $\rightarrow$ clicking "Log in" $\rightarrow$ submitting valid credentials $\rightarrow$ redirecting to `/dashboard` $\rightarrow$ verifying `[data-testid="user-email"]` and `[data-testid="user-role"]` (`authenticated`).
4. **Deep-Link Preservation:** Accessing `/chat` unauthenticated $\rightarrow$ redirects to `/login?next=%2Fchat` $\rightarrow$ authenticating $\rightarrow$ forwards directly to `/chat`.
5. **Logout & Session Destruction:** Authenticating $\rightarrow$ clicking "Log out" $\rightarrow$ verifying redirect to `/login` $\rightarrow$ verifying cookies are wiped $\rightarrow$ verifying re-accessing `/dashboard` redirects to `/login?next=%2Fdashboard`.

---

## 7. Security Invariants

- **HTTP-only Cookies:** Session tokens are stored in secure cookies via `@supabase/ssr`; client JavaScript cannot access raw JWTs.
- **Fail-Closed Redirection:** In `proxy.ts`, any protected route fails closed if `user` is null or invalid.
- **Open Redirect Protection:** The `next` parameter is validated to ensure it starts with `/` and not `//` before executing redirects post-login.
- **Cache Revalidation on Logout:** Calling `revalidatePath('/', 'layout')` ensures all server-rendered layouts and dynamic components purge cached user state upon sign-out.

---

## 8. Current Backend Integration Status

The frontend and backend auth paths are not fully wired yet. Current behavior:

| Flow | Backend | Frontend |
| :--- | :--- | :--- |
| Login | `POST /api/auth/login` exists and returns a Supabase access token | Login uses Supabase SSR `signInWithPassword()` directly; it does not call `/api/auth/login` |
| Signup | `POST /api/auth/signup` exists, creates the Supabase user plus app `users` / `profiles` rows, and returns 201/409/400/500 responses | `/signup` is still a client-side stub; it does not call the backend endpoint yet |
| Current user | `GET /api/auth/me` exists and requires a Bearer token; returns profile fields and 403 for inactive accounts | Dashboard uses `supabase.auth.getUser()` directly and displays email/role from Supabase user data; it does not call `/api/auth/me` |
| Logout | No backend logout endpoint | `logout()` calls `supabase.auth.signOut()`, revalidates the layout, and redirects to `/login` |

Authorization remains backend-owned. The frontend proxy only checks whether a Supabase session exists; it does not grant or evaluate document permissions. The frontend must never be treated as the source of truth for roles, groups, or ACLs.

Live signup can still be blocked by Supabase email-confirmation settings or rate limits even though the backend endpoint exists. The backend returns a verification message rather than assuming the account is immediately usable.
