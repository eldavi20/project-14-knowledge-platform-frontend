# Pull Request Process - Permission-Aware Knowledge Agent

**Project:** SER 401 – Project 14: Permission-Aware Knowledge Agent  
**Date:** October 10th, 2026 (Last Modified)
**Purpose:** The PR rules, format, and review process the team follows to keep the codebase secure and reviewable.

---

## 1. Why We Have a PR Process

The PR process exists for four reasons:

1. **Security** — Every PR is a chance for a second pair of eyes to verify no authorization bypass was introduced.
2. **Quality** — Every PR is reviewed before it enters `main`.
3. **Traceability** — Every PR links to a user story in Taiga and a task in the project board.
4. **Grading** — The professor requires visible individual contributions and code reviews.

Without a PR process, authorization bugs can slip through, and the professor cannot see who contributed what.

---

## 2. The Core Rules

|   # | Rule                                                         | Why                              |
| --: | ------------------------------------------------------------ | -------------------------------- |
|   1 | **Never push directly to `main`**                            | `main` must always be deployable |
|   2 | **Every change goes through a PR**                           | Review is mandatory              |
|   3 | **Every PR requires at least 1 approval**                    | No self-merge                    |
|   4 | **All CI checks must pass**                                  | Tests + security + evaluation    |
|   5 | **Security-boundary PRs require 2 approvals when available** | Extra scrutiny for authorization |
|   6 | **Every PR links to a Taiga user story and task**            | Traceability                     |
|   7 | **Every branch and PR title names its US and task**          | Story/task visible without opening Taiga |
|   8 | **PR size target: under 400 lines**                          | Reviewable in one sitting        |
|   9 | **`security.yml` must pass**                                 | Zero leakage is non-negotiable   |

### Note on Rule 5

If only one qualified reviewer is available for a security PR, the team documents the limitation and requires at least 1 qualified reviewer plus all `security.yml` checks to pass.

---

## 3. The Branch Naming Convention

Every branch names its Taiga story and task so the work is identifiable from the branch list alone:

```text
<type>/us-<story>-t-<task>-<short-description>
```

- `<story>` is the Taiga user-story number (e.g. `us-11` for US-11).
- `<task>` is the Taiga task ID verbatim, lowercased (e.g. `t-11.5` for T-11.5 — dots are valid in git branch names).
- Story-level branches spanning a whole story omit the task: `<type>/us-<story>-<short-description>`.
- The GitHub issue number is not in the branch — it mirrors the story number (`#11` ↔ US-11, see §19) and is linked in the PR instead.

| Type       | Purpose                              |
| ---------- | ------------------------------------ |
| `feat`     | New feature                          |
| `fix`      | Bug fix                              |
| `docs`     | Documentation only                   |
| `refactor` | Code restructure, no behavior change |
| `test`     | Tests only                           |
| `chore`    | Tooling, dependencies, config        |
| `security` | Authorization-related changes        |

### Examples

```text
security/us-11-t-11.5-permission-leakage-test
feat/us-5-t-5.3-supabase-login
fix/us-18-t-18.4-bm25-acl-filter
docs/us-1-t-1.7-readme-security
refactor/us-8-t-8.1-permission-service
```

---

## 4. The Commit Message Convention

We use **Conventional Commits**:

```text
<type>(<scope>): <short description>

<optional body>

<optional footer>
```

### Example 1 — Authentication

```text
feat(auth): add Supabase Auth login endpoint

Implements POST /api/auth/login with Supabase session handling.
Supabase manages token issuance and expiry.

Refs: US-5, T-5.3, #5
```

### Example 2 — ACL

```text
fix(acl): use immutable principal IDs in projections

Previously used usernames, which broke when users were renamed.
Now uses user:<id> and group:<id> format.

Refs: US-7, T-7.2, #7
```

### Example 3 — Security Boundary

```text
security(retriever): enforce ACL filter in SecureRetriever

Adds mandatory security filter to all vector DB queries.
Direct vector_store.similarity_search() calls are now
prohibited outside SecureRetriever.

Security: prevents unauthorized retrieval
Refs: US-11, T-11.5, #11
```

Footer rule: `Refs:` always lists the Taiga story, the Taiga task(s), and the GitHub issue.

---

## 5. The PR Title Format

