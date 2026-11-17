# Calibrated Refusal — Permission-Aware Knowledge Agent

> **SER 401 Capstone — Project 14: Permission-Aware Knowledge Agent**
>
> GitHub-ready implementation/design guide for the **Calibrated Refusal** feature.
> This is a target design: the backend does not yet implement retrieval,
> authorization-aware context, or refusal behavior.

## 1. Feature Overview

Calibrated refusal means the agent answers when **sufficient authorized evidence**
supports an answer and refuses when the accessible evidence is insufficient.

The key distinction is:

- Do not hallucinate when evidence is missing.
- Do not over-refuse when evidence is sufficient.
- Do not reveal protected information while refusing.

Calibrated refusal is therefore a **safety layer after authorization-aware
retrieval**, not a replacement for access control.

### Required execution order

```text
Authenticate user
      ↓
Resolve permissions
      ↓
ACL-filtered retrieval
      ↓
Authorized evidence
      ↓
Evidence sufficiency check
      ↓
Generate answer
      ↓
Verify answer/citations
      ↓
Return answer OR calibrated refusal
```

### Unsafe execution order

```text
Retrieve everything
      ↓
Ask the LLM what it is allowed to use
      ↓
Generate answer
```

The LLM should never be the component that decides whether protected documents
are accessible.

---

## 2. Core Security Invariants

### Authorization invariant

```text
Retrieved documents ⊆ Authorized documents
```

Or:

```text
R(u, q) ⊆ A(u)
```

Where `A(u)` is the set of resources authorized for user `u`.

### Grounding invariant

```text
Answer claims ⊆ Supported authorized evidence
```

### Refusal invariant

```text
Insufficient authorized evidence
        ↓
No unsupported confident answer
```

---

## 3. Three Safety Layers

### Layer 1 — Authorization

Resolve identity, roles, groups, attributes, and document permissions. Enforce
ACLs in the index/query path before content reaches the generation model.

### Layer 2 — Evidence / Refusal

Determine whether the retrieved **authorized** evidence is sufficient. If not,
return a calibrated refusal instead of inventing an answer.

### Layer 3 — Generation Verification

After generation, check that claims are supported by the authorized evidence
and that citations actually support the claims they reference.

---

## 4. Information-Disclosure Rule

Refusal must not become a document-existence oracle.

Unsafe:

```text
"I found an HR compensation document, but you don't have permission to see it."
```

This can reveal that protected information exists.

Safer user-facing behavior:

```text
"I don't have enough accessible information to answer that."
```

The internal system can retain the specific refusal reason for auditing, while
the user-facing response remains generic when necessary.

---

## 5. Evidence Sufficiency

Do not rely only on:

```text
similarity_score >= fixed_threshold
```

Evidence evaluation should consider multiple signals:

1. **Reranker/relevance score**
2. **Distinct source support**
3. **Agreement or conflict**
4. **Evidence coverage**
5. **A relevance/similarity floor**

More sources do not automatically mean the information is true. Conflicting
sources should be detected rather than silently resolved by the model.

---

## 6. Example Evidence Check

```python
def evidence_sufficiency_check(evidence):
    if not evidence:
        return False

    if evidence.has_conflict:
        return False

    if evidence.rerank_score < MIN_RERANK_SCORE:
        return False

    if evidence.distinct_source_count == 0:
        return False

    return True
```

Example combined score:

```python
def evidence_score(evidence):
    return (
        0.50 * evidence.rerank_score
        + 0.20 * evidence.source_support
        + 0.20 * evidence.claim_agreement
        + 0.10 * evidence.coverage
    )
```

> These weights and thresholds are **examples only**. Calibrate them against the
> team's evaluation dataset.

---

## 7. Evidence Coverage

A question can contain multiple requirements:

```text
"Who approved the project, when was it approved,
and what budget was approved?"
```

Evidence may support only one or two of these claims.

Conceptually:

```text
Question
   ├── Claim A → supported
   ├── Claim B → supported
   └── Claim C → unsupported
```

The system should not produce a confident complete answer when an important
claim is unsupported.

---

## 8. LangGraph Workflow

A suggested graph:

```text
START
  ↓
authenticate
  ↓
resolve_authorization
  ↓
secure_retrieve
  ↓
rerank_filter
  ↓
check_evidence
  ├── insufficient → refuse
  │
  └── sufficient
          ↓
       generate
          ↓
   verify_citations
      ├── failed → refuse / regenerate
      │
      └── passed
          ↓
        answer
```

The baseline graph state is defined by `RAGState` in
`app/services/rag/state.py`. It requires the query, the integer application
user ID, and server-resolved principals; never populate principals from
frontend input or JWT claims. Retrieval, evidence, answer, citation, and
refusal fields are optional until their nodes produce them. Each citation
requires a document ID and can retain chunk and source provenance when
available. Citation verification is a later pipeline step and is not part of
the baseline state contract.

Suggested nodes:

- `authenticate`
- `resolve_authorization`
- `secure_retrieve`
- `rerank_filter`
- `check_evidence`
- `generate_answer`
- `verify_citations`
- `refuse`

---

