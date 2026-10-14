# Build Plan — Permission-Aware Knowledge Agent

**Project:** SER 401 – Project 14: Permission-Aware Knowledge Agent  
**Purpose:** The dependency-aware engineering roadmap for building the system, with the frontend woven in so we can see progress at every phase.

---

## 1. The Guiding Principle

> **Build the security boundary first. Build the frontend alongside it so we can see progress.**

We cannot build retrieval, RAG, freshness, or conflict detection before we have:

1. Users and identity
2. Permission resolution
3. An enforced ACL boundary

But we also cannot wait until Week 8 to see anything working. The frontend is built in parallel from Week 1 so every phase produces something visible.

The security invariant that must hold at every retrieval stage:

`R(u,q) ⊆ A(u)`

Where:

- **R(u, q)** = chunks retrieved for user **u** with query **q**
- **A(u)** = chunks authorized for user **u**

---

## 2. The Build Order (High Level)

```text
WEEK 1 — Foundation + Authentication
WEEK 2 — Documents + ACL + Authorization Tests
WEEK 3 — SECURE RETRIEVAL ★
WEEK 4 — Ingestion (mock source first)
WEEK 5 — RAG (5A baseline → 5B hybrid → 5C reliability)
WEEK 6 — Freshness + Conflict
WEEK 7 — Evaluation Harness (assembles continuous testing)
WEEK 8 — Delivery + Demo
```

Each phase produces a **working, testable, visible increment**.

---

## 3. Phase 0/1 — Foundation + Authentication (Week 1)

**Goal:** Application boots. Real login works in the browser. A protected page is reachable.

### Backend Build Order

|   # | Task                      | File(s)                                  | Why                      |
| --: | ------------------------- | ---------------------------------------- | ------------------------ |
|   1 | Initialize repo structure | Root folders                             | Everything needs a home  |
|   2 | Create `pyproject.toml`   | `pyproject.toml`                         | Dependency management    |
|   3 | FastAPI skeleton          | `app/main.py`                    | Server runs              |
|   4 | Health check endpoint     | `app/api/health.py`              | Proves server works      |
|   5 | Docker setup              | `Dockerfile`, `docker-compose.yml`       | Reproducible environment |

> Backend hosting decision: **Railway** (primary), Cloud Run (alternative), Render (fallback) — see [`docs/research/hosting-options.md`](../research/hosting-options.md) for the comparison.
|   6 | `.env.example`            | `.env.example`                           | Configuration template   |
|   7 | `.gitignore`              | `.gitignore`                             | Never commit secrets     |
|   8 | README with security rule | `README.md`                              | Security boundary at top |
|   9 | Supabase project setup    | Supabase dashboard + `SUPABASE_DB_URL`   | Hosted database running  |
|  10 | Database session          | `app/db/session.py`              | App connects to DB       |
|  11 | Base model                | `app/db/base.py`                 | SQLAlchemy base          |
|  12 | User model                | `app/models/user.py`             | `users` table            |
|  13 | Group model               | `app/models/group.py`            | `groups` + `user_groups` |
|  14 | Alembic setup             | `alembic.ini`, `migrations/`             | Migrations work          |
|  15 | Initial migration         | `migrations/versions/`                   | Tables created           |
|  16 | Supabase Auth signup/login  | Supabase dashboard + Auth API          | No local passwords       |
|  17 | Supabase token verification | `app/core/security.py`       | Supabase-issued tokens    |
|  18 | Auth schemas              | `app/schemas/auth.py`            | Request/response shapes  |
|  19 | Login endpoint            | `app/api/auth.py`                | `POST /api/auth/login`  |
|  20 | Auth dependency           | `app/core/security.py`           | `get_current_user()`     |
|  21 | Seed users & groups       | `app/db/seed.py`                 | Mock data                |
|  22 | Auth tests                | `tests/integration/test_auth.py` | Login works              |

### Frontend Build Order

