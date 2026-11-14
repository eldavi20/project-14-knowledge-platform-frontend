# Freshness and Staleness Detection — Permission-Aware Knowledge Agent

**Project:** SER 401 – Project 14: Permission-Aware Knowledge Agent

**Date:** September 16, 2026

**Purpose:** Implementation guide for freshness and staleness detection, one of the reliability features critical to a trustworthy system.

> **Implementation status:** This is a target design. The current backend has
> no document metadata, ingestion, retrieval, or freshness evaluator; this
> guide describes planned behavior.

---

## 1. Feature Definition

> **Freshness and Staleness Detection:** Notice when the only source supporting an answer is old, and say so. An index that silently serves last year's answer is worse than a search box.

The sponsor stated:

> "Documents change, people leave, policies get superseded. An index that silently serves last year's answer is worse than a search box."

The system must not only retrieve evidence. It must also determine whether the retrieved evidence is current enough for the question being asked and surface that information to the user.

---

## 2. Why This Is Hard

Freshness cannot be reduced to a simple date check.

The research identifies several complications:

1. **Freshness is not binary.** A document is not simply fresh or stale. Its status depends on content type, source, and policy.
2. **Different content has different shelf lives.** A company holiday schedule may become stale after a year, while a legal contract may remain valid for a decade.
3. **Staleness must be surfaced.** The user should know when an answer may be outdated.
4. **Freshness must not distort retrieval.** An old document may be exactly the right evidence for a historical question.
5. **Freshness interacts with refusal.** Critically stale evidence may require refusal for current-state questions, but not for historical questions.
6. **Old does not mean invalid, and recent does not mean authoritative.** Age alone cannot establish whether a source remains valid.

### Core principle

> **Freshness is metadata, not a filter. It informs the answer, not just the retrieval.**

---

## 3. Three Concepts That Must Stay Separate

The system should track three distinct concepts.

| Concept                | Metadata           | Question answered                              |
| ---------------------- | ------------------ | ---------------------------------------------- |
| **Document Freshness** | `updated_at`       | When did the source content last change?       |
| **Index Freshness**    | `source_synced_at` | When did our system last pull from the source? |
| **Source Sync Health** | Both combined      | Is our indexed copy current with the source?   |

### Example

A document can be updated yesterday while the index was last synchronized 30 days ago:

```json
{
  "document_age_days": 1,
  "document_freshness": "fresh",
  "sync_age_days": 30,
  "index_sync_status": "stale"
}
```

The document itself is fresh, but the indexed copy may not contain the latest version.

This distinction is important because a fresh source with a stale index can hide changes that occurred after the last synchronization.

---

## 4. Timestamp Semantics

The research identifies three timestamp meanings:

```text
created_at
    ↓
Historical metadata

updated_at
    ↓
Document freshness

source_synced_at
    ↓
Index freshness
```

### Why `created_at` must not determine freshness

Consider a document created in 2018 and updated last week.

Its creation date is historical information. It does not mean that the content is eight years old.

Therefore:

- `created_at` → historical metadata
- `updated_at` → document freshness
- `source_synced_at` → index freshness

---

## 5. Correct Architectural Placement

Freshness evaluation runs **after reranking and before evidence sufficiency**.

It evaluates retrieved evidence; it does not filter retrieval.

```text
Reranker
    ↓
Freshness Evaluation   ← evaluate, don't filter
    ↓
Evidence Sufficiency   ← freshness is one input
    ↓
  ┌─┴─┐
Refuse  Generate
          ↓
   Citation Check
          ↓
   Response Formatter  ← attaches warning
          ↓
   Frontend displays warning
```

### Why freshness must not filter retrieval

Suppose the user asks:

> "What was our 2020 vacation policy?"

A 2020 document may be exactly the correct evidence.

Filtering old documents before retrieval would incorrectly remove relevant historical evidence.

The correct sequence is:

```text
Retrieve relevant evidence
        ↓
Evaluate its age
        ↓
Determine how age affects the answer
```

Not:

```text
Filter by freshness
        ↓
Retrieve
```

---

## 6. Per-Content-Type Freshness Policy

Different content types have different expected lifetimes.

The research proposes soft and hard thresholds:

