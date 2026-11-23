# Retrieval Quality — Permission-Aware Knowledge Agent

> **SER 401 Capstone — Project 14: Permission-Aware Knowledge Agent**
>
> **Date:** September 16, 2026
>
> Implementation/design guide for the **Retrieval Quality** feature.
>
> **Implementation status:** This is a target design. There is currently no
> document ingestion, vector/BM25 search, reranker, or retrieval-quality
> measurement in the backend.

---

## 1. Feature Definition

> **Retrieval Quality:** Ensure the system retrieves the right chunks from the vector database before they ever reach the LLM. This is the difference between a system people use and one they abandon.

The sponsor stated:

> "Chunking strategy, hybrid keyword and vector search, reranking, and query rewriting are the difference between a system people use and one they abandon in a fortnight."

This feature is about finding the most **relevant** chunks among the **authorized**
chunks.

---

## 2. Why This Is Hard

Naive RAG:

```text
User query → embed → vector search → top 5 → LLM
```

This can fail because:

1. Semantic search can miss exact keywords.
2. Top 5 by similarity does not necessarily mean top 5 by relevance.
3. Chunk size affects retrieval quality.
4. Users phrase queries differently from how documents are written.
5. A single embedding model may not represent domain-specific terms well.

A stronger pipeline is:

```text
User query
    ↓
Query transformation (additive, not destructive)
    ↓
Hybrid search (BM25 + vector, both ACL-filtered)
    ↓
Top 20 candidates
    ↓
Reranker (cross-encoder)
    ↓
Top 5 most relevant
    ↓
Evidence sufficiency check
    ↓
LLM or refuse
```

---

# 3. The Three-Feature Chain

Retrieval Quality is part of a larger security and reliability chain:

| Layer                     | Question It Answers                 |
| ------------------------- | ----------------------------------- |
| **Authorization**         | Can this user see this data?        |
| **Retrieval Quality**     | Is this data relevant to the query? |
| **Evidence Sufficiency**  | Is there enough evidence to answer? |
| **Generation**            | Can the LLM formulate the answer?   |
| **Citation Verification** | Did the answer stay grounded?       |

Each layer is independent and can fail without automatically compromising the
others.

---

# 4. Corrected Architecture

```text
                    USER QUERY
                        │
                        ▼
               ┌─────────────────┐
               │ Authentication  │
               └────────┬────────┘
                        │
                        ▼
               ┌─────────────────┐
               │ Permission      │
               │ Resolution      │
               └────────┬────────┘
                        │
                 AuthContext
                        │
                        ▼
               ┌─────────────────┐
               │ Query           │
               │ Transformation  │
               │ (additive)      │
               └────────┬────────┘
                        │
                        ▼
          ┌───────────────────────────┐
          │      HYBRID SEARCH        │
          │                           │
          │  BM25 ────────┐          │
          │                ├─ RRF      │
          │  Vector ──────┘          │
          │                           │
          │  ACL FILTER on BOTH      │
          └─────────────┬─────────────┘
                        │
                  Top 20 authorized
                        │
                        ▼
               ┌─────────────────┐
               │    Reranker     │
               └────────┬────────┘
                        │
                   Top 5 relevant
                        │
                        ▼
               ┌─────────────────┐
               │ Evidence        │
               │ Sufficiency     │
               └────────┬────────┘
                    ┌───┴───┐
                    │       │
                  PASS     FAIL
                    │       │
                    ▼       ▼
                   LLM    REFUSE
                    │
                    ▼
              Answer + citations
                    │
                    ▼
              Citation Verification
```

---

# 5. The Four Components

## 5.1 Chunking Strategy

Chunking is an engineering experiment rather than a fixed law.

| Strategy           | When to Use                                                        |
| ------------------ | ------------------------------------------------------------------ |
| **Recursive**      | Good default — splits by paragraph, then sentence                  |
| **Document-aware** | Best for structured sources such as headings, tables, and sections |
| **Fixed-size**     | Simple baseline, but can cut mid-sentence                          |
| **Semantic**       | Splits by topic change — potentially higher quality, but slower    |

Architecture:

```text
        Document
            │
    ┌───────┴───────┐
    │               │
Unstructured    Structured
    │               │
Recursive      Document-aware
    │               │
500 / 50         headings/tables
baseline         preserved
```

### Recommended Experiment

Start with recursive `500 / 50`.

Then measure:

```text
300 / 30
500 / 50
800 / 100
```

against the golden dataset.

Let the evaluation data determine which configuration performs better for the
project's knowledge base.

---

