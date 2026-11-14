# CI Documentation - Permission-Aware Knowledge Agent

**Project:** SER 401 - Project 14: Permission-Aware Knowledge Agent

**Date:** November 14, 2026 (Last Modified)

This document describes the checked-in Continuous Integration (CI) workflows,
their current limitations, and recommended branch protection settings for the
frontend repository.

---

## Overview

The repository utilizes GitHub Actions workflows to validate pull request sources, run checks, and verify production builds.

- Workflows (`verify-pr-source.yml`) run automatically on pull requests and pushes to `main`.

---

## GitHub Actions Workflows

One workflow file is located in `.github/workflows/`:

### 1. **PR Source Verification Workflow (`verify-pr-source.yml`)**

- **Trigger:** `pull_request` and `push` to `main`.
- **Purpose:** Ensures that pull requests originate from expected source branches and follow repository contribution conventions.
- **Steps:**
    1. Validates branch naming conventions / base target branches to maintain structured branch integration standards.
    2. Upon successful validation, merge to `main` is enabled.

---

## Branch Protection Rules

Branch protection rules for `main` are:

- No direct pushes to `main`.
- Every Pull Request (PR) requires at least 1 approving review.
- All required workflows must pass before merging.
- Conversations must be resolved before merging.
- Force pushes to `main` are disabled.

Branch protection rules for `dev` are:

- No direct pushes to `dev`.
- Every Pull Request (PR) requires at least 1 approving review.
- All required workflows must pass before merging.
- Conversations must be resolved before merging.
- Force pushes to `dev` are disabled.