The PR title matches the commit convention, with the Taiga story and task as greppable tags right after the colon (the `(#issue)` suffix keeps GitHub auto-linking):

```text
<type>(<scope>): [US-<story>][T-<task>] <short description> (#issue)
```

Story-level PRs spanning a whole story omit the task tag: `[US-<story>]`.

### Examples

```text
feat(auth): [US-5][T-5.3] add Supabase Auth login endpoint (#5)
fix(acl): [US-7][T-7.2] use immutable principal IDs in projections (#7)
security(retriever): [US-11][T-11.5] enforce ACL filter in SecureRetriever (#11)
```

---

## 6. The PR Description Template

Every PR uses the template at `.github/pull_request_template.md` — GitHub auto-fills it into the description box on every new PR, so the author only fills in the blanks. The full section list lives in that file (single source of truth); what each required section demands:

- **Summary** — one paragraph: what the PR does and why.
- **Related Issue** — all three links, filled like this:

```markdown
GitHub Issue: #11
Taiga User Story: <Taiga URL>
Taiga Task: T-11.5
```

- **Type of Change** — check all that apply, especially **Security-boundary change** (drives the 2-reviewer rule in §2).
- **What Changed** — concrete bullet list, not prose.
- **How to Test** — exact test commands (e.g., `npm test`, `npm run lint`, etc.) plus the expected result (e.g. 0% leakage).
- **Security Checklists** — the all-PRs list always applies; the security-boundary list (vector/BM25/RRF/reranker/LLM-context ⊆ authorized, fail-closed, revocation, no admin bypass) applies whenever Type of Change flags a boundary change.
- **Testing Checklist, Reviewer Notes, final Checklist** — branch/commit/title conventions, Taiga story + task link, CI green, docs updated.

Reviewers: an empty or unchecked-required-section template is grounds to request changes before reviewing code (see §8).

---

## 7. The Security-Boundary PR Definition

A **security-boundary PR** is any PR that changes:

- Identity or authentication
- Authorization or permission resolution
- ACL projection or synchronization
- Retrieval filtering or candidate generation
- RAG context construction
- Permission-related database schema
- Security regression tests
- Dependencies used in any of the above

### Illustrative File List

**To be updated once security-sensitive files are introduced.**

### Security-Boundary Rule

**To be updated once security-sensitive files are introduced.**

---

## 8. The Review Process

### As the Author

1. Create a branch following the naming convention.
2. Make focused commits — one logical change per commit.
3. Push the branch.
4. Open a PR using the template.
5. Fill in every section.
6. Link the Taiga user story.
7. Assign a reviewer.
8. Address feedback with new commits.
9. Merge through GitHub only when approved and CI passes.

### As the Reviewer

1. Read the PR description first.
2. Review the diff for correctness.
3. Check the security checklist.
4. Run the tests locally if uncertain.
5. Leave specific, actionable comments.
6. Approve, request changes, or comment.
7. Never approve a PR you don't understand.

---

## 9. The 10 Security Review Questions

Before approving a security-boundary PR, the reviewer must be able to answer:

1. Where does the user's identity come from?
2. Where are effective principals resolved?
3. Where is the ACL filter constructed?
4. Is the filter applied before candidate generation?
5. Can any retrieval path bypass `SecureRetriever`?
6. Can unauthorized chunks reach the reranker?
7. Can unauthorized chunks reach the LLM context?
8. What happens if permission resolution fails?
9. What happens after permission revocation?
10. Which security regression test proves this behavior?

These questions make the review concrete rather than relying only on a general "looks secure" assessment.

---

## 10. What the Reviewer Looks For

| Category | What to Check |
|---|---|
| **Security boundary** | Retrieval cannot bypass `SecureRetriever` |
| **Authorization** | Effective principals come from `PermissionService` |
| **Candidate generation** | ACL filtering occurs before retrieval candidates reach downstream stages |
| **Pipeline isolation** | Unauthorized chunks never reach RRF, reranker, evidence, or LLM |
| **Fail closed** | Missing or invalid authorization data denies access |
| **Revocation** | Permission changes cannot leave stale access through the query path |
| **Correctness** | Logic is right; edge cases handled |
| **Tests** | New behavior is tested; existing tests still pass |
| **Style** | Follows project conventions; readable |
| **Docs** | README or comments updated if behavior changed |
| **Scope** | PR does one thing; no unrelated changes |
| **Traceability** | Links to a Taiga user story |