## 9. Refusal Decision Object

Use a structured internal decision:

```python
refusal_decision = {
    "should_refuse": True,
    "reason": "LOW_EVIDENCE",
    "evidence_score": 0.31,
    "authorized_evidence_count": 2,
    "conflict_detected": False,
}
```

Canonical `audit_events.refusal_reason` codes (see `DATABASE_MODEL.md` Section 9.2):

```text
NO_EVIDENCE
LOW_EVIDENCE
PERMISSION_BLOCKED
OUT_OF_SCOPE
STALE_EVIDENCE
CONFLICTING_EVIDENCE
VERIFICATION_FAILED
```

`VERIFICATION_FAILED` extends the DB set for citation-verification failures. Map legacy internal names: `INSUFFICIENT_EVIDENCE` → `LOW_EVIDENCE`, `NO_AUTHORIZED_EVIDENCE` → `PERMISSION_BLOCKED`, `QUESTION_OUT_OF_SCOPE` → `OUT_OF_SCOPE`.

Do not expose sensitive authorization details directly to the user.

---

## 10. Citation and Claim Verification

A citation alone is not proof.

Example:

```text
The project launches October 10. [Source A]
```

If Source A says October 20, the citation does not make the claim grounded.

Conceptual validation:

```python
def validate_answer(answer, evidence):
    claims = extract_claims(answer)

    for claim in claims:
        supporting_chunks = find_supporting_chunks(claim, evidence)

        if not supporting_chunks:
            return False

    return True
```

If verification fails, do not return an unsupported answer. Regenerate with
stricter grounding or return a refusal according to the team's design.

---

## 11. LLM-as-Judge Limitation

An LLM may assist with claim/evidence evaluation, but it should not be treated
as an infallible security control.

Use this separation:

```text
Authorization
    ↓
Deterministic / policy enforcement
    ↓
Evidence retrieval
    ↓
LLM generation / verification
```

The model must not be allowed to override authorization.

---

## 12. Evaluation Dataset

Create test cases for:

### Answerable questions

Authorized evidence clearly supports the answer.

Expected:

```text
ANSWER
```

### Insufficient-evidence questions

The user's accessible documents do not contain enough evidence.

Expected:

```text
REFUSAL
```

### Unauthorized-evidence questions

Relevant information exists but is inaccessible to the user.

Expected:

```text
GENERIC REFUSAL
```

### Conflicting-evidence questions

Authorized sources disagree.

Expected behavior should be explicitly defined, such as refusal or an answer
that clearly communicates the conflict.

### Adversarial questions

Include prompt injection, document-existence probing, cross-document inference,
and attempts to reveal restricted context.

---

## 13. Security Test Suite

### Authorization leakage

```python
def test_unauthorized_document_not_retrieved():
    user = create_user_without_hr_access()

    results = secure_retrieve(
        user=user,
        query="employee compensation"
    )

    assert all(
        document["document_id"] not in PROTECTED_HR_DOCUMENTS
        for document in results
    )
```

Test retrieval/context, not just the final answer.

An answer can appear safe even when an unauthorized document was incorrectly
passed into the LLM.

### Calibrated refusal

Test:

```text
Strong authorized evidence → answer
Insufficient evidence → refusal
Unauthorized evidence → generic refusal
```

### Over-refusal

Ensure strong authorized evidence does not cause unnecessary refusals.

### Adversarial cases

Include:

- Authorization leakage
- Prompt injection
- Document-existence probing
- Cross-document inference
- Unauthorized retrieval
- Conflicting evidence
- Unsupported citations
- Citation mismatch
- Protected metadata leakage

---

## 14. Document-Existence Probing

Examples:

```text
"Does a document about executive compensation exist?"
"Is there an HR document mentioning employee X?"
"What is in the HR folder that I cannot access?"
```

The system should not confirm the existence of unauthorized resources.

---

## 15. Cross-Document Inference

Permission controls must also consider indirect leakage.

A user may have access to Document A but not Document B and construct a question
that attempts to make the agent infer protected information from B.

The system should not reconstruct protected information indirectly.

---

## 16. Conflicting Evidence

Example:

```text
Source A → Budget = $100,000
Source B → Budget = $125,000
```

The system should identify the conflict rather than silently choosing a value.

Possible project behavior:

```text
REFUSE
```

or:

```text
Explain the conflict with authorized citations
```

The exact behavior should be defined by the team's requirements.

---

## 17. Metrics

Recommended evaluation metrics include:

### Refusal Accuracy

```text
Correct refusal decisions / All refusal-decision cases
```

### Over-Refusal Rate

Measures cases where the system refuses despite sufficient authorized evidence.

### False Confidence Rate

```text
Unsupported confident answers / Insufficient-evidence cases
```

### Hallucination Rate

```text
Answers containing unsupported claims / Evaluated answers
```

### Permission Leakage Rate

```text
Unauthorized information exposures / Unauthorized test cases
```

For this project, the target should be:

```text
0% permission leakage
```

Retrieval-level leakage matters even if the final answer does not expose the
protected information.

---

## 18. Observability

Useful internal metrics/events:

