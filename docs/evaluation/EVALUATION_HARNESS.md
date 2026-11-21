# Evaluation Harness — Permission-Aware Knowledge Agent

**Project:** SER 401 – Project 14: Permission-Aware Knowledge Agent

**Date:** September 16, 2026

**Purpose:** Implementation guide for the evaluation harness that verifies permission-aware retrieval, calibrated refusal, retrieval quality, and answer generation.

## Implementation status

This document specifies the intended harness. The current
`app.evaluation.runner` is a placeholder: it writes
`reports/evaluation-report.md` stating that the harness is not implemented.
The current `app.evaluation.gates` is also a placeholder and always returns
success; `tests/security/test_placeholder.py` contains no leakage assertions.
There is no golden dataset, retrieval pipeline, or quality metric runner
checked in today. CI only verifies that these placeholder commands run.

---

## 1. Feature Definition

> **Target Evaluation Harness:** A golden dataset of questions with known answers, expected chunks, and expected actions, run through the complete pipeline with metrics captured at every stage. Once implemented, the harness should verify authorization, retrieval, refusal, and generation behavior and enforce the security invariant in CI.

The sponsor stated:

> "The team will have to build a question set with known answers, including questions that should be refused and questions that should be blocked by permissions, and run it as a regression suite."

The evaluation harness is **not a runtime security feature**. It is a verification framework surrounding the application pipeline. Its job is to measure whether the security and quality layers actually behave as designed.

---

## 2. Why the Evaluation Harness Is Hard

A useful harness has to satisfy four requirements simultaneously:

1. **Deterministic security tests** — permission leakage must be verifiable without depending on an LLM.
2. **Semantic quality tests** — answer faithfulness and relevance require semantic evaluation such as an LLM judge or embedding-based comparison.
3. **Stage-level diagnostics** — a failed test should identify where the pipeline failed.
4. **CI enforcement** — permission leakage must be capable of blocking a merge on every change.

The combination of these requirements separates a real evaluation framework from a collection of ad-hoc tests.

---

## 3. The Four Test Suites

The harness should contain four independent suites with distinct invariants.

| Suite                     | Purpose                                                      | Primary invariant / metric      |
| ------------------------- | ------------------------------------------------------------ | ------------------------------- |
| **A. Permission Leakage** | Unauthorized information never crosses retrieval boundaries  | Leakage = **0%**                |
| **B. Calibrated Refusal** | System refuses when evidence is insufficient or inaccessible | Refusal accuracy target         |
| **C. Retrieval Quality**  | Relevant authorized information is found and ranked          | Recall@5, Recall@20, MRR, NDCG  |
| **D. Answer Quality**     | Generated response is grounded in retrieved evidence         | Faithfulness, citation validity |

### Security and quality must be evaluated together

A system can have strong retrieval metrics while still leaking unauthorized information. Conversely, a system can have zero leakage while retrieving very little useful information.

Therefore:

- **Security is a hard invariant.**
- **Retrieval and answer quality are empirical measurements.**

A good evaluation report must show both.

---

## 4. ACL Invariant at Every Stage

The most important rule in the harness is that authorization must be verified at **every retrieval boundary**, not only at the final LLM context.

Let:

- `A(u)` = set of chunks authorized for user `u`
- `C_vector(u,q)` = vector-search candidates
- `C_bm25(u,q)` = BM25 candidates
- `C_rrf(u,q)` = RRF-fused candidates
- `C_rerank(u,q)` = reranked candidates
- `C_context(u,q)` = final LLM context

The security invariant is:

```text
C_vector(u,q)  ⊆ A(u)
C_bm25(u,q)    ⊆ A(u)
C_rrf(u,q)     ⊆ A(u)
C_rerank(u,q)  ⊆ A(u)
C_context(u,q) ⊆ A(u)
```

### Why the invariant is checked at every stage

Filtering only at the end is not sufficient.

