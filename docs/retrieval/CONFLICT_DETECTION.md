# Conflict Detection — Permission-Aware Knowledge Agent

**Project:** SER 401 – Project 14: Permission-Aware Knowledge Agent

**Date:** September 16, 2026

**Purpose:** Implementation guide for Conflict Detection — the feature that notices when two authorized sources disagree and surfaces the disagreement instead of silently picking a winner.

> **Implementation status:** This is a target design. The current backend has
> no document ingestion, retrieval pipeline, freshness evaluator, or conflict
> detector; the examples and requirements below describe planned behavior.

---

## 1. Feature Definition

> **Conflict Detection:** Notice when two sources disagree, and say so — instead of silently picking one, blending them, or fabricating a middle ground.

Our sponsor stated:

> "Flag staleness and conflict. Notice when two sources disagree, or when the only source is two years old, and say so."

Conflict Detection answers the question:

**"Do the sources agree?"**

The purpose of this feature is not to decide which source is correct. Its purpose is to detect and surface disagreement among the evidence the system is already authorized to use.

---

## 2. Why This Is Medium Difficulty

Conflict Detection is easier than the five hard features because:

1. It can reuse the planned chunk, metadata, retrieval, reranking, and freshness infrastructure once those components exist.
2. It should run only on evidence authorized by the future retrieval boundary; that boundary is not implemented yet.
3. It is a post-retrieval analysis step — it runs after reranking like freshness.
4. Freshness feeds directly into it — `updated_at` informs possible supersession.

But it is not trivial. It requires:

- Semantic comparison between chunks
- Structured claim extraction
- A policy for "what counts as a conflict"
- Careful handling of false positives such as paraphrases, summaries, and scope differences
- A clear UX for surfacing conflicts without confusing the user

---

## 3. The Core Principle

> **Conflict is surfaced, not resolved. The system reports disagreement; it does not adjudicate.**

The LLM should never silently pick one source over another. The user must see the conflict and decide.

A second principle is equally important:

> **A newer timestamp alone does not prove that one document supersedes another.**

Dates do not establish authority. A 2026 draft presentation does not supersede a 2024 official policy. Supersession requires evidence — explicit replacement language, authority metadata, or documented status.

Therefore:

**Freshness and authority are evidence used to interpret a disagreement, not automatic verdicts.**

---

## 4. Conflict Classification

Not all disagreements are conflicts. The system classifies each detected disagreement into one of four states.

| Situation                                               | Classification                       |
| ------------------------------------------------------- | ------------------------------------ |
| "20 days" vs "25 days" for the same population and time | `CONFLICT`                           |
| 2024 policy explicitly replaced by 2026 policy          | `CONFLICT` + `POSSIBLE_SUPERSESSION` |
| US employees get 20 days; EU employees get 25 days      | `SCOPE_DIFFERENCE`                   |
| Same process described with different wording           | `NO_CONFLICT`                        |

The four output states are:

- `NO_CONFLICT`
- `CONFLICT`
- `POSSIBLE_SUPERSESSION`
- `SCOPE_DIFFERENCE`

**Important:** Supersession is expressed as `POSSIBLE_SUPERSESSION`, not as a definitive classification. It requires additional evidence beyond a newer timestamp.

---

## 5. Pipeline Placement

Conflict Detection runs after freshness evaluation and before evidence sufficiency.

```text
Reranker
    ↓
Freshness Evaluation
    ↓
Conflict Detection        ← detects disagreement among retrieved chunks
    ↓
Evidence Sufficiency      ← conflict becomes an input
    ↓
  ┌─┴─┐
Refuse  Generate
          ↓
   Citation Check
          ↓
   Response Formatter     ← attaches conflict metadata
          ↓
   Frontend displays conflict
```

### Why after reranking and freshness?

You do not want to compare every chunk in the entire database.

The system should compare the small set of authorized, relevant evidence it is actually considering:

1. Authorization ensures only permitted data enters the pipeline.
2. Retrieval finds relevant material.
3. Reranking reduces the candidate set.
4. Freshness supplies temporal metadata.
5. Conflict Detection analyzes disagreement among those candidates.
6. Evidence Sufficiency decides whether the disagreement still permits an answer or requires refusal.

---

## 6. Interaction With Freshness