|   # | Task                    | File(s)                         | Why                       |
| --: | ----------------------- | ------------------------------- | ------------------------- |
|   1 | Next.js + shadcn/ui setup | `frontend/` (frontend repo)       | Base app                  |
|   2 | Tailwind CSS            | `frontend/tailwind.config.js`   | Styling                   |
|   3 | shadcn/ui setup         | `frontend/src/components/ui/`   | Components                |
|   4 | API client with Supabase session | `frontend/src/lib/api.ts`       | Talk to backend           |
|   5 | Auth hook               | `frontend/src/hooks/useAuth.ts` | Login state               |
|   6 | Login page              | `frontend/src/pages/Login.tsx`  | Real login form           |
|   7 | Protected route wrapper | `frontend/src/components/auth/` | Redirect if not logged in |
|   8 | Placeholder Chat page   | `frontend/src/pages/Chat.tsx`   | Landing page              |
|   9 | Frontend Dockerfile     | `frontend/Dockerfile`           | Runs in Docker            |

### What We Can See

1. Open `http://localhost:3000`
2. Enter `alice` / `test`
3. Redirect to placeholder Chat page showing **"Welcome, Alice"**
4. Log out returns to Login page

**Exit criteria:** Real login works end-to-end. We can see it in the browser.

---

## 4. Phase 2 — Documents + ACL + Authorization Tests (Week 2)

**Goal:** Documents exist with ACLs, visible in Admin UI. The authorization contract is independently verified before vector retrieval exists.

### Backend Build Order

|   # | Task                          | File(s)                                         | Why                            |
| --: | ----------------------------- | ----------------------------------------------- | ------------------------------ |
|   1 | Document model                | `app/models/document.py`                | `documents` table              |
|   2 | DocumentACL model             | `app/models/document_acl.py`            | `document_acl` table           |
|   3 | Projection model              | `app/models/projection.py`              | `document_projections`         |
|   4 | Migration                     | `migrations/versions/`                          | Tables created                 |
|   5 | Document schemas              | `app/schemas/document.py`               | API shapes                     |
|   6 | **PermissionService (basic)** | `app/core/permission_service.py`        | `resolve_effective_principals` |
|   7 | AuditEvent model              | `app/models/audit_event.py`             | `audit_events`                 |
|   8 | Audit logger                  | `app/core/audit.py`                     | Write audit events             |
|   9 | Seed documents + ACLs         | `app/db/seed.py`                        | Test data                      |
|  10 | Admin endpoint: list docs     | `app/api/admin.py`                      | `GET /api/admin/documents`   |
|  11 | **PermissionService tests**   | `tests/unit/test_permission_service.py` | **Authorization contract**     |

### The Authorization Contract (Before Vector DB Exists)

```python
def test_alice_can_access_engineering_docs(db):
    principals = resolve_effective_principals(db, user_id=1)  # Alice
    doc = get_document(db, "engineering-handbook")
    assert can_access(principals, doc)

def test_alice_cannot_access_hr_docs(db):
    principals = resolve_effective_principals(db, user_id=1)  # Alice
    doc = get_document(db, "hr-salaries")
    assert not can_access(principals, doc)
```

This verifies authorization logic **independently** of retrieval. Debugging is easier.

### Frontend Build Order

|   # | Task                        | File(s)                                              | Why           |
| --: | --------------------------- | ---------------------------------------------------- | ------------- |
|   1 | Admin page shell            | `frontend/src/pages/Admin.tsx`                       | Container     |
|   2 | Document list component     | `frontend/src/components/admin/DocumentList.tsx`     | See documents |
|   3 | Permission matrix component | `frontend/src/components/admin/PermissionMatrix.tsx` | See ACLs      |
|   4 | Wire to backend             | `frontend/src/pages/Admin.tsx`                       | Real data     |

### What We Can See

Open `/admin` → a table of documents with their ACLs and which users/groups can access them.

**Exit criteria:** Authorization logic is independently tested. ACLs are visible in the Admin UI.

---

## 5. Phase 3 — SECURE RETRIEVAL ★ (Week 3)

**Goal:** The system enforces `retrieved_chunks ⊆ authorized_chunks` at every retrieval boundary.

**This is the most important phase of the entire project.**

### Backend Build Order