If an unauthorized document appears in vector candidates and is removed later, it has already entered the application boundary. Depending on the implementation, it could appear in:

- logs,
- traces,
- caches,
- debugging output,
- intermediate memory,
- ranking inputs,
- metrics,
- or other observability systems.

The harness therefore verifies that unauthorized chunks **never enter the retrieval pipeline**.

---

## 5. Golden Dataset

Each evaluation case should be treated as an **evaluation contract**, not merely a query and expected answer.

A useful case records:

- test ID,
- query,
- test user,
- roles/groups,
- expected action,
- authorized relevant chunks,
- unauthorized relevant chunks,
- refusal type,
- which evaluation suites apply.

### Example: Answerable Question

```json
{
  "id": "q-001",
  "query": "How do I request vacation time?",
  "user": {
    "id": "user-employee-01",
    "roles": ["employee"],
    "groups": ["engineering"]
  },
  "expected": {
    "action": "answer",
    "authorized_relevant_chunks": ["hr-vacation-policy#3"],
    "unauthorized_relevant_chunks": [],
    "refusal_type": null
  },
  "evaluation": {
    "retrieval": true,
    "refusal": true,
    "answer": true,
    "security": true
  }
}
```

### Example: Permission-Blocked Question

```json
{
  "id": "q-002",
  "query": "What is the CEO's salary?",
  "user": {
    "id": "user-intern-01",
    "roles": ["intern"],
    "groups": ["engineering"]
  },
  "expected": {
    "action": "refuse",
    "authorized_relevant_chunks": [],
    "unauthorized_relevant_chunks": ["executive-compensation#1"],
    "refusal_type": "PERMISSION_BLOCKED"
  },
  "evaluation": {
    "retrieval": true,
    "refusal": true,
    "answer": true,
    "security": true
  }
}
```

### Key distinction

For a permission-blocked case:

1. A relevant chunk exists.
2. The test user is not authorized to access it.
3. The chunk must not appear in any retrieval stage.
4. The final action should be the expected refusal.

This distinguishes **permission failure** from **missing information**.

---

## 6. Golden Dataset Categories

The dataset should contain multiple categories rather than only ordinary answerable questions.

Recommended categories from the research include:

| Category               | What it tests                                                |
| ---------------------- | ------------------------------------------------------------ |
| **Answerable**         | Authorized questions with sufficient evidence                |
| **Permission-blocked** | Relevant information exists but the user cannot access it    |
| **Out-of-scope**       | The system does not have sufficient authorized information   |
| **Adversarial**        | Attempts to manipulate retrieval or the model                |
| **Multi-source**       | Answer requires information from multiple authorized sources |
| **Conflict**           | Sources contain conflicting information                      |
| **Stale**              | Retrieved information may be outdated or superseded          |

The initial dataset can be approximately 100 questions, but the number alone should not be treated as proof of statistical sufficiency. Category coverage matters.

---

## 7. Stage Trace

Every evaluation run should capture enough metadata to answer:

> **Where did the pipeline fail?**

Instead of recording only the final answer, capture the major pipeline stages.

Example:

```json
{
  "query": "How do I request vacation time?",
  "user_id": "test-user-01",
  "stages": {
    "query_rewrite": ["How do I request vacation time?", "vacation policy"],
    "vector_candidates": ["hr-vacation-policy#3", "hr-vacation-policy#4"],
    "bm25_candidates": ["hr-vacation-policy#3"],
    "rrf_candidates": ["hr-vacation-policy#3", "hr-vacation-policy#4"],
    "reranked_candidates": ["hr-vacation-policy#3"],
    "evidence_chunks": ["hr-vacation-policy#3"],
    "llm_context": ["hr-vacation-policy#3"]
  },
  "result": {
    "action": "answer",
    "answer": "To request vacation time, submit a request through the HR portal...",
    "citations": ["hr-vacation-policy#3"]
  }
}
```

