# Taiga Setup: Permission-Aware Knowledge Agent

**Project:** SER 401 – Project 14: Permission-Aware Knowledge Agent  
**Date:** October 10th, 2026 (Last Modified)
**Purpose:** Complete epic, user story, task, and sprint structure with dependencies and possible task assignments based on team skills.

---

## 1. Team Skills Summary

| Member        | Strongest                                                                                           | Growing                                         | Interested In                                                      |
| ------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------ |
| **Lana**      | Python, TypeScript, Node.js, Supabase (Postgres), Prisma, React, Next.js, Tailwind, shadcn/ui, Docker, CI/CD | LangChain, Vector DBs, LLM/AI, MCP              | Permission-aware retrieval, AI orchestration, Backend architecture |
| **Oleksandr** | TypeScript, React, Node.js, Tailwind, shadcn/ui, AWS (Cognito, S3, Lambda, DynamoDB), Supabase (Postgres)    | Python (FastAPI), REST APIs, LLM APIs, agents   | Vector DB indexing, LangGraph, strict permission-aware retrieval   |
| **Ahmed**     | JavaScript, React.js, Next.js, HTML/CSS/Bootstrap, PHP, MySQL, REST APIs, Git/GitHub                | TypeScript, Node.js, Docker, Linux, Agile/Scrum | AI/LLM integration, RAG, permission-aware retrieval                |
| **Troy**      | Java, TypeScript, Python, JavaScript, REST APIs, API design, automation                             | CSS, React, Node.js, Linux, Docker (basic)      | AI/RAG, database work, LLM integration                             |
| **Elliot**    | Python, Java, CI/CD, PostgreSQL, JavaScript, TypeScript, PHP, MySQL, REST APIs, automation, Docker, Linux  | CSS, React, Node.js, AI/RAG, AWS | LLM integration, Supabase, cloud (general) |

**Assignment logic:** Match task to strongest skills. Give each member exposure to their growing areas. Balance load across the team.

---

## 2. The Dependency Principle

> **Some stories cannot start until another story finishes.**

### Critical Path

```text
US-1 → US-4 → US-5 → US-8 → US-11 ★ → US-12 → US-17 → US-19 → US-21/22 → US-23–26
```

Nothing downstream can start until **US-11 (SecureRetriever)** is done.

---

## 3. The Layered Build Order

| Layer       | Focus              | Sprint     |
| ----------- | ------------------ | ---------- |
| **Layer 1** | Foundation         | Sprint 1   |
| **Layer 2** | Identity           | Sprint 1   |
| **Layer 3** | Documents & ACL    | Sprint 1–2 |
| **Layer 4** | Secure Retrieval ★ | Sprint 2   |
| **Layer 5** | Ingestion          | Sprint 2   |
| **Layer 6** | RAG + Reliability  | Sprint 3   |
| **Layer 7** | Evaluation + Admin | Sprint 4   |
| **Layer 8** | Delivery           | Sprint 4   |

---

## 4. Complete Epic + Story + Task Structure

### EPIC 1: Foundation (Layer 1)

#### US-1: Project scaffolding

```text
As a developer, I want a working repository
so that the team can start coding.

Points: 3
Priority: Critical
Layer: 1
Depends on: None
Blocks: US-2, US-3, US-4
```

**Tasks:**

| #     | Task                             | Hours | Possible Assignment |
| ----- | -------------------------------- | ----: | ------------------- |
| T-1.1 | Create folder structure          |     1 | Lana, Oleksandr     |
| T-1.2 | Create pyproject.toml            |     1 | Lana                |
| T-1.3 | Create FastAPI main.py           |     2 | Lana, Troy          |
| T-1.4 | Create health endpoint           |     1 | Lana, Troy, Ahmed   |
| T-1.5 | Create Dockerfile + compose      |     3 | Lana, Oleksandr     |
| T-1.6 | Create .env.example + .gitignore |     1 | Lana, Ahmed         |
| T-1.7 | Write README with security rule  |     1 | Lana                |

#### US-2: Database connection + migrations

```text
As a developer, I want the database connected
so that models can be created.

Points: 3
Priority: Critical
Layer: 1
Depends on: US-1
Blocks: US-4
```

