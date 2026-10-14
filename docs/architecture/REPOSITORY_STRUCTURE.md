# Complete Repository Structure - Permission-Aware Knowledge Agent

**Project:** SER 401 – Project 14: Permission-Aware Knowledge Agent  
**Date:** October 10th, 2026 (Last Modified)
**Purpose:** Complete repository structure for the project, reflecting the two-database architecture, the security boundary rule, and the eight-week implementation roadmap.

---

## 1. Architecture Overview

The project is organized around a clear separation of responsibilities:

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

## 2. The Complete Repository Structure

Two repositories (sponsor decision, October 2026):

- **Frontend repo:** `project-14-knowledge-platform-frontend` (this repo - Next.js + Tailwind CSS + shadcn/ui, [Vercel](https://project-14-knowledge-platform-front.vercel.app/))
- **Backend repo:** [`project-14-knowledge-platform`](https://github.com/lanaghanim/project-14-knowledge-platform) (FastAPI + Supabase + Pinecone, Docker)

Frontend repo layout (**expected; subject to change**):

```text
project-14-knowledge-platform-frontend/
├── app/                                  ← Next.js App Router
│   ├── login/page.tsx                    ← Login via Supabase Auth (Phase 1)
│   ├── chat/page.tsx                     ← Chat + chunks/citations (Phases 3, 5)
│   └── admin/page.tsx                    ← Documents, ACLs, sync, metrics (Phases 2, 4, 7)
├── components/
│   ├── ui/                               ← shadcn/ui
│   ├── chat/
│   │   ├── ChatInput.tsx                 ← Query input (Phase 3)
│   │   ├── MessageList.tsx               ← Message list (Phase 3)
│   │   ├── ChunkCard.tsx                 ← Retrieved chunk display (Phase 3)
│   │   ├── MessageBubble.tsx
│   │   ├── CitationLink.tsx              ← Clickable citation (Phase 5)
│   │   ├── SourcePanel.tsx               ← Source side panel (Phase 5)
│   │   ├── RefusalMessage.tsx            ← Refusal display (Phase 5)
│   │   ├── FreshnessWarning.tsx          ← Freshness banner + badge (Phase 6)
│   │   ├── FreshnessBadge.tsx
│   │   └── ConflictNotice.tsx            ← Conflict display (Phase 6)
│   ├── admin/
│   │   ├── DocumentList.tsx              ← Document table (Phase 2)
│   │   ├── PermissionMatrix.tsx          ← ACL matrix (Phase 2)
│   │   ├── SourceList.tsx                ← Ingestion sources (Phase 4)
│   │   ├── SyncButton.tsx + SyncStatus.tsx
│   │   ├── AuditLog.tsx              ← Query history (Phase 7)
│   │   ├── MetricsDashboard.tsx          ← Evaluation scores (Phase 7)
│   │   └── LeakGauge.tsx             ← 0% leakage gauge (Phase 7)
│   └── auth/
│       ├── UserSwitcher.tsx              ← Switch test users (Phase 3)
│       └── ProtectedRoute.tsx            ← Redirect if not logged in (Phase 1)
├── hooks/
│   ├── useAuth.ts                        ← Supabase Auth session (Phase 1)
│   ├── useChat.ts
│   └── useAudit.ts
├── lib/
│   ├── api.ts                            ← Backend client (Phase 1)
│   ├── supabase.ts                   ← Supabase browser client (Phase 1)
│   └── utils.ts
├── data/                                 ← Test data (outside backend)
│   ├── evaluation/
│   │   └── golden_dataset.json
│   ├── fixtures/
│   │   ├── mock_users.json
│   │   └── mock_documents.json
│   └── sample_sources/
│       ├── google_drive/
│       └── discord/
├── docs/                                 ← Documentation (actual layout)
│   ├── START_HERE.md                     ← Navigation hub
│   ├── planning/
│   │   ├── BUILD_PLAN.md
│   │   ├── SCRUM_GUIDE.md
│   │   ├── TAIGA_SETUP.md
│   │   └── PULL_REQUEST_PROCESS.md
│   ├── architecture/
│   │   ├── REPOSITORY_STRUCTURE.md       ← This file (canonical structure)
│   │   ├── DATABASE_MODEL.md             ← Schema (what)
│   │   ├── DATABASE_MIGRATIONS.md        ← Async Alembic guide (how to change it)
│   │   └── DATABASE_QUERIES.md           ← Async query patterns (how to read/write it)
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
│       └── hosting-options.md            ← Backend hosting comparison (Railway primary)
├── scripts/                              ← Utility scripts
│   ├── seed_db.py
│   ├── ingest_sample_sources.py
│   ├── run_evaluation.py
│   └── generate_diagrams.py
├── Dockerfile                            ← Backend image (builds from repo root)
├── docker-compose.yml
├── docker-compose.test.yml
├── .env.example                          ← NEXT_PUBLIC_SUPABASE_URL/KEY, BACKEND_URL
├── .dockerignore
├── .gitignore
├── package.json
├── tsconfig.json
├── next.config.ts
├── components.json
├── pyproject.toml
├── uv.lock
├── README.md
└── LICENSE
```

Backend repo layout (**expected; subject to change**):

```text
project-14-knowledge-platform/
│
├── .github/
│   └── workflows/
│       ├── test.yml                    ← Unit + integration tests
│       ├── evaluation.yml              ← Golden dataset + metrics
│       └── security.yml                ← ZERO LEAKAGE gate
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
│   │   │   ├── hybrid.py           ← Hybrid search + RRF
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
│   │   ├── test_permission_service.py
│   │   ├── test_freshness_evaluator.py
│   │   ├── test_conflict_detector.py
│   │   └── test_acl_translator.py
│   ├── integration/
│   │   ├── test_auth.py
│   │   ├── test_ingestion.py
│   │   ├── test_retrieval.py
│   │   └── test_rag_pipeline.py
│   └── security/                   ← Security-critical tests
│       ├── test_permission_leakage.py
│       ├── test_acl_invariant_stages.py
│       ├── test_permission_revocation.py
│       ├── test_prompt_injection.py
│       ├── test_fail_closed.py
│       ├── test_admin_authorization.py
│       └── test_acl_projection_consistency.py
│
├── migrations/                     ← Alembic migrations (see DATABASE_MIGRATIONS.md)
│   ├── env.py
│   ├── script.py.mako
│   └── versions/
│
├── alembic.ini                     ← Alembic config (URL comes from env.py)
└── .env.example                    ← Local env template (SUPABASE_DB_URL, secrets)
```

---

## 3. Folder Purpose Summary

| Folder                            | Purpose                                                    |
| --------------------------------- | ---------------------------------------------------------- |
| `.github/workflows/`              | CI/CD — tests, evaluation, security gates                  |
| `app/api/`                | HTTP endpoints — auth, chat, admin, health, webhooks       |
| `app/core/`               | Core components — PermissionService (+ `Principal`), audit, security |
| `app/models/`             | SQLAlchemy models for 8 Supabase tables                |
| `app/schemas/`            | Pydantic schemas for API validation                        |
| `app/db/`                 | Database session, base class, seed data                    |
| `app/services/ingestion/` | Source connectors, chunking, ACL translation               |
| `app/services/retrieval/` | SecureRetriever, vector store, BM25, hybrid, reranker      |
| `app/services/rag/`       | LangGraph orchestration and nodes                          |
| `app/services/freshness/` | Freshness policy and evaluator                             |
| `app/services/conflict/`  | Conflict detection, claim extraction, classification       |
| `app/services/sync/`      | Projection sync and permission sync                        |
| `app/evaluation/`         | Evaluation harness — separate from runtime                 |
| `app/jobs/`               | Background jobs — permission sync, reindex                 |
| `tests/unit/`             | Unit tests                                                 |
| `tests/integration/`      | Integration tests                                          |
| `tests/security/`         | Security-critical tests — leakage, revocation, fail-closed |
| `migrations/`             | Alembic database migrations                                |
| `frontend repo` (`project-14-frontend`) | Next.js + shadcn/ui application (separate repo, Vercel) |
| `data/`                           | Golden dataset (`data/evaluation/golden_dataset.json`), fixtures, sample sources |
| `docs/`                           | Planning, architecture, security, retrieval, evaluation docs (see `START_HERE.md`) |
| `scripts/`                        | Utility scripts for setup, seeding, evaluation             |

---

## 4. The Key Architectural Decisions

|   # | Decision                                             | Reason                                            |
| --: | ---------------------------------------------------- | ------------------------------------------------- |
|   1 | `secure_retriever.py` lives in `services/retrieval/` | It's a retrieval boundary, not generic core       |
|   2 | `document_acl.py` is separate from `document.py`     | ACL is a core requirement — deserves its own file |
|   3 | `ingestion/connectors/` is a subfolder               | Cleaner when multiple sources are added           |
|   4 | `refuse.py` is a first-class RAG node                | Calibrated refusal is a major sponsor requirement |
|   5 | `evaluation/` files are `runner.py`, `gates.py`      | Clearer names than `run.py`, `gate.py`            |
|   6 | `data/` is at repository root                        | Separates test data from application code         |
|   7 | `alembic.ini` is at the repo root                | Required for Alembic migrations                   |
|   8 | `jobs/` has 3 files (`sync_permissions.py`, `sync_sources.py`, `reindex.py`) | Permission sync, source sync, and reindex coverage |
|   9 | `frontend/components/auth/` exists                   | Natural home for auth UI                          |
|  10 | `.env.example` at root                               | Standard for Docker Compose                       |
|  11 | `admin.py` uses same auth infrastructure             | No admin bypass — admin is a role, not a bypass   |

---

## 5. The Security Boundary Rule

This rule must appear at the top of the README:

> **Security Boundary**
>
> All document retrieval must pass through `SecureRetriever`. Direct calls to the vector database or BM25 search implementations from API endpoints, RAG nodes, or other application components are prohibited. `SecureRetriever` obtains the user's effective principals from `PermissionService` and applies authorization filters before candidate retrieval. Every subsequent retrieval stage must operate only on authorized candidates.

**Code example:**

```python
# ❌ Never allowed
vector_store.similarity_search(query)

# ✅ Always required
secure_retriever.search(auth_context, query=query)
```

If someone later writes a direct vector DB call inside any service, this rule is violated.

---

## 6. The Dependency Direction

```text
API Endpoints
     ↓
PermissionService  ← resolves principals
     ↓
SecureRetriever    ← enforces ACL
     ↓
 ┌───┴────┐
 │        │
Vector    BM25
 │        │
 └───┬────┘
     ↓
    RRF
     ↓
  Reranker
     ↓
  RAG Nodes
     ↓
   LLM
```

**Never:**

```text
VectorStore → PermissionService
BM25 → PermissionService
Reranker → PermissionService
```

Authorization happens **once**, at the `SecureRetriever` boundary. Everything downstream works on already-authorized candidates.

---

## 7. What Each Layer Owns

| Layer                     | Owns                 | Does NOT Own     |
| ------------------------- | -------------------- | ---------------- |
| API                       | HTTP, validation     | Business logic   |
| PermissionService         | Principal resolution | Retrieval        |
| SecureRetriever           | ACL enforcement      | Ranking          |
| Retrieval implementations | Search mechanics     | Authorization    |
| RAG nodes                 | Orchestration        | Domain logic     |
| Freshness / Conflict      | Domain logic         | LangGraph state  |
| Evaluation harness        | Measurement          | Runtime behavior |

---

## 8. The CI Workflow Separation

```text
PR opened
    ↓
┌──────────────┬─────────────────┬──────────────────┐
│              │                 │                  │
test.yml    evaluation.yml   security.yml
│              │                 │
Unit +         Golden           ZERO LEAKAGE
integration    dataset          required
tests          metrics
│              │                 │
└──────┬───────┴────────┬────────┘
       │                │
       ▼                ▼
   Report only      Merge gate
```

| Workflow         | Contains                                                                     | Blocks merge?              |
| ---------------- | ---------------------------------------------------------------------------- | -------------------------- |
| `test.yml`       | Unit + integration + lint/type checks                                        | Yes                        |
| `security.yml`   | Permission leakage, ACL invariant, fail-closed, revocation, prompt injection | **Yes — zero leakage required** |
| `evaluation.yml` | Golden dataset, Recall@K, MRR, NDCG, refusal accuracy, faithfulness          | Initially informational (warn only) |

---

## 9. The Docker Compose Setup

```yaml
services:
  backend:
    build: .
    ports:
      - "8000:8000"
    environment:
      SUPABASE_URL: ${SUPABASE_URL}
      SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY}
      SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY}
      SUPABASE_DB_URL: ${SUPABASE_DB_URL}
      PINECONE_API_KEY: ${PINECONE_API_KEY}
      PINECONE_INDEX: ${PINECONE_INDEX}
      LLM_PROVIDER: ${LLM_PROVIDER}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      GOOGLE_API_KEY: ${GOOGLE_API_KEY}
```

Backend-only compose: no database container (Supabase is hosted) and no frontend service (the Next.js app lives in `project-14-frontend` with its own `NEXT_PUBLIC_*` env and Vercel deployment).

**Note:** Supabase (Postgres + Auth) and Pinecone are external managed services. No local database container is needed — the backend connects via `SUPABASE_DB_URL`. Document this explicitly.

---

## 10. The Root `.env.example`

```bash
# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_DB_URL=

# Pinecone
PINECONE_API_KEY=
PINECONE_INDEX=project-14-knowledge

# LLM (provider-agnostic: OpenAI, Anthropic, Gemini)
LLM_PROVIDER=openai
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_API_KEY=
```

**Rule:** `.env` must be in `.gitignore`. Never commit secrets.

---

## 11. Implementation Order (8 Weeks)

| Week | Focus                | Deliverable                              |
| ---: | -------------------- | ---------------------------------------- |
|    1 | Foundation           | FastAPI + Supabase Auth + profiles       |
|    2 | Documents & ACL      | Document models + PermissionService      |
|    3 | Secure Retrieval     | SecureRetriever + first security test    |
|    4 | Ingestion            | Chunking + ACL translator + connector #1 |
|    5 | RAG Pipeline         | LangGraph + hybrid retrieval + reranker  |
|    6 | Freshness + Conflict | Domain logic + RAG nodes                 |
|    7 | Evaluation Harness   | Golden dataset + metrics + CI gates      |
|    8 | Delivery + Demo      | Demo-ready app + video + docs            |

> Frontend is built alongside every phase (see `BUILD_PLAN.md`); Week 8 is delivery/polish, not the first UI.

---

## 12. The Critical Rules to Enforce

|   # | Rule                                                            | Enforcement                              |
| --: | --------------------------------------------------------------- | ---------------------------------------- |
|   1 | No generic vector search may bypass `SecureRetriever`           | Code review + lint rule                  |
|   2 | Every retrieval stage must be a subset of authorized chunks     | Security tests                           |
|   3 | ACL revocation propagation is a security-critical path          | Regression test (T0 → T1 → T2)           |
|   4 | The vector DB is never the authorization authority              | Documented; Supabase is authoritative    |
|   5 | If `PermissionService` fails, retrieval fails closed            | Error handling test                      |
|   6 | No admin bypass — admin is a role, not a bypass                 | Same auth infrastructure used everywhere |
|   7 | Never commit secrets                                            | `.env` in `.gitignore`                   |
|   8 | Evaluation harness observes the pipeline — it is not part of it | Directory separation                     |

---

## Final Repository Principle

The repository structure is not merely organizational. It encodes the system's security model.

The most important architectural boundary is:

```text
                    ┌──────────────────────────────┐
                    │      PermissionService       │
                    │  Resolve effective principals│
                    └──────────────┬───────────────┘
                                   ↓
                    ┌──────────────────────────────┐
                    │       SecureRetriever        │
                    │       ENFORCE ACL HERE       │
                    └──────────────┬───────────────┘
                                   ↓
             ┌─────────────────────┴─────────────────────┐
             ↓                                           ↓
       Vector Search                                  BM25 Search
             └─────────────────────┬─────────────────────┘
                                   ↓
                                  RRF
                                   ↓
                               Reranker
                                   ↓
                            Authorized Evidence
                                   ↓
                       Freshness / Conflict / Evidence
                                   ↓
                             Generate / Refuse
                                   ↓
                                Verify
```

If the team preserves this dependency direction, keeps Supabase authoritative, and prevents retrieval from bypassing `SecureRetriever`, the repository structure directly reinforces the project's central permission-aware design.