|   # | Task                                | File(s)                                               | Why                          |
| --: | ----------------------------------- | ----------------------------------------------------- | ---------------------------- |
|   1 | Vector DB client                    | `app/services/retrieval/vector_store.py`      | Connect to Pinecone |
|   2 | Chunk projection                    | `app/services/sync/projection.py`             | Project docs → vector DB     |
|   3 | ACL projection                      | `app/services/sync/projection.py`             | Build `acl_principals`       |
|   4 | **SecureRetriever**                 | `app/services/retrieval/secure_retriever.py`  | **The security boundary**    |
|   5 | Permission filter builder           | `app/services/retrieval/secure_retriever.py`  | Filter from principals       |
|   6 | **Permission leakage test**         | `tests/security/test_permission_leakage.py`   | **Zero leakage**             |
|   7 | **ACL invariant test (all stages)** | `tests/security/test_acl_invariant_stages.py` | **Every stage safe**         |
|   8 | **Fail-closed test**                | `tests/security/test_fail_closed.py`          | No perms → no search         |
|   9 | Chat endpoint (chunks only)         | `app/api/chat.py`                             | `POST /api/chat` returns chunks |

### The Security Boundary

```python
# app/services/retrieval/secure_retriever.py

class SecureRetriever:
    def search(self, auth_context, query, top_k=5):
        principals = auth_context.principals
        security_filter = {"acl_principals": {"$in": principals}}
        return self.vector_store.similarity_search(
            query=query, k=top_k, filter=security_filter
        )
```

**Rule:** No code may call `vector_store.similarity_search()` directly. All retrieval goes through `SecureRetriever`.

### The Invariant Test

```python
def test_unauthorized_never_crosses_retrieval_boundary(client, intern_token):
    response = client.post("/api/chat",
        json={"query": "What is the CEO's salary?"},
        headers={"Authorization": f"Bearer {intern_token}"})

    meta = response.json()["metadata"]
    authorized = get_authorized_chunk_ids("intern")

    assert set(meta["vector_candidates"]) <= authorized
    assert set(meta["bm25_candidates"])   <= authorized
    assert set(meta["rrf_candidates"])    <= authorized
    assert set(meta["reranked_chunks"])   <= authorized
    assert set(meta["llm_context"])       <= authorized
```

### Frontend Build Order

|   # | Task                       | File(s)                                         | Why                      |
| --: | -------------------------- | ----------------------------------------------- | ------------------------ |
|   1 | Chat input + send button   | `frontend/src/components/chat/ChatInput.tsx`    | Type a question          |
|   2 | Message list               | `frontend/src/components/chat/MessageList.tsx`  | See results              |
|   3 | Chunk display              | `frontend/src/components/chat/ChunkCard.tsx`    | See retrieved chunks     |
|   4 | Wire Chat page to `/chat`  | `frontend/src/pages/Chat.tsx`                   | Real retrieval           |
|   5 | User switcher (real users) | `frontend/src/components/auth/UserSwitcher.tsx` | Login as different users |

### What We Can See

1. Log in as `alice` (engineer)
2. Ask **"What is the vacation policy?"** → see chunks
3. Log in as `intern`
4. Ask the same question → see **different chunks** (or zero)

**Exit criteria:** Unauthorized chunks never cross the retrieval boundary. Proven by test, visible in the browser.

---

## 6. Phase 4 — Ingestion (Week 4)

**Goal:** Documents flow from a mock source into Supabase and the vector DB.

**Important:** We use a **mock source first**. Google Drive and Discord integrations are optional additions after the core ingestion pipeline works.

### Backend Build Order

|   # | Task                         | File(s)                                                | Why                        |
| --: | ---------------------------- | ------------------------------------------------------ | -------------------------- |
|   1 | Base ingestor                | `app/services/ingestion/base.py`               | Interface for sources      |
|   2 | **MockSource connector**     | `app/services/ingestion/connectors/mock.py`    | No external API dependency |
|   3 | Chunking strategies          | `app/services/ingestion/chunking.py`           | Split documents            |
|   4 | ACL translator               | `app/services/ingestion/acl_translator.py`     | Source ACL → unified       |
|   5 | Ingestion pipeline           | `app/services/ingestion/`                      | End-to-end ingestion       |
|   6 | Sync worker                  | `app/jobs/sync_permissions.py`                 | Keep permissions current   |
|   7 | Projection updater           | `app/services/sync/projection.py`              | Supabase → vector DB       |
|   8 | Admin endpoint: trigger sync | `app/api/admin.py`                             | `POST /api/admin/sync`       |
|   9 | Ingestion tests              | `tests/integration/test_ingestion.py`          | Ingestion works            |
|  10 | **Revocation test**          | `tests/security/test_permission_revocation.py` | Revocation propagates      |