**Tasks:**

| #     | Task                             | Hours | Possible Assignment |
| ----- | -------------------------------- | ----: | ------------------- |
| T-2.1 | Configure Supabase connection (`SUPABASE_DB_URL`) |     1 | Lana, Oleksandr     |
| T-2.2 | Create db/session.py             |     2 | Lana, Ahmed         |
| T-2.3 | Create db/base.py                |     1 | Lana, Ahmed         |
| T-2.4 | Set up Alembic                   |     2 | Lana, Ahmed         |
| T-2.5 | Run initial migration            |     1 | Ahmed, Troy         |

#### US-3: Next.js frontend scaffolding

```text
As a developer, I want a working frontend
so that UI pages can be built.

Points: 3
Priority: High
Layer: 1
Depends on: US-1
Blocks: US-9, US-14, US-26
```

**Tasks:**

| #     | Task                     | Hours | Possible Assignment      |
| ----- | ------------------------ | ----: | ------------------------ |
| T-3.1 | Set up Next.js + TypeScript + shadcn/ui |     2 | Oleksandr, Ahmed, Elliot |
| T-3.2 | Add Tailwind CSS         |     2 | Oleksandr, Ahmed, Elliot |
| T-3.3 | Install shadcn/ui        |     2 | Oleksandr, Ahmed, Elliot |
| T-3.4 | Create empty page shells |     2 | Ahmed, Elliot            |
| T-3.5 | Add frontend Dockerfile  |     1 | Lana, Oleksandr          |

---

### EPIC 2: Identity (Layer 2)

Identity is owned by Supabase Auth. The app keeps a `users` mirror row (no credentials) plus a `profiles` row linked to `auth.users.id`; login, sessions, and password handling all happen in Supabase — see `DATABASE_MODEL.md` §2.1–2.2.

> **Live Taiga groupings (current state):** Foundation → US-13, US-14, US-16 · Frontend → US-17 · RAG Pipeline → US-10, US-11, US-12. Story IDs below (US-1–US-27) are the original plan IDs; titles live in Taiga. The sprint structure has also been updated — see the Schedule/Timeline section of the Project Plan.

#### US-4: User, Profile, and Group models

```text
As a developer, I want User, Profile, and Group tables
so that authentication can work.

Points: 5
Priority: Critical
Layer: 2
Depends on: US-2
Blocks: US-5, US-7
```

**Tasks:**

| #     | Task                                      | Hours | Possible Assignment |
| ----- | ----------------------------------------- | ----: | ------------------- |
| T-4.1 | Create User + Profile models              |     2 | Lana, Ahmed, Troy   |
| T-4.2 | Create Group + UserGroup models           |     2 | Lana, Ahmed, Troy   |
| T-4.3 | Create migration                          |     2 | Lana, Ahmed         |
| T-4.4 | Create seed script (no credentials)       |     3 | Ahmed, Troy         |
| T-4.5 | Write model tests                         |     2 | Lana, Troy          |

#### US-5: Supabase Auth authentication

```text
As an employee, I want to log in and receive a Supabase session
so that I can access protected endpoints.

Points: 5
Priority: Critical
Layer: 2
Depends on: US-4
Blocks: US-6, US-8, US-9
```

**Tasks:**

| #     | Task                                            | Hours | Possible Assignment |
| ----- | ----------------------------------------------- | ----: | ------------------- |
| T-5.1 | Integrate Supabase Auth signup/login            |     2 | Lana, Troy          |
| T-5.2 | Create Supabase token verification helpers      |     3 | Lana, Troy          |
| T-5.3 | Create POST /api/auth/login                     |     3 | Lana, Troy          |
| T-5.4 | Create auth schemas                             |     2 | Lana, Troy          |
| T-5.5 | Write login tests                               |     2 | Troy, Oleksandr     |

#### US-6: Current user endpoint

```text
As a logged-in user, I want to retrieve my profile
so that the frontend knows who I am.

Points: 3
Priority: High
Layer: 2
Depends on: US-5
Blocks: US-26
```

**Tasks:**