Freshness provides evidence for possible supersession, but it does not establish supersession on its own.

| Scenario                                                                      | Freshness / Authority Signal     | Conflict Classification                           |
| ----------------------------------------------------------------------------- | -------------------------------- | ------------------------------------------------- |
| Doc A (2026, official) vs Doc B (2024, official) contradict                   | Both have authority; A is newer  | `CONFLICT` + `POSSIBLE_SUPERSESSION` (unresolved) |
| Doc A (2026, draft) vs Doc B (2024, official) contradict                      | A is newer but not authoritative | `CONFLICT` (draft does not supersede)             |
| Doc A (2026, official, says "replaces 2024 policy") vs Doc B (2024, official) | Explicit replacement             | `CONFLICT` + `POSSIBLE_SUPERSESSION` (supported)  |
| Doc A (2026) vs Doc B (2026) contradict                                       | Both fresh                       | `CONFLICT` (no supersession possible)             |

Freshness and authority metadata are **evidence, not verdicts**.

---

## 7. Source Authority Model

To avoid treating all sources as equally authoritative, each chunk should carry authority metadata.

```json
{
  "source": "google_drive",
  "source_type": "hr_policy",
  "authority": "official",
  "document_status": "active",
  "supersedes_document_id": null,
  "updated_at": "2026-08-01"
}
```

Example of a less authoritative source:

```json
{
  "source": "discord",
  "source_type": "meeting_notes",
  "authority": "informational",
  "document_status": "draft",
  "supersedes_document_id": null,
  "updated_at": "2026-09-01"
}
```

### Authority levels (canonical — see `DATABASE_MODEL.md` Section 3.1)

| Level           | Meaning                                        |
| --------------- | ---------------------------------------------- |
| `official`      | Company-approved policy, contract, or handbook |
| `authoritative` | Internal reference maintained by an owning team |
| `informational` | Meeting notes, drafts, presentations           |
| `unknown`       | Authority not established                      |

### Document status (canonical)

- `active`
- `draft`
- `superseded`
- `archived`

This metadata lets the system distinguish:

> "This source is newer but informational"

from:

> "This source is newer, official, and explicitly replaces the previous one."

---

## 8. Four-Stage Detection Strategy

Conflict detection is a pipeline, not a single algorithm.

### Stage 1 — Candidate Generation

Group chunks by topic similarity and metadata alignment:

- Same subject, e.g. "vacation allowance"
- Same scope, e.g. "US employees"
- Same document type, e.g. HR policy
- Same temporal context, e.g. current policies

Only pairs within the same group are compared.

Embeddings can be used here to identify semantically related candidates.

### Stage 2 — Claim Extraction

Extract structured claims from each chunk.

Example:

```text
Document A: "Employees receive 20 vacation days."
    ↓
{
  "subject": "employee vacation allowance",
  "value": 20,
  "unit": "days",
  "scope": "employees",
  "temporal_context": "current"
}
```

Document B:

```text
Document B: "Employees receive 25 vacation days."
    ↓
{
  "subject": "employee vacation allowance",
  "value": 25,
  "unit": "days",
  "scope": "employees",
  "temporal_context": "current"
}
```

### Stage 3 — Comparison

For each pair:

- Same subject?
- Same scope?
- Same temporal context?
- Different value?

### Stage 4 — Classification

| Comparison Result                                                                               | Classification                                   |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| Same subject + same scope + same value                                                          | `NO_CONFLICT`                                    |
| Same subject + same scope + different value                                                     | `CONFLICT`                                       |
| Same subject + different scope                                                                  | `SCOPE_DIFFERENCE`                               |
| Same subject + same scope + different value + newer authoritative source + explicit replacement | `CONFLICT` + `POSSIBLE_SUPERSESSION` (supported) |
| Same subject + same scope + different value + newer non-authoritative source                    | `CONFLICT` (draft does not supersede)            |

---

## 9. Why Embeddings Are Candidate Generation, Not Conflict Detection

An embedding answers:

> "Are these pieces of text semantically related?"

It does not answer:

> "Do these claims contradict each other?"

Consider:

- A: "Employees receive 20 vacation days."
- B: "Employees receive 25 vacation days."

These sentences have very high semantic similarity because they discuss the same subject.