## 5.2 Hybrid Search

Combine keyword search (BM25) with vector search.

```python
def hybrid_search(query, acl_filter, top_k=20):
    # Vector search — ACL filtered
    vector_results = vector_store.similarity_search(
        query=query,
        k=top_k,
        filter=acl_filter
    )

    # Keyword search (BM25) — ACL filtered
    keyword_results = bm25_index.search(
        query=query,
        k=top_k,
        filter=acl_filter
    )

    # Reciprocal Rank Fusion
    combined = reciprocal_rank_fusion(
        vector_results,
        keyword_results
    )

    return combined[:top_k]
```

### Why Hybrid Search?

Vector search can find semantic relationships:

```text
"time off" → "vacation policy"
```

BM25 can find exact terms:

```text
"Project Phoenix" → exact project references
```

Together they cover both semantic and lexical retrieval cases.

### Why RRF?

BM25 scores and vector similarity scores are not naturally comparable.

Reciprocal Rank Fusion combines results by **rank position** rather than
assuming that scores from different systems have the same meaning.

Example:

```text
BM25 ranks:   A, B, C, D
Vector ranks: C, A, E, B

RRF result:   A, C, B, ...
```

---

## 5.3 Query Transformation — Additive, Not Destructive

Query rewriting must preserve the user's original intent.

### Destructive

```text
User:
"What's PTO?"

Rewritten:
"How does an employee request paid time off, vacation, leave, and absence?"

Search:
rewritten_query only
```

The rewrite may introduce assumptions that were not present in the original
question.

### Additive

```json
{
  "original": "What's PTO?",
  "rewrites": ["What is Paid Time Off?", "PTO policy"]
}
```

Search the original and the rewrites, merge their results, and preserve the
original query.

### HyDE

Postpone HyDE until a baseline exists.

Adding too many retrieval techniques at once makes it difficult to determine
which change actually improved or degraded retrieval quality.

---

## 5.4 Reranking

A reranker evaluates the query and candidate chunk together, which can be more
precise than vector similarity alone.

Example:

```python
def rerank(query, candidates, top_k=5):
    reranked = cohere_client.rerank(
        query=query,
        documents=[c.content for c in candidates],
        top_n=top_k,
        model="rerank-english-v3.0"
    )

    return [
        candidates[r.index]
        for r in reranked.results
    ]
```

Conceptually:

```text
Vector search → similar chunks
Reranker      → relevant chunks
```

Pipeline:

```text
Top 20 candidates
       ↓
   Reranker
       ↓
Top 5 relevant chunks
```

### Critical Rule

> **The reranker must receive ONLY authorized candidates.**

---

# 6. ACL as a Mandatory Invariant

Authorization filtering is a mandatory invariant of every retrieval path.

Both lexical and vector candidate-generation paths receive the server-derived
authorization constraints.

Only authorized candidates may enter:

```text
RRF
↓
Reranking
↓
Evidence evaluation
↓
LLM context
```

### Correct

```text
BM25 ─────┐
          ├── ACL filter on BOTH ── RRF ── Rerank ── Evidence ── LLM
Vector ───┘
```

### Incorrect

```text
BM25 ─────┐
          ├── RRF ── Top 20 ── ACL filter ── Rerank ── LLM
Vector ───┘
```

The second architecture is dangerous because unauthorized candidates have
already entered the application pipeline.

Even if they are filtered later, they may have been:

- logged,
- traced,
- cached,
- included in metrics,
- exposed to another internal component.

The security boundary therefore belongs at candidate generation.

---

# 7. Parent-Document Metadata

Each chunk should store more than its content.

Example:

```json
{
  "chunk_id": "chunk-123",
  "document_id": "doc-456",
  "section_id": "section-3",
  "title": "Vacation Policy",
  "heading": "Requesting PTO",
  "source": "google_drive",
  "created_at": "2025-03-15",
  "updated_at": "2026-01-10",
  "acl_principals": ["group:17", "group:23"],
  "content": "..."
}
```

### Benefits

Metadata enables:

- freshness/staleness detection through `updated_at`,
- source-based filtering,
- citation provenance,
- document-aware reranking,
- authorization filtering.

---

# 8. Test Suites

## Suite A — Retrieval Quality

Create a golden dataset containing queries with known correct chunks.

Example:

| Query                             | Expected Chunk                    |
| --------------------------------- | --------------------------------- |
| "How do I request vacation time?" | `hr-vacation-policy.pdf` chunk 3  |
| "What is Project Phoenix?"        | `engineering-roadmap.md` chunk 12 |
| "Who approves expenses?"          | `finance-policy.pdf` chunk 7      |