| #     | Task                               | Hours | Possible Assignment |
| ----- | ---------------------------------- | ----: | ------------------- |
| T-6.1 | Create get_current_user dependency |     2 | Lana, Troy          |
| T-6.2 | Create GET /api/auth/me            |     2 | Lana, Troy          |
| T-6.3 | Write me endpoint tests            |     1 | Troy, Oleksandr     |

---

### EPIC 3: Documents & ACL (Layer 3)

#### US-7: Document and ACL models

```text
As a system, I want documents with ACLs
so that permissions can be enforced.

Points: 5
Priority: Critical
Layer: 3
Depends on: US-4
Blocks: US-8, US-10
```

**Tasks:**

| #     | Task                     | Hours | Possible Assignment |
| ----- | ------------------------ | ----: | ------------------- |
| T-7.1 | Create Document model    |     2 | Lana, Ahmed         |
| T-7.2 | Create DocumentACL model |     2 | Lana, Ahmed         |
| T-7.3 | Create Projection model  |     2 | Lana, Ahmed         |
| T-7.4 | Create AuditEvent model  |     2 | Lana, Ahmed         |
| T-7.5 | Create migration         |     2 | Ahmed, Troy         |
| T-7.6 | Seed documents + ACLs    |     3 | Ahmed, Troy         |

#### US-8: Permission resolution

```text
As the system, I want to resolve a user's principals
so that authorization can be enforced.

Points: 5
Priority: Critical
Layer: 3
Depends on: US-6, US-7
Blocks: US-11
```

**Tasks:**

| #     | Task                                     | Hours | Possible Assignment   |
| ----- | ---------------------------------------- | ----: | --------------------- |
| T-8.1 | Create PermissionService class           |     3 | Lana, Troy            |
| T-8.2 | Implement resolve_effective_principals   |     3 | Lana, Troy            |
| T-8.3 | Write unit tests (valid, empty, missing) |     3 | Lana, Troy, Oleksandr |

#### US-9: Login page UI

```text
As an employee, I want a login page
so that I can authenticate.

Points: 3
Priority: High
Layer: 3
Depends on: US-3, US-5
Blocks: US-14
```

**Tasks:**

| #     | Task                        | Hours | Possible Assignment      |
| ----- | --------------------------- | ----: | ------------------------ |
| T-9.1 | Create API client           |     3 | Oleksandr, Ahmed, Elliot |
| T-9.2 | Create useAuth hook         |     3 | Oleksandr, Ahmed, Elliot |
| T-9.3 | Build Login page            |     3 | Ahmed, Elliot            |
| T-9.4 | Add protected route wrapper |     2 | Oleksandr, Ahmed, Elliot |

---

### EPIC 4: Secure Retrieval ★ (Layer 4)

#### US-10: Vector DB client + projection

```text
As a system, I want documents projected to the vector DB
with ACL metadata so that retrieval can filter them.

Points: 5
Priority: Critical
Layer: 4
Depends on: US-7
Blocks: US-11
```

**Tasks:**

| #      | Task                            | Hours | Possible Assignment   |
| ------ | ------------------------------- | ----: | --------------------- |
| T-10.1 | Create VectorStore client       |     3 | Lana, Oleksandr, Troy |
| T-10.2 | Implement projection function   |     4 | Lana, Oleksandr       |
| T-10.3 | Add projection version tracking |     3 | Lana, Ahmed           |
| T-10.4 | Write projection tests          |     3 | Lana, Troy            |

#### US-11: SecureRetriever ★★★★★

```text
As a security engineer, I want retrieval to enforce ACLs
so that unauthorized chunks never enter the pipeline.

Points: 8
Priority: CRITICAL
Layer: 4
Depends on: US-8, US-10
Blocks: US-12, US-13, US-17
```

**Tasks:**

| #      | Task                           | Hours | Possible Assignment |
| ------ | ------------------------------ | ----: | ------------------- |
| T-11.1 | Create SecureRetriever class   |     4 | Lana                |
| T-11.2 | Implement build_acl_filter()   |     2 | Lana                |
| T-11.3 | Integrate with VectorStore     |     3 | Lana, Oleksandr     |
| T-11.4 | Add fail-closed handling       |     2 | Lana, Troy          |
| T-11.5 | Write permission-leakage test  |     5 | Lana, Troy          |
| T-11.6 | Write ACL invariant stage test |     4 | Lana, Oleksandr     |