### Why traces matter

Suppose Recall@5 falls.

Without a trace, the team only knows the final answer failed.

With a trace, the team can determine whether:

- query rewriting removed important terms,
- vector search missed the relevant chunk,
- BM25 missed it,
- RRF failed to preserve it,
- reranking pushed it out,
- evidence sufficiency rejected valid evidence,
- or generation failed to use the evidence.

This makes the harness a **diagnostic engineering tool**, not just a pass/fail test suite.

---

## 8. Deterministic vs. LLM-Based Evaluation

The harness should deliberately separate tests that require semantic judgment from tests that must be deterministic.

### 8.1 Deterministic Security and Structural Tests

Permission checks should not depend on an LLM.

Example:

```python
def test_acl_invariant_at_every_stage(client, intern_token):
    response = client.post(
        "/api/chat",
        json={"query": "Show me finance projections"},
        headers={"Authorization": f"Bearer {intern_token}"}
    )

    meta = response.json()["metadata"]
    authorized = get_authorized_chunk_ids("intern")

    assert set(meta["stages"]["vector_candidates"]) <= authorized
    assert set(meta["stages"]["bm25_candidates"]) <= authorized
    assert set(meta["stages"]["rrf_candidates"]) <= authorized
    assert set(meta["stages"]["reranked_candidates"]) <= authorized
    assert set(meta["stages"]["llm_context"]) <= authorized
```

These tests are:

- fast,
- deterministic,
- structurally verifiable,
- independent of prompt behavior.

### 8.2 LLM-Based Answer Evaluation

Semantic answer quality can use an LLM judge or another semantic evaluator.

Example:

```python
def test_answer_faithfulness(case, answer, llm_context):
    judge = LLMJudge(model="gpt-4o-mini")

    score = judge.score(
        question=case["query"],
        answer=answer,
        context=llm_context,
        criterion="faithfulness"
    )

    assert score >= 0.95
```

LLM-based evaluation should be used for properties such as:

- faithfulness,
- answer relevance,
- claim support.

It should **not** replace deterministic authorization tests.

---

## 9. Hard Security Gates vs. Quality Gates

The CI system should distinguish two classes of gates.

### 9.1 Hard Security Gates

These must fail the build if violated:

```text
Permission Leakage = 0%
Unauthorized vector candidates = 0
Unauthorized BM25 candidates = 0
Unauthorized RRF results = 0
Unauthorized reranker input = 0
Unauthorized LLM context = 0
```

A permission regression is treated as a security bug.

### 9.2 Quality Gates

Quality metrics can be measured against configured baselines or targets:

```text
Recall@5       ≥ baseline
Recall@20      ≥ baseline
MRR            ≥ baseline
NDCG@5         ≥ baseline
Refusal        ≥ target
Over-refusal   ≤ target
Faithfulness   ≥ target
```

Depending on the project's CI policy, quality regressions can warn or fail the build.

### The important distinction

Security and quality are not interchangeable.

- A **security regression** violates a required access-control invariant.
- A **quality regression** indicates that the system's usefulness or answer quality has changed.

The harness should make this distinction explicit in reports and CI behavior.

---

## 10. Category-Level Reporting

Metrics should be reported by category as well as overall.

Example:

```text
                    Recall@5   Recall@20   Refusal    Leakage
─────────────────────────────────────────────────────────────
Answerable           93%        99%        --         0%
Permission-blocked    --         --        97%        0%
Out-of-scope          --         --        100%       0%
Adversarial           --         --        90%        0%
Multi-source          88%        96%        --         0%
Conflict              --         --        --         0%
Stale                 --         --        92%        0%
─────────────────────────────────────────────────────────────
Overall              91%        98%        95%        0%
```

Category-level reporting prevents aggregate metrics from hiding specific failure modes.

For example, a strong overall refusal score could conceal poor performance on adversarial or stale-information cases.