That similarity does **not** mean agreement.

Therefore:

> **Similarity ≠ Agreement.**

Embeddings are used in Stage 1 to find pairs worth comparing. Actual contradiction detection happens through structured comparison and, where necessary, an LLM-as-judge.

---

## 10. Numeric Conflict Detection

Many conflicts are numeric and can be detected deterministically without an LLM.

| Claim A    | Claim B       | Classification |
| ---------- | ------------- | -------------- |
| 20 days    | 25 days       | `CONFLICT`     |
| $10,000    | $15,000       | `CONFLICT`     |
| 2026-01-01 | 2026-02-01    | `CONFLICT`     |
| 5%         | 7%            | `CONFLICT`     |
| 20 days    | "twenty days" | `NO_CONFLICT`  |
| 20 days    | 20 days       | `NO_CONFLICT`  |

A structured claim comparison provides a deterministic baseline:

```python
def compare_structured_claims(a, b):
    if a.subject != b.subject:
        return "NO_CONFLICT"
    if a.scope != b.scope:
        return "SCOPE_DIFFERENCE"
    if a.value == b.value:
        return "NO_CONFLICT"
    return "CONFLICT"
```

This gives the team a deterministic baseline.

The LLM-as-judge should be reserved for cases requiring natural-language reasoning, such as differing process descriptions.

---

## 11. Response Model

The LLM generates the explanation. The application attaches the conflict metadata.

### What the LLM Produces

```json
{
  "answer": "I found conflicting information about the vacation policy.",
  "citations": ["hr-policy-2024", "hr-policy-2026"]
}
```

### What the Application Produces

```json
{
  "answer": "I found conflicting information about the vacation policy.",
  "citations": [
    {
      "chunk_id": "hr-policy-2024",
      "updated_at": "2024-02-10",
      "authority": "official",
      "status": "active"
    },
    {
      "chunk_id": "hr-policy-2026",
      "updated_at": "2026-08-01",
      "authority": "official",
      "status": "active"
    }
  ],
  "conflicts": [
    {
      "type": "CONFLICT",
      "claim_a": "20 vacation days",
      "claim_b": "25 vacation days",
      "sources": ["hr-policy-2024", "hr-policy-2026"],
      "supersession_status": "unresolved",
      "reason": "Both sources have official authority and active status."
    }
  ]
}
```

### What the Frontend Renders

> **Conflicting information found.**
>
> Source A (2024, official): 20 vacation days [1]  
> Source B (2026, official): 25 vacation days [2]
>
> ⚠️ Both sources have official authority. Verify which policy is currently in force.

The important UX principle is that the conflict is visible rather than hidden inside the generated answer.

---

## 12. Why the LLM Must Not Resolve Conflicts

If the LLM is asked to "pick the right answer," it may:

- Hallucinate a reason to prefer one source
- Blend the two into an answer true in neither source
- Ignore freshness and authority metadata
- Hide the conflict from the user

### Division of Responsibility

| Application determines       | LLM determines                         |
| ---------------------------- | -------------------------------------- |
| Which sources were retrieved | How to explain the authorized evidence |
| Which sources are authorized | —                                      |
| Freshness metadata           | —                                      |
| Detected conflict and type   | —                                      |
| Source authority metadata    | —                                      |

The LLM should receive the conflict metadata and be explicitly instructed not to reconcile the claims.

Example instruction:

```text
Two retrieved sources have been identified as potentially conflicting.

Source A: 20 vacation days (2024, official).
Source B: 25 vacation days (2026, official).

Do not reconcile these claims.
Do not invent a reason for the difference.
Report the disagreement clearly.
```

The final formatter still attaches machine-generated conflict metadata so the warning cannot be lost during generation.

---

## 13. Security Invariant

Conflict Detection must never see unauthorized data.

This is a hard invariant:

```text
ConflictInput(u, q) ⊆ Authorized(u)
```

### Correct Flow

```text
All indexed data
    ↓
ACL filter
    ↓
Authorized only
    ↓
Retrieval
    ↓
Reranking
    ↓
Conflict Detection
```

### Incorrect Flow — Must Never Be Implemented

```text
All indexed data
    ↓
Retrieve everything
    ↓
Compare for conflicts
    ↓
Filter unauthorized
```