#### US-12: Chat endpoint (chunks only)

```text
As a user, I want to send a question and see retrieved chunks
so that I can verify permission-aware retrieval.

Points: 5
Priority: Critical
Layer: 4
Depends on: US-11
Blocks: US-14
```

**Tasks:**

| #      | Task                      | Hours | Possible Assignment |
| ------ | ------------------------- | ----: | ------------------- |
| T-12.1 | Create chat endpoint      |     3 | Lana, Troy          |
| T-12.2 | Add chat schemas          |     2 | Lana, Troy          |
| T-12.3 | Add audit logging         |     2 | Lana, Ahmed         |
| T-12.4 | Write chat endpoint tests |     2 | Troy, Oleksandr     |

#### US-13: Fail-closed behavior

```text
As a security engineer, I want retrieval to fail closed
so that permission errors never leak data.

Points: 3
Priority: Critical
Layer: 4
Depends on: US-11
Blocks: None
```

**Tasks:**

| #      | Task                           | Hours | Possible Assignment |
| ------ | ------------------------------ | ----: | ------------------- |
| T-13.1 | Add fail-closed error handling |     2 | Lana, Troy          |
| T-13.2 | Write test_fail_closed.py      |     3 | Lana, Troy          |

#### US-14: Chat UI shows chunks

```text
As a user, I want to see retrieved chunks in the browser
so that I can verify different users get different results.

Points: 5
Priority: High
Layer: 4
Depends on: US-9, US-12
Blocks: US-17
```

**Tasks:**

| #      | Task                         | Hours | Possible Assignment      |
| ------ | ---------------------------- | ----: | ------------------------ |
| T-14.1 | Create ChatInput component   |     2 | Oleksandr, Ahmed, Elliot |
| T-14.2 | Create MessageList component |     2 | Oleksandr, Ahmed, Elliot |
| T-14.3 | Create ChunkCard component   |     2 | Ahmed, Elliot            |
| T-14.4 | Create UserSwitcher          |     3 | Oleksandr, Ahmed         |
| T-14.5 | Wire Chat page to backend    |     3 | Oleksandr, Elliot        |

---

### EPIC 5: Ingestion (Layer 5)

#### US-15: Mock source ingestion

```text
As a developer, I want to ingest from a mock source
so that I can test the pipeline without external APIs.

Points: 5
Priority: High
Layer: 5
Depends on: US-10
Blocks: US-16
```

**Tasks:**

| #      | Task                        | Hours | Possible Assignment    |
| ------ | --------------------------- | ----: | ---------------------- |
| T-15.1 | Create BaseIngestor         |     3 | Lana, Ahmed            |
| T-15.2 | Create MockSource connector |     3 | Ahmed, Troy            |
| T-15.3 | Implement chunking          |     3 | Lana, Ahmed            |
| T-15.4 | Implement ACL translator    |     3 | Lana, Ahmed            |
| T-15.5 | Write ingestion tests       |     3 | Ahmed, Troy, Oleksandr |

#### US-16: Permission sync + revocation

```text
As a security admin, I want permission changes to propagate
so that revoked access takes effect.

Points: 5
Priority: Critical
Layer: 5
Depends on: US-15
Blocks: None
```

**Tasks:**

| #      | Task                             | Hours | Possible Assignment |
| ------ | -------------------------------- | ----: | ------------------- |
| T-16.1 | Create sync job                  |     4 | Lana, Ahmed         |
| T-16.2 | Implement re-projection          |     3 | Lana, Ahmed         |
| T-16.3 | Write revocation regression test |     4 | Lana, Troy          |

---

### EPIC 6: RAG Pipeline (Layer 6)

#### US-17: Baseline RAG

```text
As a user, I want the system to answer questions
so that I get grounded responses with citations.

Points: 8
Priority: Critical
Layer: 6
Depends on: US-11, US-12
Blocks: US-18, US-19, US-20, US-21
```

**Tasks:**