| Content Type          | Soft Threshold | Hard Threshold | Behavior                    |
| --------------------- | -------------: | -------------: | --------------------------- |
| HR policies           |       180 days |       540 days | Standard                    |
| Engineering docs      |       365 days |      1095 days | Standard                    |
| Financial reports     |        90 days |       365 days | Standard                    |
| Company announcements |        30 days |       180 days | Standard                    |
| Technical RFCs        |       730 days |      1825 days | Standard                    |
| Legal contracts       |           none |           none | Do not auto-classify by age |

### Legal contract exception

Legal contracts are explicitly excluded from automatic age-based classification.

The reason is:

> **Old ≠ invalid, and recent ≠ authoritative.**

A five-year-old contract can still be in force, while a recently updated contract may have been superseded by another agreement.

Determining whether a contract is active belongs to supersession/conflict detection rather than simple freshness classification.

---

## 7. Freshness Node Output

The freshness node should produce structured output rather than a single freshness label.

Example:

```json
{
  "document_freshness": {
    "tier": "aging",
    "age_days": 420
  },
  "index_freshness": {
    "sync_age_days": 2,
    "status": "current"
  },
  "policy": {
    "content_type": "hr_policy",
    "soft_days": 180,
    "hard_days": 540
  }
}
```

This provides the evaluation harness with independent signals for:

- document age,
- index synchronization age,
- freshness tier,
- content type,
- configured policy.

---

## 8. Example Implementation

A simple deterministic implementation can use content-type-specific policies:

```python
from datetime import datetime, timezone

FRESHNESS_POLICY = {
    "hr_policy": {"soft": 180, "hard": 540},
    "engineering_doc": {"soft": 365, "hard": 1095},
    "financial_report": {"soft": 90, "hard": 365},
    "announcement": {"soft": 30, "hard": 180},
    "technical_rfc": {"soft": 730, "hard": 1825},
    "legal_contract": {"soft": None, "hard": None},
    "default": {"soft": 365, "hard": 730},
}


def evaluate_freshness(chunk, reference_date=None):
    # Timezone-aware: naive datetime.utcnow() is deprecated (see DATABASE_QUERIES.md §6)
    reference_date = reference_date or datetime.now(timezone.utc)

    content_type = chunk.metadata.get(
        "content_type",
        "default"
    )

    policy = FRESHNESS_POLICY.get(
        content_type,
        FRESHNESS_POLICY["default"]
    )

    updated_at = datetime.fromisoformat(
        chunk.metadata["updated_at"]
    )

    synced_at = datetime.fromisoformat(
        chunk.metadata["source_synced_at"]
    )

    # Validate timestamps
    if updated_at > reference_date:
        return {
            "error": "invalid_metadata",
            "reason": "future_timestamp"
        }

    age_days = (reference_date - updated_at).days
    sync_age_days = (reference_date - synced_at).days

    if policy["hard"] is None:
        tier = "not_auto_classified"
    elif age_days > policy["hard"]:
        tier = "stale"
    elif policy["soft"] and age_days > policy["soft"]:
        tier = "aging"
    else:
        tier = "fresh"

    return {
        "document_freshness": {
            "tier": tier,
            "age_days": age_days
        },
        "index_freshness": {
            "sync_age_days": sync_age_days,
            "status": (
                "stale"
                if sync_age_days > 7
                else "current"
            )
        },
        "policy": {
            "content_type": content_type,
            "soft_days": policy["soft"],
            "hard_days": policy["hard"]
        }
    }
```

The thresholds above are the research baseline and should be treated as project configuration rather than universal truth.

---

## 9. Response Architecture

The LLM should generate the answer from authorized evidence. The application should independently attach freshness metadata and warnings.

### LLM output

```json
{
  "answer": "Employees can request vacation through the HR portal.",
  "citations": ["hr-policy-3"]
}
```

### Application output

```json
{
  "answer": "Employees can request vacation through the HR portal.",
  "citations": [
    {
      "chunk_id": "hr-policy-3",
      "freshness": "aging",
      "age_days": 420
    }
  ],
  "warnings": [
    {
      "type": "stale_source",
      "message": "This information comes from a source updated 14 months ago."
    }
  ]
}
```

### Frontend rendering

> Employees can request vacation through the HR portal. [1]
>
> ⚠️ Source updated 14 months ago. Verify against the current policy.

### Why this separation matters

The application, rather than the LLM, owns the freshness warning.