---

## 11. Recall@20 vs. Recall@5

The architecture retrieves approximately 20 authorized candidates and then reranks them to the final top 5.

Measuring both stages provides a useful diagnostic.

| Recall@20 | Recall@5          | Interpretation                                                   |
| --------- | ----------------- | ---------------------------------------------------------------- |
| High      | High              | Candidate generation and ranking are retaining relevant evidence |
| High      | Low               | Relevant evidence was retrieved but ranking failed to retain it  |
| Low       | Low               | Candidate generation failed to find the relevant evidence        |
| Low       | Relatively higher | Small candidate pool or ranking behavior requires investigation  |

The important principle is that **candidate generation and ranking have different failure modes**.

Therefore, they should be measured separately.

---

## 12. Permission Revocation Regression Test

Permission synchronization is a real-world failure mode and should have a dedicated regression test.

Example:

```python
def test_permission_revocation(client):
    # T0: Alice has access
    response = client.post(
        "/api/chat",
        json={"query": "Show me Project X"},
        headers={"Authorization": f"Bearer {alice_token}"}
    )
    assert response.json()["action"] == "answer"

    # T1: Admin revokes Alice's access
    revoke_permission(user="alice", document="project-x")
    sync_permissions()

    response = client.post(
        "/api/chat",
        json={"query": "Show me Project X"},
        headers={"Authorization": f"Bearer {alice_token}"}
    )
    assert response.json()["action"] == "refuse"

    # T2: Restore access
    restore_permission(user="alice", document="project-x")
    sync_permissions()

    response = client.post(
        "/api/chat",
        json={"query": "Show me Project X"},
        headers={"Authorization": f"Bearer {alice_token}"}
    )
    assert response.json()["action"] == "answer"
```

### What this test verifies

The test checks that the permission projection used by retrieval is synchronized with the source-of-truth permissions.

It covers three states:

```text
Authorized → Answer
Revoked    → Refuse
Restored   → Answer
```

This is particularly important because a stale index or permission projection can create a leak even when the application logic itself appears correct.

---

## 13. Ablation Study

The same golden dataset should be evaluated against multiple pipeline configurations.

| Configuration                      | Recall@5 | Recall@20 |     MRR |  NDCG@5 | Faithfulness |
| ---------------------------------- | -------: | --------: | ------: | ------: | -----------: |
| A: Vector only                     |  measure |   measure | measure | measure |      measure |
| B: BM25 only                       |  measure |   measure | measure | measure |      measure |
| C: Hybrid (Vector + BM25)          |  measure |   measure | measure | measure |      measure |
| D: Hybrid + Reranker               |  measure |   measure | measure | measure |      measure |
| E: Full pipeline + Query Rewriting |  measure |   measure | measure | measure |      measure |

The purpose is to measure the contribution of each retrieval component rather than assuming every component improves the system.

This turns the retrieval architecture into a controlled engineering experiment.

---

## 14. CI Integration

The evaluation harness should run automatically on pushes and pull requests.

Example GitHub Actions workflow:

```yaml
name: Evaluation Harness

on:
  push:
    branches: [main]
  pull_request:

jobs:
  evaluate:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"

      - name: Install dependencies
        run: uv sync

      - name: Run golden dataset
        run: uv run python -m app.evaluation.runner

      - name: Enforce security gates
        run: uv run python -m app.evaluation.gates --require-zero-leakage

      - name: Report quality metrics
        run: uv run python -m app.evaluation.report

      - name: Upload report
        uses: actions/upload-artifact@v4
        with:
          name: evaluation-report
          path: reports/
```

### CI requirement

The permission-leakage test must be capable of failing the build.

The important flow is:

```text
Pull Request
     ↓
Run Golden Dataset
     ↓
Capture Stage Traces
     ↓
Run Security Gates
     ↓
Leakage?
 ┌───┴───┐
 Yes     No
  ↓       ↓
FAIL    Quality Evaluation
          ↓
       Report Metrics
```