| #      | Task                 | Hours | Possible Assignment   |
| ------ | -------------------- | ----: | --------------------- |
| T-17.1 | Create RAG state     |     2 | Lana, Oleksandr, Troy |
| T-17.2 | Create retrieve node |     2 | Lana, Oleksandr       |
| T-17.3 | Create evidence node |     3 | Lana, Troy            |
| T-17.4 | Create generate node |     4 | Lana, Troy, Oleksandr |
| T-17.5 | Assemble graph       |     3 | Lana, Troy            |
| T-17.6 | Write pipeline tests |     3 | Troy, Oleksandr       |

#### US-18: Hybrid retrieval (BM25 + Vector)

```text
As a user, I want better retrieval quality
so that keyword and semantic matches both work.

Points: 8
Priority: High
Layer: 6
Depends on: US-17
Blocks: US-19
```

**Tasks:**

| #      | Task               | Hours | Possible Assignment |
| ------ | ------------------ | ----: | ------------------- |
| T-18.1 | Create BM25 index  |     4 | Lana, Oleksandr     |
| T-18.2 | Implement RRF      |     3 | Lana, Troy          |
| T-18.3 | Create reranker    |     3 | Lana, Oleksandr     |
| T-18.4 | Apply ACL to BM25  |     3 | Lana, Troy          |
| T-18.5 | Write hybrid tests |     3 | Troy, Oleksandr     |

#### US-19: Refusal when evidence insufficient

```text
As a user, I want refusal when evidence is weak
so that I don't get confident wrong answers.

Points: 8
Priority: Critical
Layer: 6
Depends on: US-17
Blocks: US-20
```

**Tasks:**

| #      | Task                              | Hours | Possible Assignment |
| ------ | --------------------------------- | ----: | ------------------- |
| T-19.1 | Create evidence sufficiency check |     5 | Lana, Troy          |
| T-19.2 | Create refuse node                |     3 | Lana, Troy          |
| T-19.3 | Add refusal reason codes          |     2 | Lana, Ahmed         |
| T-19.4 | Write refusal tests               |     4 | Troy, Oleksandr     |

#### US-20: Citation verification + streaming

```text
As a user, I want verifiable citations and streaming
so that I can check sources while reading.

Points: 5
Priority: High
Layer: 6
Depends on: US-17
Blocks: None
```

**Tasks:**

| #      | Task                          | Hours | Possible Assignment      |
| ------ | ----------------------------- | ----: | ------------------------ |
| T-20.1 | Create verify node            |     4 | Lana, Troy               |
| T-20.2 | Add SSE streaming             |     4 | Lana, Oleksandr          |
| T-20.3 | Create CitationLink component |     2 | Oleksandr, Ahmed, Elliot |
| T-20.4 | Create SourcePanel component  |     3 | Ahmed, Elliot            |

---

### EPIC 7: Reliability (Layer 6)

#### US-21: Freshness detection

```text
As a user, I want warnings on stale sources
so that I know the answer may be outdated.

Points: 5
Priority: High
Layer: 6
Depends on: US-17
Blocks: US-22
```

**Tasks:**

| #      | Task                              | Hours | Possible Assignment |
| ------ | --------------------------------- | ----: | ------------------- |
| T-21.1 | Create freshness policy           |     2 | Lana, Troy, Ahmed   |
| T-21.2 | Create freshness evaluator        |     4 | Lana, Troy          |
| T-21.3 | Create freshness node             |     3 | Lana, Oleksandr     |
| T-21.4 | Add warnings to response          |     2 | Lana, Oleksandr     |
| T-21.5 | Create FreshnessWarning component |     2 | Ahmed, Elliot       |

#### US-22: Conflict detection

```text
As a user, I want conflicting sources surfaced
so that I know when to verify with an authority.

Points: 8
Priority: High
Layer: 6
Depends on: US-21
Blocks: None
```

**Tasks:**

| #      | Task                              | Hours | Possible Assignment |
| ------ | --------------------------------- | ----: | ------------------- |
| T-22.1 | Create claim extractor            |     5 | Lana, Troy          |
| T-22.2 | Create conflict detector          |     5 | Lana, Troy          |
| T-22.3 | Create classifier                 |     3 | Lana, Troy          |
| T-22.4 | Add conflict metadata to response |     2 | Lana, Oleksandr     |
| T-22.5 | Create ConflictNotice component   |     2 | Ahmed, Elliot       |

