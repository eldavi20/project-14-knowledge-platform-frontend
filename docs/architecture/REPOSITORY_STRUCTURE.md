# Current and Target Repository Structure — Permission-Aware Knowledge Agent

**Project:** SER 401 — Project 14: Permission-Aware Knowledge Agent

**Date:** November 20, 2026 (Last Modified)

**Purpose:** Complete repository structure for the project, accurately reflecting the two-database architecture.

## Current Implementation Snapshot

This document includes a target architecture, but most of its proposed service
and retrieval modules do not exist yet. The current frontend layout is:

```text
project-14-knowledge-platform-frontend/
├── .github/
│   ├── workflows/
│   │   └── verify-pr-source.yml
│   └── pull_request_template.md
├── app/
│   ├── admin/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── users/
│   │   │   └── page.tsx
│   ├── chat/
│   │   └── page.tsx
│   ├── dashboard/
│   │   └── page.tsx
│   ├── login/
│   │   ├── actions.ts
│   │   └── page.tsx
│   ├── signup/
│   │   └── page.tsx
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── admin/
│   │   ├── AuditLog.tsx
│   │   ├── DocumentList.tsx
│   │   └── MetricsDashboard.tsx
│   ├── ui/
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── form.tsx
│   │   ├── input.tsx
│   │   └── label.tsx
├── docs/
│   ├── architecture/
│   │   ├── DATABASE_MIGRATIONS.md
│   │   ├── DATABASE_MODEL.md
│   │   ├── DATABASE_QUERIES.md
│   │   └── REPOSITORY_STRUCTURE.md
│   ├── development/
│   │   ├── auth.md
│   │   ├── ci.md
│   │   └── git-workflow.md
│   ├── evaluation/
│   │   └── EVALUATION_HARNESS.md
│   ├── planning/
│   │   ├── BUILD_PLAN.md
│   │   ├── PULL_REQUEST_PROCESS.md
│   │   ├── SCRUM_GUIDE.md
│   │   └── TAIGA_SETUP.md
│   ├── research/
│   │   ├── ci-docker-build.md
│   │   ├── hosting-options.md
│   │   ├── nextjs-tutorial-summary-ahmed.md
│   │   └── nextjs-tutorial-summary-lana.md
│   ├── retrieval/
│   │   ├── CONFLICT_DETECTION.md
│   │   ├── FRESHNESS_STALENESS_DETECTION.md
│   │   └── RETRIEVAL_QUALITY.md
│   ├── security/
│   │   ├── CALIBRATED_REFUSAL.md
│   │   ├── PERMISSION_AWARE_RETRIEVAL.md
│   │   └── RETRIEVAL_AUDIT.md
│   └── START_HERE.md
├── e2e/
│   └── auth.spec.ts
├── hooks/
│   └── useAuth.ts
├── lib/
│   ├── api.ts
│   ├── supabase.ts
│   └── utils.ts
├── tests/
│   ├── hooks/
│   │   └── useAuth.test.ts
├── utils/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── middleware.ts
│   │   └── server.ts
├── .dockerignore
├── .env.example
├── .gitignore
├── .nvmrc
├── AGENTS.md
├── Dockerfile
├── README.md
├── components.json
├── eslint.config.mjs
├── next.config.ts
├── package-lock.json
├── package.json
├── playwright.config.ts
├── proxy.ts
├── tsconfig.json
├── vitest.config.ts
└── vitest.setup.ts
```

---

## 1. Target Architecture Overview (Planned)

The repository is organized around a clear separation of responsibilities:

```text
Frontend (Next.js + shadcn/ui, separate repo → Vercel)
        ↓
FastAPI API Layer
        ↓
Authentication → PermissionService → SecureRetriever
        ↓
Retrieval Pipeline
  ├── Vector search
  ├── BM25 search
  ├── RRF fusion
  └── Reranker
        ↓
RAG / LangGraph
  ├── Freshness
  ├── Conflict
  ├── Evidence
  ├── Generate
  ├── Refuse
  └── Verify
        ↓
Supabase (Postgres source of truth)
        +
Vector DB (searchable projection)
```

**Core principle:** Supabase is authoritative. The vector DB is a derived projection. All retrieval passes through `SecureRetriever`, which enforces ACL filtering before any candidate is returned.

---

## 2. Proposed Future Repository Structure

Two repositories (sponsor decision, October 2026):