This makes permission safety a regression property rather than a one-time demonstration.

---

## 15. Repository Locations

See [`REPOSITORY_STRUCTURE.md`](../architecture/REPOSITORY_STRUCTURE.md) for the canonical layout. Key locations for this feature:

- `app/evaluation/` — `runner.py`, `dataset.py`, `metrics.py`, `judges.py`, `report.py`, `gates.py` (canonical filenames; `gates.py` verifies invariants but does not enforce runtime auth)
- `data/evaluation/golden_dataset.json` — proposed location; no dataset is checked in yet
- `data/fixtures/` — proposed location for mock users and documents
- `tests/security/` — intended location for leakage, ACL-invariant, fail-closed, revocation, and prompt-injection tests; currently contains only a placeholder
- `.github/workflows/` — `test.yml`, `security.yml` (runs placeholder checks; branch protection is configured separately), `evaluation.yml` (writes a placeholder report)

---

## 16. What NOT to Do

| Anti-pattern                                               | Why it fails                                                        |
| ---------------------------------------------------------- | ------------------------------------------------------------------- |
| **Test only the final answer**                             | Unauthorized data may already have reached the LLM                  |
| **Use an LLM for security tests**                          | Non-deterministic, slower, and susceptible to prompt behavior       |
| **No stage trace**                                         | Failures cannot be localized                                        |
| **Treat 100 questions as scientifically sufficient**       | Dataset size alone does not establish coverage                      |
| **Test with an admin user only**                           | Permission-blocked behavior is never exercised                      |
| **Hard-code exact expected answers**                       | Small wording changes create brittle failures                       |
| **Make the harness part of runtime security**              | The harness verifies security; it does not enforce authorization    |
| **Combine security and quality gates without distinction** | Security violations and quality regressions have different meanings |
| **Skip permission revocation tests**                       | Stale permission projections can create real leakage                |
| **Report only aggregate metrics**                          | Category-specific failures become invisible                         |

---

## 17. Architecture

```text
┌─────────────────────────────────────────────────────┐
│                 Golden Dataset                      │
└────────────────────┬────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────┐
│              Evaluation Runner                      │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │         APPLICATION PIPELINE                  │  │
│  │                                               │  │
│  │  Query → Auth → ACL → Rewrite                 │  │
│  │      → Vector (ACL) ─┐                        │  │
│  │      → BM25 (ACL) ───┼─ RRF → Rerank          │  │
│  │                      │       ↓                │  │
│  │                      │   Evidence Check       │  │
│  │                      │    ↓         ↓         │  │
│  │                      │  Refuse      LLM       │  │
│  │                      │              ↓         │  │
│  │                      │       Citation Check   │  │
│  └──────────────────────┴───────────────────────┘  │
│                     ↓                              │
│              Metrics Engine                        │
│                     ↓                              │
│              Report + CI Gate                      │
└─────────────────────────────────────────────────────┘
```

The evaluation harness surrounds the application pipeline. It captures stage metadata and evaluates the resulting behavior, but it does not participate in the application's runtime authorization decisions.

---

## 18. Implementation Checklist

### Dataset

- [ ] Create the golden evaluation dataset.
- [ ] Assign a stable ID to every test case.
- [ ] Record the test user and authorization context.
- [ ] Record expected action.
- [ ] Record expected authorized relevant chunks.
- [ ] Record known unauthorized relevant chunks where applicable.
- [ ] Assign categories.
- [ ] Include answerable, permission-blocked, out-of-scope, adversarial, multi-source, conflict, and stale cases.

### Stage instrumentation

- [ ] Capture query rewrites.
- [ ] Capture vector candidates.
- [ ] Capture BM25 candidates.
- [ ] Capture RRF candidates.
- [ ] Capture reranked candidates.
- [ ] Capture evidence chunks.
- [ ] Capture final LLM context.
- [ ] Capture answer action.
- [ ] Capture citations.