This provides several benefits:

- The LLM does not decide whether a source is stale.
- The warning cannot be omitted or hallucinated by the model.
- The response can be tested deterministically.
- The frontend receives structured metadata instead of parsing warning text.

For example:

```python
assert "stale_source" in response["warnings"]
```

---

## 10. Query Temporal Intent

Whether stale evidence should trigger refusal depends on the temporal intent of the question.

| Query Type            | Example                                 | Stale-only behavior                                                        |
| --------------------- | --------------------------------------- | -------------------------------------------------------------------------- |
| **Current-state**     | "What is the vacation policy?"          | Refuse or provide a strong caveat if only stale evidence exists            |
| **Historical**        | "What was the 2020 vacation policy?"    | Answer using stale evidence because it is the relevant historical evidence |
| **Policy-comparison** | "How has the policy changed over time?" | Answer and surface the age of each cited source                            |

### Capstone scope

Sophisticated temporal-intent detection is outside the current capstone scope.

Document the limitation as:

> "The system currently uses a simple heuristic to classify query temporal intent. Sophisticated temporal reasoning is identified as future work."

---

## 11. Freshness and Evidence Sufficiency

Freshness is one input into evidence sufficiency.

The conceptual decision is:

```text
Authorized?
     ↓ yes
Relevant evidence?
     ↓ yes
Fresh enough for this question?
     ↓
Sufficient evidence?
   ┌───┴───┐
  No      Yes
  ↓        ↓
Refuse   Generate
```

However, "fresh enough" is contextual.

A stale source may still be sufficient for a historical question. Therefore, freshness must be evaluated together with temporal intent and evidence sufficiency rather than treated as a universal rejection rule.

---

## 12. What NOT to Do

| Anti-pattern                                                    | Why it fails                                                                  |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **Filter retrieval by freshness**                               | A 2020 document may be correct evidence for a historical question             |
| **Use `created_at` for freshness**                              | A document created years ago may have been updated recently                   |
| **Use one global threshold**                                    | Different content types have different shelf lives                            |
| **Use one freshness score for ranking**                         | Freshness should not override relevance                                       |
| **Ask the LLM to detect staleness**                             | Non-deterministic and can hallucinate freshness                               |
| **Inject freshness warnings into the LLM prompt**               | The model may rephrase or omit the warning                                    |
| **Combine relevance, freshness, and permission into one score** | Permission is an access-control constraint; freshness has different semantics |
| **Automatically classify legal contracts by age**               | Old does not mean invalid; recent does not mean authoritative                 |
| **Refuse whenever any chunk is stale**                          | This can cause unnecessary over-refusal                                       |
| **Ignore `source_synced_at`**                                   | A fresh source with a stale index can hide source changes                     |

---

## 13. Test Suites

### Suite A — Document Freshness

| Case                                 | Expected              |
| ------------------------------------ | --------------------- |
| Updated yesterday                    | `fresh`               |
| Updated 13 months ago — HR policy    | `aging`               |
| Updated 20 months ago — HR policy    | `stale`               |
| Updated 5 years ago — legal contract | `not_auto_classified` |

### Suite B — Answer Annotation

| Case                          | Expected                         |
| ----------------------------- | -------------------------------- |
| Aging citation                | Warning exists                   |
| Stale citation                | Warning exists                   |
| Fresh citation                | No warning                       |
| Mixed aging + fresh citations | Warning covers aging source only |

### Suite C — Stale-Only Evidence

| Case                                      | Expected                          |
| ----------------------------------------- | --------------------------------- |
| Only stale evidence + current question    | Refuse or provide a strong caveat |
| Only stale evidence + historical question | Answer                            |
| Aging evidence + fresh evidence           | Answer with aging warning         |

### Suite D — Index Synchronization

| Case                                                 | Expected                                                    |
| ---------------------------------------------------- | ----------------------------------------------------------- |
| Document updated yesterday, index synced yesterday   | `index_sync_status = current`                               |
| Document updated yesterday, index synced 30 days ago | `index_sync_status = stale`                                 |
| Document updated 2 years ago, index synced today     | `index_sync_status = current`, `document_freshness = stale` |

### Suite E — Invalid Metadata