```text
request_id
user_id
query_hash
authorization_result
retrieved_document_ids
filtered_document_count
evidence_score
refusal_reason
verification_result
timestamp
```

Also track:

```text
retrieval_count
authorized_retrieval_count
refusal_rate
answer_rate
verification_failure_rate
permission_leakage_count
unsupported_claim_count
```

Avoid unnecessarily storing sensitive content in logs.

---

## 19. Configuration

Example:

```yaml
calibrated_refusal:
  enabled: true

  evidence:
    min_rerank_score: 0.70
    min_source_count: 1
    reject_conflicts: true

  verification:
    enabled: true

  refusal:
    generic_unauthorized_message: true
```

These are example values, not universal thresholds.

Configuration changes should be evaluated against the same test dataset and
tracked with model/retrieval versions where practical.

---

## 20. Team Responsibilities

See [`PERMISSION_AWARE_RETRIEVAL.md`](./PERMISSION_AWARE_RETRIEVAL.md) Section 33 for the canonical role split (Backend/API, Authorization, Ingestion/Connectors, Vector/Retrieval, LLM/Orchestration, Security/Testing). For this feature the focus roles are:

| Role                          | Responsibility for this feature                     |
| ----------------------------- | --------------------------------------------------- |
| Refusal / Evaluation Engineer | Evidence sufficiency, refusal logic, evaluation dataset |
| LLM / Generation Engineer     | Grounded generation and claim verification          |
| Security / Test Engineer      | Leakage, injection, probing, adversarial tests      |

One person can perform multiple roles in a capstone team.

---

## 21. Definition of Done

> Authorization items are covered canonically in `PERMISSION_AWARE_RETRIEVAL.md` Section 34 and `DATABASE_MODEL.md` Section 18. Below are the refusal-specific additions.

### Authorization (summary — see canonical checklists)

- [ ] Authentication implemented
- [ ] User permissions resolved
- [ ] ACL filtering happens before generation
- [ ] Unauthorized documents cannot enter LLM context
- [ ] Document-existence probing does not reveal protected content

### Evidence

- [ ] Evidence sufficiency evaluated
- [ ] Relevance/reranking considered
- [ ] Evidence coverage considered
- [ ] Conflicts detected
- [ ] Thresholds evaluated against test data

### Refusal

- [ ] Insufficient evidence produces refusal
- [ ] Strong evidence does not cause unnecessary refusal
- [ ] Unauthorized questions receive generic responses
- [ ] Refusal reasons are auditable internally

### Generation

- [ ] Answers grounded in authorized evidence
- [ ] Citations generated where applicable
- [ ] Claims checked against evidence
- [ ] Unsupported claims rejected or regenerated

### Testing

- [ ] Authorization leakage tests
- [ ] Calibrated refusal tests
- [ ] Over-refusal tests
- [ ] Prompt-injection tests
- [ ] Document-existence probing tests
- [ ] Cross-document inference tests
- [ ] Conflicting-evidence tests

### Observability

- [ ] Retrieval decisions logged appropriately
- [ ] Refusal reasons measurable
- [ ] Verification failures measurable
- [ ] Permission leakage tracked
- [ ] Evaluation results reproducible

---

## 22. Capstone Demo Contribution

See [`BUILD_PLAN.md`](../planning/BUILD_PLAN.md) Phase 8 for the canonical demo. This feature contributes the refusal step: same budget question as authorized vs unauthorized user shows grounded answer vs generic refusal, proving the protected document never entered the unauthorized generation context.

---

## 23. Suggested Implementation Order

```text
1. Authentication
2. Authorization model
3. ACL-aware indexing/retrieval
4. Retrieval security tests
5. Evidence representation
6. Evidence sufficiency logic
7. Refusal handling
8. Grounded generation
9. Citation/claim verification
10. Adversarial tests
11. Metrics and observability
12. End-to-end evaluation
```

Do not implement refusal first and assume it compensates for missing
authorization enforcement.

---

## 24. Provider / Technology References

See [`PERMISSION_AWARE_RETRIEVAL.md`](./PERMISSION_AWARE_RETRIEVAL.md) Section 36 for the canonical provider and technology references (Azure AI Search, Pinecone, Google Drive, Discord, Supabase RLS, FastAPI, OWASP, NIST ABAC). This feature additionally uses LangGraph orchestration and Cohere Rerank scoring as evidence signals — thresholds remain project configuration, not universal truths.

---

## 25. Quick Team Checklist

```text
[ ] User authenticated
[ ] Permissions resolved
[ ] ACL applied during retrieval
[ ] Unauthorized chunks excluded
[ ] Evidence reranked
[ ] Evidence sufficiency evaluated
[ ] Conflicts detected
[ ] Unsupported questions refused
[ ] Unauthorized questions answered generically
[ ] Answer generated only from authorized evidence
[ ] Claims verified
[ ] Citations verified
[ ] Retrieval leakage tested
[ ] Prompt injection tested
[ ] Document-existence probing tested
[ ] Cross-document inference tested
[ ] Over-refusal tested
[ ] Metrics collected
[ ] Configuration versioned
```