### The Ingestion Flow

```text
MockSource
    ↓
Ingestion Interface
    ↓
ACL Translator
    ↓
Chunker
    ↓
Supabase
    ↓
Vector DB
```

### Frontend Build Order

|   # | Task                   | File(s)                                        | Why               |
| --: | ---------------------- | ---------------------------------------------- | ----------------- |
|   1 | Source list component  | `frontend/src/components/admin/SourceList.tsx` | See sources       |
|   2 | "Sync now" button      | `frontend/src/components/admin/SyncButton.tsx` | Trigger ingestion |
|   3 | Ingestion status panel | `frontend/src/components/admin/SyncStatus.tsx` | See progress      |
|   4 | Wire to backend        | `frontend/src/pages/Admin.tsx`                 | Real sync         |

### What We Can See

1. Open `/admin`
2. See source: **"Mock Source — 42 documents"**
3. Click **"Sync now"**
4. Watch the document count increase

**Exit criteria:** Ingestion works end-to-end with a mock source. Revocation propagates correctly.

---

## 7. Phase 5 — RAG (Week 5)

**Goal:** The chat UI answers questions with citations and refusals.

**Phase 5 is split into three sub-phases. Each sub-phase is tested independently before adding the next.**

### Phase 5A — Baseline RAG (Days 1–2)

```text
SecureRetriever → authorized chunks → Evidence → LLM → Answer
```

|   # | Task                 | File(s)                                      | Why                   |
| --: | -------------------- | -------------------------------------------- | --------------------- |
|   1 | RAG state            | `app/services/rag/state.py`          | Graph state shape     |
|   2 | Retrieval node       | `app/services/rag/nodes/retrieve.py` | Calls SecureRetriever |
|   3 | Evidence node        | `app/services/rag/nodes/evidence.py` | Sufficiency check     |
|   4 | Generate node        | `app/services/rag/nodes/generate.py` | LLM call              |
|   5 | Refuse node          | `app/services/rag/nodes/refuse.py`   | Refusal responses     |
|   6 | LangGraph assembly   | `app/services/rag/graph.py`          | Wire baseline         |
|   7 | Chat endpoint (full) | `app/api/chat.py`                    | Full pipeline         |

**Exit criteria:** System answers questions with authorized evidence only.

### Phase 5B — Hybrid Retrieval (Days 3–4)

```text
Vector ─┐
        ├── RRF → Reranker → Evidence
BM25 ───┘
```

|   # | Task                | File(s)                                      | Why             |
| --: | ------------------- | -------------------------------------------- | --------------- |
|   1 | BM25 index          | `app/services/retrieval/bm25.py`     | Keyword search  |
|   2 | Hybrid search + RRF | `app/services/retrieval/hybrid.py`   | Combine results |
|   3 | Reranker            | `app/services/retrieval/reranker.py` | Cross-encoder   |

**Exit criteria:** Hybrid retrieval improves Recall@5 compared to baseline.

### Phase 5C — Reliability (Day 5)

```text
Query rewrite → Retrieval → Evidence → Generate → Verify → Refuse if needed
```

|   # | Task          | File(s)                                           | Why                |
| --: | ------------- | ------------------------------------------------- | ------------------ |
|   1 | Query rewrite | `app/services/retrieval/query_rewrite.py` | Additive rewriting |
|   2 | Verify node   | `app/services/rag/nodes/verify.py`        | Citation check     |
|   3 | RAG tests     | `tests/integration/test_rag_pipeline.py`  | Pipeline works     |

**Exit criteria:** Full reliability pipeline works with citation verification.

### Frontend Build Order (All of Phase 5)