The incorrect flow creates a new information-leak path. Unauthorized data would have entered the application through logs, traces, memory, or intermediate processing before being filtered.

---

## 14. Conflict Does Not Modify Retrieval Ranking

Conflict Detection is an analysis layer, not a ranking signal.

Do **not** implement:

```python
final_score = relevance + freshness + authority - conflict
```

Instead:

```text
Retrieval → Reranking → Evidence set → Conflict analysis
```

The result is metadata:

```json
{
  "conflict_detected": true,
  "conflicts": []
}
```

Keeping conflict separate from ranking makes the feature easier to evaluate.

Conflict-aware ranking can be considered later as an ablation study rather than being part of the initial implementation.

---

## 15. Interaction With Calibrated Refusal

Conflict Detection becomes an input to Evidence Sufficiency.

### Example 1 — Answer With Conflict Warning

```text
Query: "What is our vacation policy?"

Retrieved:
  2024 → 20 days
  2026 → 25 days

Conflict detected.
```

Result:

```json
{
  "action": "answer_with_conflict",
  "conflicts": [...]
}
```

### Example 2 — Refuse Due to Conflicting Authority

```text
Query: "What is our vacation policy?"

Retrieved:
  2024 → 20 days (official, active)
  2026 → 25 days (draft)

Conflict detected; authority unresolved.
```

Result:

```json
{
  "action": "refuse",
  "reason": "conflicting_authority"
}
```

The combined pipeline is:

```text
Authorization
    ↓
Retrieval
    ↓
Freshness
    ↓
Conflict
    ↓
Evidence Sufficiency
    ↓
Generate / Refuse
```

---

## 16. UX Rule: Do Not Overwhelm Users

The system must distinguish paraphrase from contradiction.

### Not a conflict

- A: "Employees should submit vacation requests through the HR portal."
- B: "Vacation requests are submitted using the HR system."

### Is a conflict

- A: "Employees receive 20 vacation days."
- B: "Employees receive 25 vacation days."

The false-positive test suite is therefore critical.

The system should not flag:

- Paraphrases
- Summaries
- References to another document
- Scope differences

as direct contradictions.

---

## 17. Test Suites

### Suite A — Direct Contradiction

| Case                                   | Expected      |
| -------------------------------------- | ------------- |
| A: "20 days." B: "25 days." Same scope | `CONFLICT`    |
| A: "Policy is X." B: "Policy is X."    | `NO_CONFLICT` |
| A: "Policy is X." B: "Policy is Y."    | `CONFLICT`    |

### Suite B — Temporal Supersession

| Case                                                                   | Expected                                          |
| ---------------------------------------------------------------------- | ------------------------------------------------- |
| Old policy (2024), new policy (2026), different content, both official | `CONFLICT` + `POSSIBLE_SUPERSESSION` (unresolved) |
| Old official policy, new draft, different content                      | `CONFLICT` (draft does not supersede)             |
| Old policy, new policy with explicit replacement language              | `CONFLICT` + `POSSIBLE_SUPERSESSION` (supported)  |
| Old doc, new doc, same content                                         | `NO_CONFLICT` (republished)                       |

### Suite C — Scope Difference

| Case                                                            | Expected           |
| --------------------------------------------------------------- | ------------------ |
| A: "US employees get 20 days." B: "EU employees get 25 days."   | `SCOPE_DIFFERENCE` |
| A: "All employees get 20 days." B: "All employees get 25 days." | `CONFLICT`         |

### Suite D — False Positives

| Case                                            | Expected      |
| ----------------------------------------------- | ------------- |
| Two docs use different words for the same thing | `NO_CONFLICT` |
| One doc is a summary of the other               | `NO_CONFLICT` |
| One doc references the other                    | `NO_CONFLICT` |

### Suite E — Conflict + Freshness Integration

| Case                                               | Expected                                          |
| -------------------------------------------------- | ------------------------------------------------- |
| Fresh official doc + stale official doc contradict | `CONFLICT` + `POSSIBLE_SUPERSESSION` (unresolved) |
| Two fresh official docs contradict                 | `CONFLICT`                                        |
| Fresh doc + fresh doc, same content                | `NO_CONFLICT`                                     |

### Suite F — Numeric / Structured Conflicts