---

## 11. The Code Review Comment Convention

Use these prefixes to make feedback clear:

| Prefix | Meaning |
|---|---|
| `[blocker]` | Must be fixed before merge |
| `[question]` | Need clarification |
| `[suggestion]` | Optional improvement |
| `[nit]` | Minor style preference |
| `[praise]` | Something done well |

### Example

```text
[blocker] This endpoint calls vector_store.similarity_search() directly.
All retrieval must go through SecureRetriever. See README security rule.

[suggestion] Consider extracting this filter logic into a helper.

[praise] Clean test coverage on the revocation case.
````

---

## 12. The CI Requirements

Every PR must pass these before it can merge:

| Check                    | Workflow         | Blocks Merge                    |
| ------------------------ | ---------------- | ------------------------------- |
| Unit + integration tests | `test.yml`       | Yes                             |
| Lint + type check        | `test.yml`       | Yes                             |
| Security suite           | `security.yml`   | **Yes — zero leakage required** |
| Evaluation metrics       | `evaluation.yml` | Initially informational         |

### The One Rule That Never Bends

`security.yml` must pass.

If it fails, no merge — regardless of who approves.

### What `security.yml` Passing Means

```text
Permission leakage rate = 0%
Unauthorized vector candidates = 0
Unauthorized BM25 candidates = 0
Unauthorized RRF candidates = 0
Unauthorized reranker inputs = 0
Unauthorized LLM context chunks = 0
```

Any non-zero value fails the PR regardless of other results.

### Evaluation Thresholds

Evaluation metrics are initially informational and may become blocking once the baseline and thresholds are validated.

Security invariants are always blocking.

---

## 13. The PR Size Guide

| Lines Changed | Review Time | Recommendation      |
| ------------- | ----------- | ------------------- |
| < 100         | Fast        | Ideal               |
| 100–400       | Reasonable  | Target range        |
| 400–800       | Slow        | Consider splitting  |
| > 800         | Painful     | Almost always split |

**Rule:** Target PR size is under 400 changed lines.

Larger PRs should be split when technically practical. Security-sensitive changes should be kept especially focused.

Generated files, lockfiles, migrations, and snapshots may exceed the target when necessary.

---

## 14. The Merge Workflow

The developer does **not** manually merge into `main`. All merges happen through GitHub via squash-and-merge after approval + green CI.

Flow: update `main` → create `<type>/us-<story>-t-<task>-<desc>` branch → focused commits (`<type>(<scope>): <desc>`, `Refs: US-11, T-11.5, #11`) → push → open PR titled `<type>(<scope>): [US-11][T-11.5] <desc> (#11)` with template + `security` label if boundary → address review → squash-merge in GitHub → pull `main`, delete branch. Example test file: `tests/security/test_permission_leakage.py`.

---

## 15. The Force-Push Rule

- **Never force-push to `main`** — enforced by branch protection.
- **On feature branches:** Do not force-push after review has started unless the reviewer is informed and the updated diff is explicitly re-reviewed.

---

## 16. The Branch Protection Rules

### Base GitHub Protection on `main`

| Rule / Setting                  | Configuration              |
| ------------------------------- | -------------------------- |
| Require PR before merging       | ✅ Enabled                 |
| Require approvals               | 1                          |
| Require status checks           | `test.yml`, `security.yml` |
| Require up-to-date branch       | ✅ Enabled                 |
| Require conversation resolution | ✅ Enabled                 |
| Restrict who can push to `main` | ✅ Enabled                 |
| Allow force pushes              | ❌ Disabled                |
| Allow deletions                 | ❌ Disabled                |

### Security PR Process — Team Discipline

For security-boundary PRs:

- Apply the `security` label.
- Request 2 qualified reviewers when available.
- Ensure `security.yml` passes.
- Verify the stage-aware security checklist.

**Note:** GitHub branch protection does not automatically enforce "2 approvals if security label." The team enforces this through the PR template and review discipline.

---

## 17. The Review Turnaround Target

| PR Type     | Target Turnaround |
| ----------- | ----------------- |
| Security PR | Within 24 hours   |
| Regular PR  | Within 48 hours   |
| Docs PR     | Within 72 hours   |

**Team agreement:** If you cannot review within the target, say so in the PR and reassign.

---

## 18. The Merge Strategy