- **Frontend repo:** `project-14-knowledge-platform-frontend` (this repo — Next.js + shadcn/ui, Vercel)
- **Backend repo:** [`project-14-knowledge-platform`](https://github.com/lanaghanim/project-14-knowledge-platform) (FastAPI + Supabase + Pinecone, Docker)

Frontend Repository Layout:

```text
project-14-knowledge-platform-frontend/                ← (Next.js + shadcn/ui)
├── .github/
│   ├── workflows/
│   │   └── verify-pr-source.yml
│   └── pull_request_template.md
├── app/                              ← Next.js App Router
│   ├── admin/                ← Documents, ACLs, sync, metrics (Phases 2, 4, 7)
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── users/
│   │   │   └── page.tsx
│   ├── chat/
│   │   └── page.tsx                 ← Chat + chunks/citations (Phases 3, 5)
│   ├── dashboard/
│   │   └── page.tsx
│   ├── login/                ← Login via Supabase Auth (Phase 1)
│   │   ├── actions.ts
│   │   └── page.tsx
│   ├── signup/
│   │   └── page.tsx
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                           ← shadcn/ui
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── form.tsx
│   │   ├── input.tsx
│   │   └── label.tsx
│   ├── chat/
│   │   ├── ChatInput.tsx             ← Query input (Phase 3)
│   │   ├── MessageList.tsx           ← Message list (Phase 3)
│   │   ├── ChunkCard.tsx             ← Retrieved chunk display (Phase 3)
│   │   ├── MessageBubble.tsx
│   │   ├── CitationLink.tsx          ← Clickable citation (Phase 5)
│   │   ├── SourcePanel.tsx           ← Source side panel (Phase 5)
│   │   ├── RefusalMessage.tsx        ← Refusal display (Phase 5)
│   │   ├── FreshnessWarning.tsx      ← Freshness banner + badge (Phase 6)
│   │   ├── FreshnessBadge.tsx
│   │   └── ConflictNotice.tsx        ← Conflict display (Phase 6)
│   ├── admin/
│   │   ├── DocumentList.tsx          ← Document table (Phase 2)
│   │   ├── PermissionMatrix.tsx      ← ACL matrix (Phase 2)
│   │   ├── SourceList.tsx            ← Ingestion sources (Phase 4)
│   │   ├── SyncButton.tsx
│   │   ├── SyncStatus.tsx
│   │   ├── AuditLog.tsx              ← Query history (Phase 7)
│   │   ├── MetricsDashboard.tsx      ← Evaluation scores (Phase 7)
│   │   └── LeakGauge.tsx             ← 0% leakage gauge (Phase 7)
│   └── auth/
│       ├── UserSwitcher.tsx          ← Switch test users (Phase 3)
│       └── ProtectedRoute.tsx        ← Redirect if not logged in (Phase 1)
├── data/                               ← Test data
│   ├── evaluation/
│   │   └── golden_dataset.json
│   ├── fixtures/
│   │   ├── mock_users.json
│   │   └── mock_documents.json
│   └── sample_sources/
│       ├── google_drive/
│       └── discord/
├── docs/                               ← Documentation (actual layout)
│   ├── START_HERE.md                 ← Navigation hub
│   ├── planning/
│   │   ├── BUILD_PLAN.md
│   │   ├── SCRUM_GUIDE.md
│   │   ├── TAIGA_SETUP.md
│   │   └── PULL_REQUEST_PROCESS.md
│   ├── architecture/
│   │   ├── REPOSITORY_STRUCTURE.md    ← This file (canonical structure)
│   │   ├── DATABASE_MODEL.md          ← Schema overview
│   │   ├── DATABASE_MIGRATIONS.md     ← Migration guide notes
│   │   └── DATABASE_QUERIES.md        ← Query patterns
│   ├── security/
│   │   ├── PERMISSION_AWARE_RETRIEVAL.md
│   │   └── CALIBRATED_REFUSAL.md
│   ├── retrieval/
│   │   ├── RETRIEVAL_QUALITY.md
│   │   ├── FRESHNESS_STALENESS_DETECTION.md
│   │   └── CONFLICT_DETECTION.md
│   ├── evaluation/
│   │   └── EVALUATION_HARNESS.md
│   └── research/
│       ├── ci-docker-build.md
│       ├── hosting-options.md            ← Backend hosting comparison
│       ├── nextjs-tutorial-summary-ahmed.md
│       └── nextjs-tutorial-summary-lana.md
├── e2e/
│   └── auth.spec.ts
├── hooks/
│   ├── useAuth.ts                    ← Supabase Auth session (Phase 1)
│   ├── useChat.ts
│   └── useAudit.ts
├── lib/
│   ├── api.ts                        ← Backend client (Phase 1)
│   ├── supabase.ts                   ← Supabase browser client (Phase 1)
│   └── utils.ts
├── scripts/                            ← Utility scripts
│   ├── seed_db.py
│   ├── ingest_sample_sources.py
│   ├── run_evaluation.py
│   └── generate_diagrams.py
├── tests/
│   └── hooks/
│       └── useAuth.test.ts
├── utils/
│   └── supabase/
│       ├── client.ts
│       ├── middleware.ts
│       └── server.ts
├── .dockerignore
├── .env.example
├── .gitignore
├── .nvmrc
├── AGENTS.md
├── README.md
├── components.json
├── eslint.config.mjs
├── next.config.ts
├── package-lock.json
├── package.json
├── playwright.config.ts
├── proxy.ts
├── tsconfig.json
├── vitest.config.ts
└── vitest.setup.ts
```

Backend Repository Layout:

```text
project-14-knowledge-platform/
│
├── .github/
│   └── workflows/
│       ├── test.yml                    ← Unit + integration tests
│       ├── evaluation.yml              ← Placeholder report runner today
│       ├── security.yml                ← ZERO LEAKAGE gate
│       └── docker-build.yml            ← Image build check
│
├── app/
│   ├── __init__.py
│   ├── main.py                     ← FastAPI entry point
│   ├── config.py                   ← Settings, env vars, LLM provider selection
│   │
│   ├── api/                        ← HTTP endpoints
│   │   ├── __init__.py
│   │   ├── auth.py                 ← Supabase Auth (login, session)
│   │   ├── chat.py                 ← Chat endpoint
│   │   ├── admin.py                ← Admin endpoints (uses same auth)
│   │   ├── health.py               ← Health check
│   │   └── webhooks.py             ← Permission-change webhooks
│   │
│   ├── core/                       ← Core architectural components
│   │   ├── __init__.py
│   │   ├── security.py             ← Supabase token verification, current-user
│   │   ├── permission_service.py   ← Resolves principals, can_read()
│   │   ├── audit.py                ← Audit logging
│   │   └── exceptions.py           ← Custom exceptions
│   │
│   ├── models/                     ← SQLAlchemy models
│   │   ├── __init__.py
│   │   ├── user.py                 ← users (identity mirror, no credentials)
│   │   ├── profile.py              ← profiles (mirrors Supabase auth.users + app fields)
│   │   ├── group.py                ← groups, user_groups
│   │   ├── document.py             ← documents
│   │   ├── document_acl.py         ← document_acl
│   │   ├── projection.py           ← document_projections
│   │   └── audit_event.py          ← audit_events
│   │
│   ├── schemas/                    ← Pydantic schemas
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── user.py
│   │   ├── chat.py
│   │   ├── document.py
│   │   ├── conflict.py
│   │   └── freshness.py
│   │
│   ├── db/                         ← Database setup
│   │   ├── __init__.py
│   │   ├── base.py                 ← Base declarative class
│   │   ├── session.py              ← Session management
│   │   └── seed.py                 ← Seed data
│   │
│   ├── services/                   ← Business logic
│   │   ├── __init__.py
│   │   │
│   │   ├── ingestion/
│   │   │   ├── __init__.py
│   │   │   ├── base.py             ← Base ingestor interface
│   │   │   ├── connectors/         ← Source connectors
│   │   │   │   ├── __init__.py
│   │   │   │   ├── mock.py         ← Mock source (used first)
│   │   │   │   ├── google_drive.py ← Optional
│   │   │   │   └── discord.py      ← Optional
│   │   │   ├── chunking.py         ← Chunking strategies
│   │   │   └── acl_translator.py   ← Source ACL → unified ACL
│   │   │
│   │   ├── retrieval/
│   │   │   ├── __init__.py
│   │   │   ├── secure_retriever.py ← ★ SECURITY BOUNDARY (canonical location)
│   │   │   ├── vector_store.py     ← Vector DB client
│   │   │   ├── bm25.py             ← BM25 index
│   │   │   ├── rrf.py              ← Reciprocal rank fusion
│   │   │   ├── hybrid.py           ← Hybrid search (uses RRF)
│   │   │   ├── reranker.py         ← Cross-encoder reranker
│   │   │   └── query_rewrite.py    ← Additive query rewriting
│   │   │
│   │   ├── rag/
│   │   │   ├── __init__.py
│   │   │   ├── graph.py            ← LangGraph orchestration
│   │   │   ├── state.py            ← RAG state definition
│   │   │   │
│   │   │   ├── llm/                ← LLM provider (injected, not imported by nodes)
│   │   │   │   ├── __init__.py
│   │   │   │   ├── base.py         ← Abstract interface: LLMProvider
│   │   │   │   ├── openai.py       ← OpenAI implementation
│   │   │   │   ├── anthropic.py    ← Anthropic implementation
│   │   │   │   ├── embeddings.py   ← Embedding provider
│   │   │   │   └── factory.py      ← Returns provider from config
│   │   │   │
│   │   │   └── nodes/
│   │   │       ├── __init__.py
│   │   │       ├── retrieve.py     ← MUST call SecureRetriever only
│   │   │       ├── freshness.py
│   │   │       ├── conflict.py
│   │   │       ├── evidence.py
│   │   │       ├── generate.py     ← Receives LLMProvider (not factory)
│   │   │       ├── refuse.py       ← Dedicated refusal node
│   │   │       └── verify.py       ← Receives LLMProvider (not factory)
│   │   │
│   │   ├── freshness/
│   │   │   ├── __init__.py
│   │   │   ├── policy.py           ← Per-content-type policy
│   │   │   └── evaluator.py        ← Domain logic
│   │   │
│   │   ├── conflict/
│   │   │   ├── __init__.py
│   │   │   ├── detector.py         ← Four-stage detection
│   │   │   ├── claim_extractor.py  ← Structured claim extraction
│   │   │   └── classifier.py       ← Conflict classification
│   │   │
│   │   └── sync/
│   │       ├── __init__.py
│   │       ├── projection.py       ← Project Supabase → Vector DB
│   │       └── permission_sync.py  ← Sync source permissions
│   │
│   ├── evaluation/                 ← Separate from runtime pipeline
│   │   ├── __init__.py
│   │   ├── runner.py               ← Runs golden dataset
│   │   ├── dataset.py              ← Loads dataset
│   │   ├── metrics.py              ← Computes metrics
│   │   ├── judges.py               ← LLM-as-judge helpers
│   │   ├── report.py               ← Generates report
│   │   └── gates.py                ← Verifies invariants (does NOT enforce runtime auth)
│   │
│   └── jobs/                       ← Background jobs
│       ├── __init__.py
│       ├── sync_permissions.py
│       ├── sync_sources.py
│       └── reindex.py
│
├── tests/                          ← Test suite
│   ├── __init__.py
│   ├── conftest.py
│   ├── unit/
│   │   ├── __init__.py
│   │   ├── test_permission_service.py
│   │   ├── test_freshness_evaluator.py
│   │   ├── test_conflict_detector.py
│   │   ├── test_acl_translator.py
│   │   ├── test_chat_schema.py
│   │   └── test_models.py
│   ├── integration/
│   │   ├── __init__.py
│   │   ├── test_auth.py
│   │   ├── test_ingestion.py
│   │   ├── test_retrieval.py
│   │   ├── test_rag_pipeline.py
│   │   ├── test_get_current_user.py
│   │   ├── test_signup.py
│   │   ├── test_document_migration.py
│   │   └── test_health.py
│   └── security/                   ← Security-critical tests
│       ├── __init__.py
│       ├── test_permission_leakage.py
│       ├── test_acl_invariant_stages.py
│       ├── test_permission_revocation.py
│       ├── test_prompt_injection.py
│       ├── test_fail_closed.py
│       ├── test_admin_authorization.py
│       ├── test_acl_projection_consistency.py
│       ├── test_acl_filter.py
│       ├── test_acl_invariants.py
│       └── test_placeholder.py
│
├── migrations/                     ← Alembic migrations (see DATABASE_MIGRATIONS.md)
│   ├── env.py
│   ├── script.py.mako
│   └── versions/
│
├── alembic.ini                     ← Alembic config (URL comes from env.py)
└── .env.example                    ← Local env template (SUPABASE_DB_URL, secrets)
│
│   (No requirements.txt — deps live in root pyproject.toml + uv.lock.
│    See DATABASE_MIGRATIONS.md §4 for the dependency rules.)
│
```

---

## 3. Folder Purpose Summary

| Folder                            | Purpose                                                    |
| --------------------------------- | ---------------------------------------------------------- |
| `.github/workflows/`              | CI/CD workflows; PR source branch verification                  |
| `app/`                | Next.js App Router pages and layouts for chat, admin, dashboard, login, and signup       |
| `components/`               | Reusable UI primitives (`components/ui/`) and feature-specific components |
| `docs/`             | Comprehensive project documentation across architecture, security, retrieval, and planning                |
| `e2e/`             | End-to-end testing suite                |
| `hooks/`             | Custom React hooks for managing application state and session lifecycles                |
| `lib/`             | Core client libraries, API connectors, and utility wrappers                |
| `tests/`             | Unit and component tests for hooks and frontend logic                |
| `utils/`             | Supabase-specific helpers and client/server middleware utilities                |

---

## 4. The Key Architectural Decisions

|   # | Decision                                             | Reason                                            |
| --: | ---------------------------------------------------- | ------------------------------------------------- |
|   1 | Supabase client utilities reside in `utils/supabase/` | Ensures clean isolation between client, server, and middleware auth contexts       |
|   2 | `app/` uses the Next.js App Router     | Organizes distinct application domains and layout boundaries natively |
|   3 | Authentication state is managed via `hooks/useAuth.ts`               | Centralizes session state and protected route logic for the client           |
|   4 | End-to-end tests live in `e2e/` (e.g., Playwright)                | Separates automated UI testing from unit tests and component hooks |
|   5 | `.github/workflows/` includes `verify-pr-source.yml`      | Enforces branch governance and deployment pipeline checks            |
|   6 | API client wrappers are centralized under `lib/`                        | Simplifies communication with the backend service layer         |
|   7 | Session state and protected-route helpers live in `hooks/useAuth.ts` | Keeps client authentication state in one reusable module |
|   8 | `.env.example` at root | Defines required environment variables |
|   9 | Tailwind CSS v4 is configured through the Next.js pipeline; global styles live in `app/globals.css` | Keeps design tokens and global styles in the App Router |

---

## 5. The CI Workflow Separation

The frontend repository uses GitHub Actions (`verify-pr-source.yml`) to enforce branch governance and ensure that pull requests targeting production adhere to established contribution pathways.

```text
PR opened targeting 'main'
       ↓
verify-pr-source.yml
       ↓
Validates branch:
HEAD_REF == 'dev' OR hotfix/*
       ↓
┌──────┴──────┐
│             │
▼             ▼
 Pass        Fail
(Merge OK)  (Blocked)
```

| Workflow | Trigger | Purpose | Target Behavior |
| --- | --- | --- | --- |
| `verify-pr-source.yml` | Pull requests and pushes targeting `main` | Enforces that direct updates to production originate exclusively from `dev` or `hotfix/*` branches | Required merge gate |

---

## 6. Suggested Environment Template

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Local FastAPI Backend
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Rule:** `.env.local` must be in `.gitignore`. Never commit secrets.

---

## 7. The Critical Rules to Enforce

|   # | Rule                                                            | Enforcement                              |
| --: | --------------------------------------------------------------- | ---------------------------------------- |
|   1 | Never commit secrets                                            | `.env` and `.env.local` in `.gitignore`                   |
|   2 | All browser-accessible Supabase variables must use the `NEXT_PUBLIC_` prefix | Code review + linting                     |
|   3 | Protected routes must validate the session state before rendering sensitive UI | Middleware + `ProtectedRoute` wrapper                     |

---

## Final Repository Principle

The frontend repository structure is not merely organizational; it encodes the presentation layer's secure interaction boundaries with Supabase Auth and the FastAPI backend service.

The primary architectural boundary is:

```text
                    ┌──────────────────────────────┐
                    │      Supabase Auth / UI      │
                    │ Session and Protected Routes │
                    └──────────────┬───────────────┘
                                   ↓
                    ┌──────────────────────────────┐
                    │       API Client (lib/)      │
                    │  Attach Bearer Tokens / Auth │
                    └──────────────┬───────────────┘
                                   ↓
                    ┌──────────────────────────────┐
                    │    FastAPI Backend Service   │
                    │  SecureRetriever / RAG Core  │
                    └──────────────────────────────┘
```

If the team maintains clean component boundaries, securely manages session tokens via Supabase utilities, and routes all data fetching through the centralized API client, the frontend structure directly reinforces the secure, decoupled user experience.