| Case                     | Expected      |
| ------------------------ | ------------- |
| 20 days vs 25 days       | `CONFLICT`    |
| $10,000 vs $15,000       | `CONFLICT`    |
| 2026-01-01 vs 2026-02-01 | `CONFLICT`    |
| 5% vs 7%                 | `CONFLICT`    |
| 20 days vs "twenty days" | `NO_CONFLICT` |
| 20 days vs 20 days       | `NO_CONFLICT` |

### Example Test Code

```python
def test_supersession_requires_authority():
    a = make_chunk(
        content="Employees receive 20 vacation days.",
        updated_at="2024-02-10",
        authority="official",
        status="active"
    )
    b = make_chunk(
        content="Employees receive 25 vacation days.",
        updated_at="2026-08-01",
        authority="informational",
        status="draft"
    )

    result = detect_conflicts(
        [a, b],
        query="What is the vacation policy?"
    )

    assert result[0]["type"] == "CONFLICT"
    assert result[0]["supersession_status"] == "unresolved"
    assert "draft does not supersede" in result[0]["reason"]


def test_numeric_conflict_deterministic():
    a = extract_claim("Employees receive 20 vacation days.")
    b = extract_claim("Employees receive 25 vacation days.")

    assert compare_structured_claims(a, b) == "CONFLICT"


def test_paraphrase_not_conflict():
    a = make_chunk(
        "Employees should submit vacation requests through the HR portal."
    )
    b = make_chunk(
        "Vacation requests are submitted using the HR system."
    )

    result = detect_conflicts(
        [a, b],
        query="How do I request vacation?"
    )

    assert len(result) == 0
```

---

## 18. Metrics

Targets below are initial research baselines to be validated against `data/evaluation/golden_dataset.json` — see `EVALUATION_HARNESS.md` Section 9 for canonical gate semantics. They are quality targets, not security invariants.

| Metric                                   | Type          | Target                 |
| ---------------------------------------- | ------------- | ---------------------- |
| **Conflict Precision**                   | Empirical     | ≥ 90%                  |
| **Conflict Recall**                      | Empirical     | ≥ 80%                  |
| **False Conflict Rate**                  | Empirical     | ≤ 10%                  |
| **Supersession Classification Accuracy** | Empirical     | ≥ 90% on labeled cases |
| **Conflict Surfacing Coverage**          | Deterministic | 100%                   |

These are quality targets to be evaluated against the project dataset.

They are not security invariants.

The security invariant remains:

> **Unauthorized data exposure = 0.**

---

## 19. What NOT to Do

| Anti-Pattern                                | Why It Fails                                                               |
| ------------------------------------------- | -------------------------------------------------------------------------- |
| Treat newer timestamp as supersession       | A newer draft does not replace an older official policy                    |
| Ask the LLM to resolve the conflict         | It may hallucinate a resolution or hide the disagreement                   |
| Silently blend contradictory claims         | Produces an answer true in neither source                                  |
| Treat all disagreements as conflicts        | Scope differences and summaries are not conflicts                          |
| Detect conflicts after generation           | The answer may already have blended the claims                             |
| Use only embedding similarity               | High similarity can hide contradiction                                     |
| Run conflict detection on unauthorized data | Creates a new information-leak path                                        |
| Combine conflict into retrieval ranking     | Conflict is analysis, not a scoring signal                                 |
| Report conflicts without context            | The user needs both claims, both sources, timestamps, and authority levels |

---

## 20. Sponsor Requirement (summary)

Sponsor: *"Notice when two sources disagree, and say so."* See §1 for the full quote. Implementation: post-retrieval analysis classifying `NO_CONFLICT` / `CONFLICT` / `POSSIBLE_SUPERSESSION` / `SCOPE_DIFFERENCE`; numeric conflicts deterministic, NL conflicts via LLM-as-judge only where structured comparison is insufficient. Never resolves disagreements or exposes unauthorized evidence.

---

## 22. Systems Mental Model

| Layer              | Question It Answers                         |
| ------------------ | ------------------------------------------- |
| Authorization      | Can the user see this?                      |
| Retrieval          | Is this relevant?                           |
| Freshness          | How current is it?                          |
| Conflict           | Do the sources disagree?                    |
| Evidence           | Is there enough reliable evidence?          |
| LLM                | How should the evidence be explained?       |
| Verification       | Did the answer stay grounded?               |
| Evaluation Harness | Did the system satisfy all these contracts? |