| Case                            | Expected                                    |
| ------------------------------- | ------------------------------------------- |
| `updated_at` is a future date   | `invalid_metadata` warning                  |
| `updated_at > source_synced_at` | "Source changed after last sync" warning    |
| Missing `updated_at`            | Metadata error; fall back to default policy |

### Example tests

```python
def test_stale_source_produces_warning(client, employee_token):
    response = client.post(
        "/api/chat",
        json={"query": "What is the vacation policy?"},
        headers={"Authorization": f"Bearer {employee_token}"}
    )

    data = response.json()

    assert any(
        warning["type"] == "stale_source"
        for warning in data["warnings"]
    )

    assert data["citations"][0]["freshness"] in [
        "aging",
        "stale"
    ]


def test_index_sync_status(client):
    chunk = get_chunk("hr-policy-3")
    result = evaluate_freshness(chunk)

    assert "index_freshness" in result

    assert result["index_freshness"]["status"] in [
        "current",
        "stale"
    ]


def test_future_timestamp_rejected():
    chunk = make_chunk(updated_at=tomorrow())

    result = evaluate_freshness(chunk)

    assert result.get("error") == "invalid_metadata"
```

---

## 14. Metrics

Freshness evaluation distinguishes deterministic metadata metrics from
behavioral decision metrics. Targets below are initial research baselines to be
validated against the proposed `data/evaluation/golden_dataset.json` (not yet
checked in). The current security workflow runs a placeholder gate; the
blocking behavior described in `EVALUATION_HARNESS.md` Section 9 is the target,
not current enforcement.

### Deterministic Metrics

These evaluate whether the freshness rules and metadata processing work correctly.

| Metric                            | Research target |
| --------------------------------- | --------------: |
| Freshness Classification Accuracy |           ≥ 99% |
| Annotation Coverage               |            100% |
| Timestamp Validation              |            100% |
| Index Sync Detection              |            100% |

### Behavioral Metrics

These evaluate how the complete system behaves when freshness affects a response.

| Metric                  | Research target |
| ----------------------- | --------------: |
| Stale-Only Refusal Rate |           ≥ 90% |
| Appropriate Caveat Rate |           ≥ 95% |
| False Staleness Rate    |            ≤ 5% |

The research distinguishes these categories because deterministic rule checks and behavioral outcomes are different types of evaluation.

---

## 15. Systems Mental Model

Freshness is one layer in a larger chain of independent questions:

```text
┌──────────────────┐
│  Authorization   │  Can I see it?
└────────┬─────────┘
         ↓
┌──────────────────┐
│   Retrieval      │  Is it relevant?
└────────┬─────────┘
         ↓
┌──────────────────┐
│   Freshness      │  Is it current?
└────────┬─────────┘
         ↓
┌──────────────────┐
│   Conflict       │  Do sources agree?
└────────┬─────────┘
         ↓
┌──────────────────┐
│   Evidence       │  Is it enough?
└────────┬─────────┘
         ↓
┌──────────────────┐
│      LLM         │  Generate
└────────┬─────────┘
         ↓
┌──────────────────┐
│   Verification   │
└──────────────────┘
```

The evaluation harness continuously tests whether each layer behaves according to its contract.

### Architectural principle

> Authorization determines what evidence may enter the pipeline. Retrieval determines what evidence is relevant. Freshness determines how current that evidence is. Conflict detection determines whether sources agree. Evidence sufficiency determines whether an answer can responsibly be generated.

---

## 16. Integration With the Other Hard Features

Freshness should not be implemented as an isolated feature.

The complete relationship is:

```text
                 USER QUERY
                     │
                     ▼
              Authentication
                     │
                     ▼
            Permission Resolution
                     │
                     ▼
              ACL-Filtered Search
                     │
                     ▼
                 Reranking
                     │
                     ▼
          Freshness Evaluation
                     │
                     ▼
          Conflict Detection
                     │
                     ▼
          Evidence Sufficiency
                ┌────┴────┐
                │         │
             Refuse     Generate
                          │
                          ▼
                   Citation Check
                          │
                          ▼
                 Response Formatter
                          │
                          ▼
                      Frontend
```

The important separation is:

- **Authorization** answers: Can this user see the evidence?
- **Retrieval quality** answers: Is the evidence relevant?
- **Freshness** answers: How current is the evidence?
- **Conflict detection** answers: Do the available sources agree?
- **Evidence sufficiency** answers: Is there enough reliable evidence to answer?
- **Generation** produces the response.
- **Verification** checks the generated response.