---

### EPIC 8: Evaluation (Layer 7)

#### US-23: Golden dataset

```text
As a developer, I want ~100 questions with known answers
so that I can measure quality.

Points: 5
Priority: Critical
Layer: 7
Depends on: US-17
Blocks: US-24
```

**Tasks:**

| #      | Task                        | Hours | Possible Assignment   |
| ------ | --------------------------- | ----: | --------------------- |
| T-23.1 | Design dataset schema       |     2 | Lana                  |
| T-23.2 | Write 40 answerable         |     4 | Lana, Troy, Ahmed     |
| T-23.3 | Write 20 permission-blocked |     3 | Lana, Troy, Oleksandr |
| T-23.4 | Write 10 adversarial        |     3 | Lana, Troy            |
| T-23.5 | Write remaining 30          |     4 | Ahmed, Elliot         |

#### US-24: Metrics engine

```text
As a developer, I want automated metrics
so that quality and security are measured.

Points: 8
Priority: Critical
Layer: 7
Depends on: US-23
Blocks: US-25
```

**Tasks:**

| #      | Task                    | Hours | Possible Assignment   |
| ------ | ----------------------- | ----: | --------------------- |
| T-24.1 | Create metrics engine   |     5 | Lana, Troy            |
| T-24.2 | Create dataset loader   |     2 | Lana, Troy            |
| T-24.3 | Create LLM judges       |     4 | Lana, Troy, Oleksandr |
| T-24.4 | Create report generator |     3 | Lana, Ahmed           |
| T-24.5 | Create runner           |     3 | Lana, Troy            |

#### US-25: CI security gates

```text
As a team, I want CI to block leaks
so that no regression reaches main.

Points: 5
Priority: Critical
Layer: 7
Depends on: US-24
Blocks: None
```

**Tasks:**

| #      | Task                        | Hours | Possible Assignment |
| ------ | --------------------------- | ----: | ------------------- |
| T-25.1 | Create test.yml             |     2 | Lana, Troy          |
| T-25.2 | Create security.yml         |     3 | Lana, Troy          |
| T-25.3 | Create evaluation.yml       |     2 | Lana, Ahmed         |
| T-25.4 | Configure branch protection |     2 | Lana                |

#### US-26: Admin UI + audit log

```text
As an admin, I want to view sources and query history
so that I can audit the system.

Points: 5
Priority: High
Layer: 7
Depends on: US-12
Blocks: US-27
```

**Tasks:**

| #      | Task                          | Hours | Possible Assignment      |
| ------ | ----------------------------- | ----: | ------------------------ |
| T-26.1 | Create Admin page             |     3 | Oleksandr, Ahmed, Elliot |
| T-26.2 | Create DocumentList component |     2 | Ahmed, Elliot            |
| T-26.3 | Create AuditLog component     |     3 | Oleksandr, Ahmed         |
| T-26.4 | Create MetricsDashboard       |     3 | Oleksandr, Ahmed         |

---

### EPIC 9: Delivery (Layer 8)

#### US-27: Demo video

```text
As a team, I want a demo video
so that we can submit the final deliverable.

Points: 5
Priority: Critical
Layer: 8
Depends on: US-26
Blocks: None
```

**Tasks:**

| #      | Task              | Hours | Possible Assignment |
| ------ | ----------------- | ----: | ------------------- |
| T-27.1 | Write demo script |     2 | Lana, Ahmed         |
| T-27.2 | Prepare demo data |     3 | Ahmed, Oleksandr    |
| T-27.3 | Record and edit   |     4 | Elliot, Ahmed       |

---

## 5. The Complete Dependency Map