### Security

- [ ] Verify ACL invariant at vector retrieval.
- [ ] Verify ACL invariant at BM25 retrieval.
- [ ] Verify ACL invariant after RRF.
- [ ] Verify ACL invariant before reranking.
- [ ] Verify ACL invariant before LLM generation.
- [ ] Add permission-revocation regression tests.
- [ ] Enforce zero permission leakage in CI.

### Quality

- [ ] Measure Recall@20.
- [ ] Measure Recall@5.
- [ ] Measure MRR.
- [ ] Measure NDCG@5.
- [ ] Measure refusal accuracy.
- [ ] Measure over-refusal.
- [ ] Measure faithfulness.
- [ ] Validate citations.
- [ ] Report metrics by category.
- [ ] Establish baselines before treating thresholds as universal targets.

### CI

- [ ] Run evaluation on pull requests.
- [ ] Run evaluation on pushes to main.
- [ ] Fail security gates automatically.
- [ ] Produce machine-readable metrics.
- [ ] Upload evaluation reports as CI artifacts.
- [ ] Track baseline changes over time.

---

## 19. Suggested Implementation Order

Build the harness in stages rather than trying to implement every metric at once.

### Phase 1 — Security foundation

1. Create a small golden dataset.
2. Add test users with different authorization contexts.
3. Capture retrieval-stage metadata.
4. Implement ACL invariant assertions.
5. Make zero leakage a CI gate.

### Phase 2 — Retrieval evaluation

1. Add expected relevant chunks.
2. Implement Recall@20.
3. Implement Recall@5.
4. Add MRR and NDCG@5.
5. Compare candidate generation against reranking.

### Phase 3 — Refusal evaluation

1. Add permission-blocked cases.
2. Add insufficient-evidence cases.
3. Measure refusal accuracy.
4. Measure over-refusal.
5. Test calibrated refusal categories.

### Phase 4 — Answer evaluation

1. Validate citations.
2. Add claim-support checks.
3. Add semantic faithfulness evaluation.
4. Add answer relevance evaluation.
5. Track LLM-judge results separately from deterministic security results.

### Phase 5 — Experimentation

1. Establish a baseline.
2. Run the five ablation configurations.
3. Compare metrics.
4. Identify regressions.
5. Document findings for the final capstone report.

---

## 20. Capstone Demonstration

A strong demonstration should show the harness catching an actual regression.

### Demo scenario

1. Run the baseline evaluation.
2. Show:
   - zero permission leakage,
   - retrieval metrics,
   - refusal metrics,
   - answer-quality metrics.
3. Introduce a deliberate ACL bug, such as removing the ACL filter from one retrieval path.
4. Run the evaluation again.
5. Show the unauthorized chunk appearing in the stage trace.
6. Show the security gate failing.
7. Show the GitHub Actions job marked as failed.
8. Restore the ACL filter.
9. Run the suite again.
10. Show the security gate passing.

This demonstrates that the evaluation harness is actively protecting the project against regressions rather than simply producing a report.

---

## 21. Sponsor Requirement (summary)

Sponsor: *"Build a question set with known answers, including questions that should be refused and blocked by permissions, and run it as a regression suite."* See §1 for the full quote. Implementation: golden dataset through the full pipeline with stage-trace capture (rewrites → vector/BM25 → RRF → rerank → evidence → LLM context), evaluating leakage, refusal, retrieval, and answer quality with leakage as a hard CI invariant.

---

## 22. References

See [`PERMISSION_AWARE_RETRIEVAL.md`](../security/PERMISSION_AWARE_RETRIEVAL.md) §36 for canonical references (Azure AI Search, NIST ABAC, OWASP). Evaluation-specific additions: RAGAS; BEIR; LangSmith tracing; Cormack et al. (2009) RRF.