### Full Pipeline

```text
┌──────────────────┐
│  Authorization   │
└────────┬─────────┘
         ↓
┌──────────────────┐
│   Retrieval      │
└────────┬─────────┘
         ↓
┌──────────────────┐
│   Freshness      │
└────────┬─────────┘
         ↓
┌──────────────────┐
│   Conflict       │
└────────┬─────────┘
         ↓
┌──────────────────┐
│   Evidence       │
└────────┬─────────┘
         ↓
┌──────────────────┐
│      LLM         │
└────────┬─────────┘
         ↓
┌──────────────────┐
│  Verification    │
└──────────────────┘
```

The Evaluation Harness continuously verifies every layer.

---

## 23. Recommended Implementation Order

1. Ensure all retrieved chunks contain authority and document-status metadata.
2. Implement deterministic structured claim extraction for numeric claims.
3. Implement deterministic structured claim comparison.
4. Add candidate grouping using topic similarity and metadata.
5. Add false-positive handling for paraphrases, summaries, and references.
6. Add freshness/authority interpretation for `POSSIBLE_SUPERSESSION`.
7. Add LLM-as-judge only for cases that structured comparison cannot classify.
8. Keep conflict detection after authorization, retrieval, reranking, and freshness.
9. Pass conflict metadata into Evidence Sufficiency.
10. Attach machine-generated conflict metadata in the response formatter.
11. Build Suites A–F.
12. Measure precision, recall, false conflict rate, supersession accuracy, and surfacing coverage.
13. Integrate the tests into the Evaluation Harness regression suite.

This order gives the team a deterministic baseline before adding LLM-based reasoning.

---

## 24. Repository Locations

See [`REPOSITORY_STRUCTURE.md`](../architecture/REPOSITORY_STRUCTURE.md) for the canonical layout. Key locations for this feature:

- `app/services/conflict/` — `detector.py`, `claim_extractor.py`, `classifier.py`
- `app/services/rag/nodes/conflict.py` — LangGraph node
- `app/schemas/conflict.py` — API shapes
- `tests/unit/test_conflict_detector.py` — deterministic tests

---

## 25. Definition of Done

Conflict Detection is complete when:

- [ ] Only authorized chunks reach Conflict Detection.
- [ ] Conflict Detection runs after reranking and freshness evaluation.
- [ ] Candidate generation uses semantic similarity and metadata.
- [ ] Structured claims can be extracted from relevant chunks.
- [ ] Numeric contradictions are detected deterministically.
- [ ] Same-scope different-value claims can be classified as `CONFLICT`.
- [ ] Different-scope claims can be classified as `SCOPE_DIFFERENCE`.
- [ ] Paraphrases and summaries are not incorrectly classified as conflicts.
- [ ] Supersession is never inferred from timestamp alone.
- [ ] Authority and document status are used as evidence for possible supersession.
- [ ] The LLM is not responsible for choosing a winning source.
- [ ] Conflict metadata is attached by the application.
- [ ] Conflict metadata reaches the frontend.
- [ ] Evidence Sufficiency receives conflict information.
- [ ] Suites A–F pass.
- [ ] Conflict Surfacing Coverage reaches 100%.
- [ ] Unauthorized data exposure remains 0%.
- [ ] The feature is included in the Evaluation Harness regression suite.

---

## 26. Capstone Demo Contribution

See [`BUILD_PLAN.md`](../planning/BUILD_PLAN.md) Phase 8 for the canonical demo. This feature contributes the conflict notice: 2024 official (20 days) vs 2026 official (25 days) shows `CONFLICT` + unresolved `POSSIBLE_SUPERSESSION`, with both claims, sources, timestamps, and authority surfaced — proving the system reports disagreement instead of silently picking a winner.

---

## 27. References

See [`PERMISSION_AWARE_RETRIEVAL.md`](../security/PERMISSION_AWARE_RETRIEVAL.md) §36 for canonical references (Azure AI Search, NIST ABAC, OWASP, LangChain). Conflict-specific additions: RAGAS evaluation framework; Cormack et al. (2009) Reciprocal Rank Fusion.