Example test:

```python
def test_retrieval_quality(retriever):
    for case in RETRIEVAL_CASES:
        results = retriever.search(
            query=case["query"],
            auth_context=admin_context,
            top_k=5
        )

        result_ids = [
            r.chunk_id
            for r in results
        ]

        assert any(
            expected in result_ids
            for expected in case["expected"]
        ), f"Failed: {case['query']}"
```

---

## Suite B — ACL Invariant Across All Stages

Test that every intermediate stage is 100% authorized.

```python
def test_acl_invariant_across_all_stages(
    client,
    intern_token
):
    response = client.post(
        "/api/chat",
        json={
            "query": "Show me finance projections"
        },
        headers={
            "Authorization": f"Bearer {intern_token}"
        }
    )

    meta = response.json()["metadata"]
    authorized = get_authorized_chunk_ids("intern")

    assert all_authorized(
        meta["bm25_results"],
        authorized
    )

    assert all_authorized(
        meta["vector_results"],
        authorized
    )

    assert all_authorized(
        meta["rrf_results"],
        authorized
    )

    assert all_authorized(
        meta["reranker_results"],
        authorized
    )

    assert all_authorized(
        meta["llm_context"],
        authorized
    )
```

This directly tests the sponsor's requirement at every stage, rather than only
testing the final answer.

---

# 9. Metrics

There is a fundamental difference between **security invariants** and
**quality targets**.

| Metric                      | Type                 | Target / Use              |
| --------------------------- | -------------------- | ------------------------- |
| **Permission Leakage Rate** | Security invariant   | **0% — hard requirement** |
| **Recall@20**               | Candidate generation | Measured as baseline      |
| **Recall@5**                | Ranking quality      | Initial target ≥ 90%      |
| **MRR**                     | Ranking quality      | Initial target ≥ 0.8      |
| **Context Precision**       | Ranking quality      | Initial target ≥ 70%      |
| **NDCG@5**                  | Ranking quality      | Initial target ≥ 0.75     |

### Important Distinction

Permission Leakage = `0%` is a hard security requirement for the target system.
The current `security.yml` runs a placeholder gate and does not enforce this
requirement (see `EVALUATION_HARNESS.md` Section 9 for the intended gate
semantics).

Recall@5, MRR, Context Precision, and NDCG@5 are initial research baselines to be validated against the project's golden dataset (`data/evaluation/golden_dataset.json`) rather than
treated as universal laws.

---

# 10. Candidate Generation vs. Ranking

Retrieval contains two separate problems.

## Problem 1 — Candidate Generation

```text
BM25 + Vector
      ↓
   Top 20
```

Question:

> Did we find the relevant information at all?

Metric:

```text
Recall@20
```

## Problem 2 — Ranking

```text
Top 20
   ↓
Reranker
   ↓
Top 5
```

Question:

> Did we put the useful information near the top?

Metrics:

```text
MRR
NDCG@5
Recall@5
```

### Example

If the correct chunk is ranked 15:

```text
Recall@20 = success
Recall@5  = failure
```

This indicates that candidate generation found the information but ranking did
not place it high enough.

---

# 11. Ablation Study

The ablation study turns the feature into a controlled experiment.

| Pipeline                               | Recall@5 |     MRR |  NDCG@5 | Precision |
| -------------------------------------- | -------: | ------: | ------: | --------: |
| A: Vector only                         |  measure | measure | measure |   measure |
| B: BM25 only                           |  measure | measure | measure |   measure |
| C: Hybrid (Vector + BM25)              |  measure | measure | measure |   measure |
| D: Hybrid + Reranker                   |  measure | measure | measure |   measure |
| E: Hybrid + Reranker + Query Rewriting |  measure | measure | measure |   measure |

The experiment asks:

> Does chunking + hybrid retrieval + reranking + rewriting actually improve
> retrieval quality for our knowledge base?

This provides empirical evidence rather than simply assuming that every added
technique improves the system.

---

# 12. What NOT to Do

| Anti-Pattern                                       | Why It Fails                                                             |
| -------------------------------------------------- | ------------------------------------------------------------------------ |
| Vector-only search                                 | Can miss keyword matches such as names, acronyms, and codes              |
| No reranking                                       | Top 5 by similarity does not necessarily equal top 5 by relevance        |
| Fixed chunk size for all sources                   | Structured documents can lose meaning when split randomly                |
| Destructive query rewriting                        | Can change the user's intent                                             |
| Adding HyDE before baseline                        | Too many moving pieces make improvement attribution difficult            |
| Applying ACL after retrieval                       | Unauthorized data has already entered the application                    |
| Retrieving from unrestricted index for diagnostics | Can reveal existence of unauthorized documents                           |
| Hard-coding quality targets as universal truths    | Quality targets are empirical; security invariants are hard requirements |
| Ignoring parent-document metadata                  | Loses provenance, freshness, and source-filtering capability             |