---

## 17. Repository Locations

See [`REPOSITORY_STRUCTURE.md`](../architecture/REPOSITORY_STRUCTURE.md) for the canonical layout. Key locations for this feature:

- `app/services/freshness/` — `policy.py`, `evaluator.py`
- `app/services/rag/nodes/freshness.py` — LangGraph node
- `app/schemas/freshness.py` — API shapes
- `tests/unit/test_freshness_evaluator.py` — deterministic tests
- `data/evaluation/golden_dataset.json` — stale-only and temporal-intent cases

---

## 18. Implementation Checklist

### Metadata

- [ ] Store `created_at`.
- [ ] Store `updated_at`.
- [ ] Store `source_synced_at`.
- [ ] Store `content_type`.
- [ ] Validate timestamps.
- [ ] Detect future timestamps.
- [ ] Detect `updated_at > source_synced_at`.

### Freshness policy

- [ ] Define per-content-type soft thresholds.
- [ ] Define per-content-type hard thresholds.
- [ ] Add a default policy.
- [ ] Exclude legal contracts from automatic age classification.
- [ ] Keep policy thresholds configurable.

### Pipeline

- [ ] Evaluate freshness after reranking.
- [ ] Feed freshness into evidence sufficiency.
- [ ] Do not use freshness as a retrieval filter.
- [ ] Preserve historical evidence for historical questions.
- [ ] Keep freshness separate from authorization.

### Response

- [ ] Return freshness metadata with citations.
- [ ] Attach warnings in application code.
- [ ] Keep warning generation deterministic.
- [ ] Provide structured warning data to the frontend.
- [ ] Distinguish document staleness from index staleness.

### Testing

- [ ] Test fresh documents.
- [ ] Test aging documents.
- [ ] Test stale documents.
- [ ] Test legal-contract exception.
- [ ] Test stale-only current questions.
- [ ] Test stale-only historical questions.
- [ ] Test mixed fresh and aging evidence.
- [ ] Test index synchronization.
- [ ] Test invalid timestamps.
- [ ] Test warning coverage.

### Evaluation

- [ ] Measure deterministic freshness classification accuracy.
- [ ] Measure annotation coverage.
- [ ] Measure timestamp validation.
- [ ] Measure index sync detection.
- [ ] Measure stale-only refusal behavior.
- [ ] Measure appropriate caveat behavior.
- [ ] Measure false staleness.

---

## 19. Suggested Implementation Order

### Phase 1 — Metadata foundation

1. Add `created_at`, `updated_at`, and `source_synced_at`.
2. Add `content_type`.
3. Validate timestamp relationships.
4. Add structured metadata to chunks.

### Phase 2 — Freshness evaluator

1. Implement the policy configuration.
2. Implement `evaluate_freshness()`.
3. Add fresh/aging/stale classifications.
4. Add the legal-contract exception.
5. Add index synchronization status.

### Phase 3 — Pipeline integration

1. Run freshness evaluation after reranking.
2. Pass freshness metadata into evidence sufficiency.
3. Keep retrieval independent from freshness filtering.
4. Add current-vs-historical behavior.

### Phase 4 — Response integration

1. Add freshness metadata to citations.
2. Generate warnings in application code.
3. Return structured warnings.
4. Render warnings in the frontend.

### Phase 5 — Evaluation

1. Build freshness test cases.
2. Add stale-only cases.
3. Add temporal-intent cases.
4. Add synchronization cases.
5. Track deterministic and behavioral metrics.
6. Integrate freshness checks with the evaluation harness.

---

## 20. Capstone Demo Contribution

See [`BUILD_PLAN.md`](../planning/BUILD_PLAN.md) Phase 8 for the canonical demo. This feature contributes the freshness warning: current-state question shows aging/stale warning or stale-only refusal, while the same older evidence remains usable for a historical question — proving freshness is evaluated after retrieval, never as a retrieval filter.

---

## 21. Sponsor Requirement (summary)

Sponsor: *"An index that silently serves last year's answer is worse than a search box."* See §1 for the full quote. Implementation: three timestamps (`created_at`, `updated_at`, `source_synced_at`), per-content-type fresh/aging/stale policy, deterministic application-attached warnings. Legal contracts excluded from auto-classification.