|   # | Task                | File(s)                                           | Why                |
| --: | ------------------- | ------------------------------------------------- | ------------------ |
|   1 | Citation links      | `frontend/src/components/chat/CitationLink.tsx`   | Clickable sources  |
|   2 | Citation side panel | `frontend/src/components/chat/SourcePanel.tsx`    | View source        |
|   3 | Streaming responses | `frontend/src/hooks/useChat.ts`                   | Tokens appear live |
|   4 | Refusal display     | `frontend/src/components/chat/RefusalMessage.tsx` | Clear refusals     |

### What We Can See

1. Ask **"How do I request vacation?"** → streamed answer with `[1]` citations
2. Click `[1]` → source document opens in a side panel
3. Ask **"What is the CEO's salary?"** as an intern → refusal message

**Exit criteria:** Working chat interface with citations and refusals.

---

## 8. Phase 6 — Freshness + Conflict (Week 6)

**Goal:** The chat UI shows freshness warnings and conflict notices.

### Backend Build Order

|   # | Task                | File(s)                                            | Why                         |
| --: | ------------------- | -------------------------------------------------- | --------------------------- |
|   1 | Freshness policy    | `app/services/freshness/policy.py`         | Per-content-type thresholds |
|   2 | Freshness evaluator | `app/services/freshness/evaluator.py`      | Three-timestamp model       |
|   3 | Freshness node      | `app/services/rag/nodes/freshness.py`      | LangGraph node              |
|   4 | Freshness schemas   | `app/schemas/freshness.py`                 | API shape                   |
|   5 | Freshness tests     | `tests/unit/test_freshness.py`             | Correct tiers               |
|   6 | Claim extractor     | `app/services/conflict/claim_extractor.py` | Structured claims           |
|   7 | Conflict detector   | `app/services/conflict/detector.py`        | Four-stage                  |
|   8 | Conflict classifier | `app/services/conflict/classifier.py`      | States                      |
|   9 | Conflict node       | `app/services/rag/nodes/conflict.py`       | LangGraph node              |
|  10 | Conflict schemas    | `app/schemas/conflict.py`                  | API shape                   |
|  11 | Conflict tests      | `tests/unit/test_conflict.py`              | Correct classification      |
|  12 | Response formatter  | `app/api/chat.py`                          | Attach warnings             |

### Frontend Build Order

|   # | Task                       | File(s)                                             | Why              |
| --: | -------------------------- | --------------------------------------------------- | ---------------- |
|   1 | Freshness warning banner   | `frontend/src/components/chat/FreshnessWarning.tsx` | Yellow warning   |
|   2 | Conflict notice            | `frontend/src/components/chat/ConflictNotice.tsx`   | Show both claims |
|   3 | Citation freshness badge   | `frontend/src/components/chat/FreshnessBadge.tsx`   | Color-coded      |
|   4 | Wire to response formatter | `frontend/src/components/chat/MessageBubble.tsx`    | Real warnings    |

### What We Can See

1. Ask **"What is the vacation policy?"** → answer + `⚠️ This source is 14 months old`
2. Ask a question with contradictory sources → both claims side by side with a conflict notice

**Exit criteria:** Warnings and conflicts are visible in the UI.

**Important:** Freshness does not override authorization. A very fresh document the user cannot access is still inaccessible.

---

## 9. Phase 7 — Evaluation Harness (Week 7)

**Goal:** Assemble the continuous testing into a unified harness. CI gates enforce security.

**Important:** Testing started in Week 2. Week 7 **assembles** what we have been building, not starts testing for the first time.

### Backend Build Order

|   # | Task                      | File(s)                               | Why                       |
| --: | ------------------------- | ------------------------------------- | ------------------------- |
|   1 | Golden dataset            | `data/evaluation/golden_dataset.json` | ~100 questions            |
|   2 | Dataset loader            | `app/evaluation/dataset.py`   | Load cases                |
|   3 | Metrics engine            | `app/evaluation/metrics.py`   | Compute all metrics       |
|   4 | LLM judges                | `app/evaluation/judges.py`    | Faithfulness              |
|   5 | Runner                    | `app/evaluation/runner.py`    | Run all cases             |
|   6 | Report generator          | `app/evaluation/report.py`    | Markdown report           |
|   7 | Security gates            | `app/evaluation/gates.py`     | Block on leakage          |
|   8 | **CI: test.yml**          | `.github/workflows/test.yml`          | Unit + integration + lint |
|   9 | **CI: security.yml**      | `.github/workflows/security.yml`      | **Merge gate**            |
|  10 | **CI: evaluation.yml**    | `.github/workflows/evaluation.yml`    | Quality metrics           |
|  11 | Ablation study            | `scripts/run_evaluation.py`           | Vector vs Hybrid vs Full  |
|  12 | Admin endpoint: audit log | `app/api/admin.py`            | `GET /api/admin/audit`       |

