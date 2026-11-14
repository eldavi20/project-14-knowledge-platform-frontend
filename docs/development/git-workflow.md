# Git Workflow — dev Integration Model

**Story:** US-118 

**Date:** 13 Oct 2026

**Purpose:** How code flows from a keyboard to `main`. Companion to
[`PULL_REQUEST_PROCESS.md`](../planning/PULL_REQUEST_PROCESS.md) (review rules)
and [`ci.md`](./ci.md) (CI gates).

## The model

```text
feature/us-N-t-N.M-slug ──PR──▶ dev ──PR──▶ main
      (your work)          CI+1 approval   CI+1 approval
```

- **`main`** — protected, always deployable. Nothing merges here except
  from `dev` (promotion) or `hotfix/*` (emergency). Never commit to it directly.
- **`dev`** — protected integration branch. Feature branches merge here first,
  so integration breakage is caught before it can touch `main`.
- **Feature branches** — cut off `dev`, named
  `<type>/us-<story>-t-<task>-<slug>`, deleted after merge.

## Lifecycle of a change

1. `git checkout dev && git pull && git checkout -b <type>/us-N-t-N.M-<slug>`
2. Commit (`<type>(<scope>): [US-N][T-N.M] <desc>`, `Refs: US-N, T-N.M, #N`).
3. Push, open PR with **base `dev`** using the template
   (`.github/pull_request_template.md` — declare the target branch).
4. CI (`test`, `security`, `docker-build`) green + 1 approval +
   conversations resolved → squash-merge into `dev`, delete the branch.
5. When `dev` is stable: open PR **`dev` → `main`**, same gates → merge,
   delete nothing (`dev` and `main` are permanent).

## Rules

- No direct pushes to `dev` or `main` (branch protection enforces).
- Every PR needs 1 approval and green `test.yml` + `security.yml`.
- Conversations must be resolved before merge.
- Force pushes disabled on both branches.
- `main` accepts merges only from `dev` or `hotfix/*` — GitHub cannot
  express "source branch" in protection rules, so this is enforced by
  convention: the PR template's target-branch field plus reviewer
  discipline (reject any feature→`main` PR on sight).

## Hotfix exception

`hotfix/<issue>-<desc>` branches cut off `main` for production emergencies,
PR straight to `main` with the same gates, then forward-merge `main` back
into `dev` so the branches never diverge.

## Proof (US-118 T-129)

The story's test PR ran this exact path: feature → `dev` (CI + approval),
then `dev` → `main`. Both runs stay in Actions history as evidence.