```text
LAYER 1: FOUNDATION
├── US-1 (Scaffolding) → blocks everything
├── US-2 (DB) → blocks US-4
└── US-3 (Frontend) → blocks US-9, US-14, US-26

LAYER 2: IDENTITY
├── US-4 (User/Group models) → depends on US-2
├── US-5 (Supabase Auth) → depends on US-4
└── US-6 (Current user) → depends on US-5

LAYER 3: DOCUMENTS & ACL
├── US-7 (Document/ACL models) → depends on US-4
├── US-8 (Permission resolution) → depends on US-6, US-7
└── US-9 (Login UI) → depends on US-3, US-5

LAYER 4: SECURE RETRIEVAL ★
├── US-10 (Vector projection) → depends on US-7
├── US-11 (SecureRetriever) → depends on US-8, US-10 ★★★★★
├── US-12 (Chat endpoint) → depends on US-11
├── US-13 (Fail closed) → depends on US-11
└── US-14 (Chat UI) → depends on US-9, US-12

LAYER 5: INGESTION
├── US-15 (Mock source) → depends on US-10
└── US-16 (Sync + revocation) → depends on US-15

LAYER 6: RAG + RELIABILITY
├── US-17 (Baseline RAG) → depends on US-11, US-12
├── US-18 (Hybrid) → depends on US-17
├── US-19 (Refusal) → depends on US-17
├── US-20 (Citations + streaming) → depends on US-17
├── US-21 (Freshness) → depends on US-17
└── US-22 (Conflict) → depends on US-21

LAYER 7: EVALUATION + ADMIN
├── US-23 (Golden dataset) → depends on US-17
├── US-24 (Metrics) → depends on US-23
├── US-25 (CI gates) → depends on US-24
└── US-26 (Admin UI) → depends on US-12

LAYER 8: DELIVERY
└── US-27 (Demo video) → depends on US-26
```

---

## 6. Sprint Assignment

### Sprint 1 — Weeks 1–2 (Foundation + Identity + Documents)

| Story                       | Points | Depends On | Suggested Lead |
| --------------------------- | -----: | ---------- | -------------- |
| US-1: Scaffolding           |      3 | —          | Lana           |
| US-2: DB + migrations       |      3 | US-1       | Ahmed          |
| US-3: Frontend scaffolding  |      3 | US-1       | Oleksandr      |
| US-4: User/Group models     |      5 | US-2       | Ahmed          |
| US-5: Supabase Auth        |      5 | US-4       | Troy           |
| US-6: Current user          |      3 | US-5       | Troy           |
| US-7: Document/ACL models   |      5 | US-4       | Ahmed          |
| US-8: Permission resolution |      5 | US-6, US-7 | Lana           |
| US-9: Login UI              |      3 | US-3, US-5 | Elliot         |

**Total:** 35 points

**Parallel tracks:**

- **Backend track:** US-1 → US-2 → US-4 → US-5 → US-6 → US-7 → US-8
- **Frontend track:** US-1 → US-3 → US-9
- **Troy** fits naturally into US-5 and US-6 (Supabase Auth + current user) because of his strong API background.

---

### Sprint 2 — Weeks 3–4 (Secure Retrieval + Ingestion)

| Story                        | Points | Depends On  | Suggested Lead |
| ---------------------------- | -----: | ----------- | -------------- |
| US-10: Vector projection     |      5 | US-7        | Oleksandr      |
| US-11: SecureRetriever ★     |      8 | US-8, US-10 | Lana           |
| US-12: Chat endpoint         |      5 | US-11       | Troy           |
| US-13: Fail closed           |      3 | US-11       | Lana           |
| US-14: Chat UI shows chunks  |      5 | US-9, US-12 | Oleksandr      |
| US-15: Mock source ingestion |      5 | US-10       | Ahmed          |
| US-16: Sync + revocation     |      5 | US-15       | Ahmed          |

**Total:** 36 points

**Troy's fit:** US-12 (chat endpoint) matches his API design strength, and his interest in RAG starts here.

---

### Sprint 3 — Weeks 5–6 (RAG + Reliability)

| Story                        | Points | Depends On   | Suggested Lead |
| ---------------------------- | -----: | ------------ | -------------- |
| US-17: Baseline RAG          |      8 | US-11, US-12 | Troy           |
| US-18: Hybrid retrieval      |      8 | US-17        | Oleksandr      |
| US-19: Refusal               |      8 | US-17        | Lana           |
| US-20: Citations + streaming |      5 | US-17        | Troy           |
| US-21: Freshness             |      5 | US-17        | Lana           |
| US-22: Conflict              |      8 | US-21        | Lana           |