### Frontend Build Order

|   # | Task                  | File(s)                                              | Why           |
| --: | --------------------- | ---------------------------------------------------- | ------------- |
|   1 | Audit log table       | `frontend/src/components/admin/AuditLog.tsx`         | Query history |
|   2 | Metrics dashboard     | `frontend/src/components/admin/MetricsDashboard.tsx` | See scores    |
|   3 | Permission leak gauge | `frontend/src/components/admin/LeakGauge.tsx`        | 0% visible    |
|   4 | Wire to backend       | `frontend/src/pages/Admin.tsx`                       | Real metrics  |

### The CI Workflow Roles

| Workflow         | Contains                                                                     | Gate                         |
| ---------------- | ---------------------------------------------------------------------------- | ---------------------------- |
| `test.yml`       | Unit + integration + lint/type checks                                        | Report                       |
| `security.yml`   | Permission leakage, ACL invariant, fail-closed, revocation, prompt injection | **MUST FAIL ON ANY LEAKAGE** |
| `evaluation.yml` | Golden dataset, Recall@K, MRR, NDCG, refusal accuracy, faithfulness          | Empirical thresholds         |

### What We Can See

1. Open `/admin/audit` → every query ever made
2. Open `/admin/metrics` → the evaluation report

Run locally:

```bash
uv run python -m app.evaluation.runner

# ========== EVALUATION REPORT ==========
# Permission Leakage Rate: 0.00%   ✅
# Refusal Accuracy:        96.4%   ✅
# Recall@5:                91.2%   ✅
# Faithfulness:            96.1%   ✅
# =======================================
```

**Exit criteria:** CI gate blocks any leakage. Metrics are visible in the dashboard.

---

## 10. Phase 8 — Delivery + Demo (Week 8)

**Goal:** A polished demo-ready application.

### Build Order

|   # | Task                                     | Why                |
| --: | ---------------------------------------- | ------------------ |
|   1 | Full regression run                      | Nothing broken     |
|   2 | Documentation review                     | All docs finalized |
|   3 | Architecture diagrams                    | For the report     |
|   4 | UI polish (loading, empty, error states) | Feels finished     |
|   5 | Demo scenarios prepared                  | Clear demo path    |
|   6 | Record demo video (5–10 min)             | Final deliverable  |

### Demo Scenario

1. Log in as Alice (engineer)
2. Ask **"How do I request vacation?"** → answer with citations
3. Show source panel
4. Switch to intern
5. Ask **"What is the CEO's salary?"** → refusal
6. Ask the same vacation question → different chunks (permission-aware)
7. Show the conflict notice on a contradictory question
8. Show the freshness warning on a stale source
9. Open Admin → audit log shows every query

**Exit criteria:** A demo-ready application and video.

---

## 11. The Dependency Diagram

```text
                 ┌──────────────────────┐
                 │   Foundation/Auth    │
                 └──────────┬───────────┘
                            ↓
                 ┌──────────────────────┐
                 │   Documents + ACL    │
                 └──────────┬───────────┘
                            ↓
                 ┌──────────────────────┐
                 │   Secure Retrieval   │
                 │  ★ Security Boundary │
                 └──────────┬───────────┘
                            ↓
                 ┌──────────────────────┐
                 │     Ingestion        │
                 └──────────┬───────────┘
                            ↓
                 ┌──────────────────────┐
                 │        RAG           │
                 └──────────┬───────────┘
                            ↓
                 ┌──────────┴───────────┐
                 ▼                      ▼
          ┌─────────────┐       ┌─────────────┐
          │ Freshness   │       │ Conflict    │
          └──────┬──────┘       └──────┬──────┘
                 └──────────┬───────────┘
                            ▼
                 ┌──────────────────────┐
                 │  Evidence + Response │
                 └──────────────────────┘

   ┌───────────────────────────────────────────┐
   │ Evaluation + Security Tests               │
   │ Starts early → expands throughout project │
   └───────────────────────────────────────────┘

   ┌───────────────────────────────────────────┐
   │ Frontend                                  │
   │ Built alongside every phase               │
   └───────────────────────────────────────────┘
```