**Squash and merge by default.**

The PR itself preserves the detailed development history and review discussion. `main` gets a clean commit.

You don't need a team rule for when to use merge commits versus rebase unless your team has a specific reason.

---

## 19. The Taiga/GitHub Traceability

Every PR links to both a Taiga user story and a GitHub issue.

```text
Taiga User Story: US-11
Taiga Task: T-11.5
        ↓
GitHub Issue: #11 (mirrors US-11)
        ↓
Branch: security/us-11-t-11.5-secure-retriever
        ↓
PR: security(retriever): [US-11][T-11.5] enforce ACL filter (#11)
        ↓
Commits: security(retriever): ... / Refs: US-11, T-11.5, #11
```

In the PR template:

```markdown
## Related Issue

GitHub Issue: #11
Taiga User Story: <Taiga URL>
Taiga Task: T-11.5
```

**Note:** `Closes #11` only works for GitHub issues, not Taiga stories. Use the format above to link all three (story, task, issue).

---

## 20. The README Security Rule

See [`REPOSITORY_STRUCTURE.md`](../architecture/REPOSITORY_STRUCTURE.md) §5 for the canonical Security Boundary text (must appear at the top of `README.md`): all retrieval through `SecureRetriever`, `R(u, q) ⊆ A(u)` at every stage, no unauthorized chunks in RRF/rerank/evidence/LLM context. Reviewers block any PR violating it.

---

## 21. What NOT to Do

| Anti-Pattern                                                  | Why It Fails                                |
| ------------------------------------------------------------- | ------------------------------------------- |
| Push directly to `main`                                       | Bypasses review and CI                      |
| Manually merge into `main` locally and push                   | Violates the "no direct push" rule          |
| Approve your own PR                                           | No second pair of eyes                      |
| Skip the security checklist                                   | Authorization bugs slip through             |
| Approve without reading                                       | Defeats the purpose of review               |
| Huge PRs (1000+ lines)                                        | No one reviews them properly                |
| Force-push to `main`                                          | Erases history, breaks others               |
| Force-push a branch under review without telling the reviewer | Erases review context                       |
| No linked Taiga story/task in branch, title, and template      | No traceability for grading                 |
| Commit secrets                                                | Security incident                           |
| Use `git commit -m "fix"`                                     | No context for history                      |
| Assume GitHub auto-enforces conditional approvals             | Branch protection doesn't understand labels |

---

## 22. Summary Table

| Aspect               | Rule                                                                    |
| -------------------- | ----------------------------------------------------------------------- |
| Branch naming        | `<type>/us-<story>-t-<task>-<description>` (story-level: omit `-t-<task>`) |
| Commit messages      | Conventional Commits + `Refs: US-N, T-N.M, #N`                          |
| PR title             | `<type>(<scope>): [US-N][T-N.M] <description> (#issue)`                 |
| PR template          | `.github/pull_request_template.md`                    |
| Approvals required   | 1 (2 for security-boundary PRs when available)        |
| CI required          | `test.yml` + `security.yml`                           |
| PR size target       | < 400 lines (generated files excepted)                |
| Merge strategy       | Squash and merge                                      |
| Merge location       | GitHub only — never local merge into `main`           |
| Force-push to `main` | Prohibited                                            |
| Security rule        | No bypass of `SecureRetriever`                        |
| Security invariant   | `R(u, q) ⊆ A(u)` at every stage                       |
| Traceability         | Branch, title, commits, and template all name the Taiga story + task and GitHub issue |

---

## Final PR Principle

The pull request process is designed around one central idea:

> **Every change must be reviewable, traceable, testable, and safe to merge.**

For this project, security is not something checked only after development. It is part of the normal development workflow:

```text
Taiga User Story + Task
        ↓
GitHub Issue (mirrors US number)
        ↓
Feature / Security Branch (us-N-t-N.M in name)
       ↓
Focused Commits
       ↓
Pull Request
       ↓
Code Review
       ↓
CI
 ┌─────┼──────────────┐
 ↓     ↓              ↓
Tests Security     Evaluation
      ↓
   0% Leakage
       ↓
Approval
       ↓
Squash + Merge
       ↓
main
```

The critical security invariant remains:

`R(u, q) ⊆ A(u)`

Unauthorized data must never cross the retrieval boundary, regardless of which feature or code path introduced the change.