**Total:** 42 points

**Troy's fit:** This is his "want to learn" sprint. US-17 (baseline RAG) and US-20 (citations + streaming) give him deep exposure to the AI side. Pair him with Lana for US-19.

---

### Sprint 4 — Weeks 7–8 (Evaluation + Delivery)

| Story                    | Points | Depends On | Suggested Lead |
| ------------------------ | -----: | ---------- | -------------- |
| US-23: Golden dataset    |      5 | US-17      | Lana           |
| US-24: Metrics engine    |      8 | US-23      | Troy           |
| US-25: CI security gates |      5 | US-24      | Lana           |
| US-26: Admin UI + audit  |      5 | US-12      | Ahmed          |
| US-27: Demo video        |      5 | US-26      | Elliot         |

**Total:** 28 points

---

## 7. Frontend Involvement Across All Sprints

Every team member touches the frontend at some point.

| Sprint   | Frontend Story      | Frontend Tasks                                                   |
| -------- | ------------------- | ---------------------------------------------------------------- |
| Sprint 1 | US-3, US-9          | Scaffolding (shared), Login page (shared), route shells (shared) |
| Sprint 2 | US-14               | ChatInput, MessageList, ChunkCard, UserSwitcher                  |
| Sprint 3 | US-20, US-21, US-22 | CitationLink, SourcePanel, FreshnessWarning, ConflictNotice      |
| Sprint 4 | US-26, US-27        | Admin page, DocumentList, AuditLog, MetricsDashboard             |

**Rule:** Every team member contributes at least one frontend task per sprint.

### Suggested Frontend Rotation

| Sprint   | Lana             | Troy             | Oleksandr    | Ahmed            | Elliot         |
| -------- | ---------------- | ---------------- | ------------ | ---------------- | -------------- |
| Sprint 1 | Route wrapper    | Login form field | Scaffolding  | Login page       | Empty shells   |
| Sprint 2 | —                | ChatInput        | Chat page    | ChunkCard        | MessageList    |
| Sprint 3 | —                | SourcePanel      | CitationLink | FreshnessWarning | ConflictNotice |
| Sprint 4 | MetricsDashboard | —                | AuditLog     | DocumentList     | Admin page     |

---

## 8. The Kanban Workflow

See [`SCRUM_GUIDE.md`](./SCRUM_GUIDE.md) Sections 6 and 10 for the canonical workflow (`NEW → READY → IN PROGRESS → READY FOR TEST → DONE`) and WIP rules. This project uses that workflow without modification.

---

## 9. Issue Examples

See [`SCRUM_GUIDE.md`](./SCRUM_GUIDE.md) Section 11 for the canonical issue format. Project-specific examples:

### Issue: Login page 500 error on invalid password

```text
Type: Bug
Severity: High
Related Story: US-9
Assigned: [unassigned]

Description:
Login page returns 500 instead of 401 for wrong password.

Fix: Catch verification exception, return 401
Regression test: test_auth.py
```

### Issue: Freshness warning missing on stale citation

```text
Type: Bug
Severity: Medium
Related Story: US-21
Assigned: [unassigned]

Description:
Answer cites a 20-month-old HR policy but no warning appears.

Fix: Attach warning in response formatter when freshness.tier != "fresh"
Regression test: test_freshness.py
```

---

## 10. The Traceability Chain

```text
Taiga Story US-11 + Task T-11.5
      ↓
GitHub Issue #11 (mirrors US-11)
      ↓
Branch: security/us-11-t-11.5-secure-retriever
      ↓
PR: security(retriever): [US-11][T-11.5] enforce ACL filter (#11)
      ↓
Commit: security(retriever): enforce ACL filter / Refs: US-11, T-11.5, #11
      ↓
Merged to main
```

---

## Final Taiga Principle

The Taiga structure should make the project's work visible from the highest level down to implementation:

**Epic → User Story → Task → Branch → PR → Commit → Test → Done**

For this project, the central dependency is the security boundary:

**User Identity → Permission Resolution → SecureRetriever → Authorized Chunks → RAG Pipeline**

The team should use the dependency map and sprint assignments as the working plan while maintaining the project's security invariant throughout implementation.