---

## 12. The Continuous Testing Timeline

Testing is not a phase. It is a continuous activity that starts in Week 2.

| Week   | Tests Added                                           |
| ------ | ----------------------------------------------------- |
| Week 2 | PermissionService unit tests (authorization contract) |
| Week 3 | Permission leakage, ACL invariant, fail-closed        |
| Week 4 | Ingestion, revocation                                 |
| Week 5 | Retrieval metrics, RAG tests                          |
| Week 6 | Freshness, conflict tests                             |
| Week 7 | Unified evaluation harness + CI reporting             |

Week 7 **assembles** the evaluation system — it does not start testing for the first time.

---

## 13. The CI Roles

See Phase 7 (Section 9) for the canonical CI workflow table (`test.yml`, `security.yml`, `evaluation.yml`).

**Key distinction:** Security is a hard invariant (must always be 0% leakage). Quality is empirical (targets established through evaluation).

---

## 14. The Milestones

| Milestone | When   | Proves                                                 |
| --------- | ------ | ------------------------------------------------------ |
| M1        | Week 1 | Application boots                                      |
| M2        | Week 1 | Authentication works                                   |
| M3        | Week 2 | Identity + ACL model works                             |
| M4        | Week 3 | **Unauthorized chunks never cross retrieval boundary** |
| M5        | Week 4 | Documents can be ingested and projected                |
| M6        | Week 5 | Secure RAG produces grounded answers/refusals          |
| M7        | Week 6 | Freshness/conflicts are surfaced                       |
| M8        | Week 7 | Regression/security evaluation is automated            |
| M9        | Week 8 | Complete demonstrable system                           |

**The most important milestone is M4.** It is not "users see different chunks." It is "unauthorized data cannot cross the retrieval boundary."

---

## 15. What NOT to Do

| Anti-Pattern                                                    | Why It Fails                                                         |
| --------------------------------------------------------------- | -------------------------------------------------------------------- |
| Build retrieval before security                                 | We will rewrite everything                                           |
| Wait until Week 8 for any UI                                    | We can't see progress, can't demo early                              |
| Skip Phase 3 (SecureRetriever)                                  | Everything downstream becomes insecure                               |
| Build everything, then test                                     | We can't tell what broke                                             |
| Make Google Drive a hard dependency                             | External APIs add complexity we don't need to solve the core problem |
| Add HyDE before baseline retrieval                              | Too many variables to diagnose                                       |
| Wait until Week 7 to start testing                              | Security bugs compound                                               |
| Make the frontend enforce permissions                           | The backend is the only trusted authorization boundary               |
| Make `security.yml` duplicate `evaluation.yml`                  | They have different roles and different failure semantics            |
| Let `secure_retriever.py` drift from `services/retrieval/` | Canonical location is `app/services/retrieval/secure_retriever.py` — one file, one source of truth |

---

## Final Build Philosophy

The roadmap is intentionally dependency-aware:

```text
Identity
   ↓
Authorization
   ↓
Secure Retrieval
   ↓
Ingestion
   ↓
RAG
   ↓
Freshness + Conflict
   ↓
Evaluation
   ↓
Delivery
```

At the same time, the frontend evolves alongside the backend:

```text
Week 1 → Login
Week 2 → Admin + ACL visibility
Week 3 → Retrieval UI
Week 4 → Sync UI
Week 5 → Chat + citations + refusals
Week 6 → Freshness + conflict indicators
Week 7 → Metrics + audit dashboard
Week 8 → Polish + demo
```

The result is a project that is not only built in the correct dependency order, but also produces visible progress every week while continuously testing the security properties that matter most.