---

# 13. Implementation Checklist

### Chunking

- [ ] Establish recursive `500/50` baseline.
- [ ] Test `300/30`.
- [ ] Test `800/100`.
- [ ] Preserve headings and table structure where appropriate.
- [ ] Evaluate chunk configurations against the golden dataset.

### Hybrid Search

- [ ] Implement vector retrieval.
- [ ] Implement BM25 retrieval.
- [ ] Apply ACL filters to both paths.
- [ ] Implement RRF.
- [ ] Produce top-20 authorized candidates.

### Query Transformation

- [ ] Preserve original query.
- [ ] Generate additive rewrites.
- [ ] Search original + rewrites.
- [ ] Merge results.
- [ ] Evaluate whether rewriting improves metrics.
- [ ] Delay HyDE until a baseline exists.

### Reranking

- [ ] Rerank only authorized candidates.
- [ ] Compare top-20 candidates.
- [ ] Return top-5 relevant chunks.
- [ ] Evaluate ranking metrics.

### Metadata

- [ ] Store chunk ID.
- [ ] Store parent document ID.
- [ ] Store section/heading information.
- [ ] Store source.
- [ ] Store creation/update timestamps.
- [ ] Store ACL information.
- [ ] Preserve citation provenance.

### Testing

- [ ] Build golden retrieval dataset.
- [ ] Measure Recall@20.
- [ ] Measure Recall@5.
- [ ] Measure MRR.
- [ ] Measure NDCG@5.
- [ ] Measure Context Precision.
- [ ] Test ACL invariant at every retrieval stage.
- [ ] Test unauthorized candidates never reach the LLM.

---

# 14. Repository Locations

See [`REPOSITORY_STRUCTURE.md`](../architecture/REPOSITORY_STRUCTURE.md) for the canonical layout. Key locations for this feature:

- `app/services/retrieval/` — `secure_retriever.py` (canonical boundary), `vector_store.py`, `bm25.py`, `hybrid.py`, `reranker.py`, `query_rewrite.py`
- `app/services/ingestion/chunking.py` — chunking strategies
- `tests/` — `test_retrieval.py` (quality), `test_acl_invariant_stages.py` (security invariant)

---

# 15. Suggested Implementation Order

```text
1. Build golden retrieval dataset
2. Establish vector-only baseline
3. Establish BM25-only baseline
4. Implement hybrid search
5. Implement RRF
6. Evaluate chunking strategies
7. Add reranking
8. Evaluate query transformation
9. Add evidence sufficiency
10. Run ACL invariant tests
11. Run ablation study
12. Record metrics and conclusions
```

This order makes it easier to determine which component actually changes
retrieval performance.

---

# 16. Capstone Demo Contribution

See [`BUILD_PLAN.md`](../planning/BUILD_PLAN.md) Phase 8 for the canonical demo. This feature contributes the pipeline trace: original + additive rewrites → ACL-filtered BM25 + vector → RRF → top 20 → rerank → top 5, proving unauthorized chunks never reach any stage.

---

# 17. Sponsor Requirement (summary)

Sponsor: *"Chunking, hybrid search, reranking, and query rewriting are the difference between a system people use and one they abandon."* See §1 for the full quote. Implementation: additive query transformation → hybrid BM25 + vector (both ACL-filtered) → RRF → cross-encoder rerank → evidence check, measured by ablation study on the golden dataset.

---

# 18. References

See [`PERMISSION_AWARE_RETRIEVAL.md`](../security/PERMISSION_AWARE_RETRIEVAL.md) §36 for canonical references (Azure AI Search, Pinecone). Retrieval-specific additions: Cohere Rerank; Cormack et al. (2009) RRF; BEIR zero-shot retrieval methodology; LangChain EnsembleRetriever.

---

## Final Engineering Principle

```text
RELEVANCE must be optimized
WITHOUT weakening AUTHORIZATION.
```

The retrieval system's job is therefore:

```text
Find the best chunks
        +
Only from the chunks the user is allowed to see
        +
Only pass those authorized candidates forward
```

That is the core of Retrieval Quality for the Permission-Aware Knowledge Agent.
