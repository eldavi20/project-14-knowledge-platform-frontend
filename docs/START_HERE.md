# Start Here - Project Documentation

**Project:** SER 401 – Project 14: Permission-Aware Knowledge Agent
**Repository:** `project-14-knowledge-platform-frontend`

Welcome to the project documentation.

This folder contains the project's planning, architecture, security, retrieval, and evaluation documentation. If you are new to the project, **do not try to read every document at once**. Follow the recommended path below.

---

## 1. Recommended Starting Path

The documentation is organized into five areas:

```text
docs/
├── START_HERE.md
├── planning/
├── architecture/
├── security/
├── retrieval/
└── evaluation/
```

A new team member should generally read the documentation in this order:

```text
START_HERE
    │
    ▼
Planning
    │
    ├── BUILD_PLAN
    ├── SCRUM_GUIDE
    ├── TAIGA_SETUP
    └── PULL_REQUEST_PROCESS
    │
    ▼
Architecture
    │
    ├── REPOSITORY_STRUCTURE
    ├── DATABASE_MODEL
    ├── DATABASE_MIGRATIONS
    └── DATABASE_QUERIES
    │
    ▼
Security
    │
    ├── PERMISSION_AWARE_RETRIEVAL
    └── CALIBRATED_REFUSAL
    │
    ▼
Retrieval
    │
    ├── RETRIEVAL_QUALITY
    ├── FRESHNESS_STALENESS_DETECTION
    └── CONFLICT_DETECTION
    │
    ▼
Evaluation
    │
    └── EVALUATION_HARNESS
```

This order follows the project's overall progression:

**Plan → Understand the architecture → Understand the security boundary → Understand retrieval behavior → Evaluate the system**

---

# 2. Planning Documentation

The `planning/` folder explains **what we are building, how we organize the work, and how the team executes it.**

## Build Plan

**File:** [`planning/BUILD_PLAN.md`](./planning/BUILD_PLAN.md)

### Purpose

The Build Plan defines the project's implementation order.

It explains:

- What should be built first
- Why the security boundary comes first
- The project's phased development approach
- The relationship between authentication, ACLs, retrieval, ingestion, RAG, reliability, and evaluation
- The project's milestones
- Continuous testing
- Dependencies between development phases

### Read this when:

- You are new to the project
- You need to understand the overall development sequence
- You are deciding what should be implemented next
- You want to understand why the project is built in a particular order

**Start here if you want to understand the project's implementation roadmap.**

---

## Scrum Guide

**File:** [`planning/SCRUM_GUIDE.md`](./planning/SCRUM_GUIDE.md)

### Purpose

The Scrum Guide explains **how the team works together**.

It covers:

- Scrum structure
- Taiga hierarchy
- Epics
- User stories
- Tasks
- Issues
- Story states
- Sprint structure
- Sprint planning
- Standups
- Sprint reviews
- Retrospectives
- Kanban workflow
- WIP limits
- Story points
- Sprint mapping

### Read this when:

- You need to understand the team's development process
- You are participating in sprint planning
- You need to understand how work moves through the board
- You need to understand how stories and tasks are organized

---

## Taiga Setup

**File:** [`planning/TAIGA_SETUP.md`](./planning/TAIGA_SETUP.md)

### Purpose

The Taiga Setup document explains **how this project's work is represented in Taiga**.

It covers:

- Project structure
- Epics
- User stories
- Tasks
- Dependencies
- Sprint assignments
- Frontend rotation
- Kanban workflow
- Issue examples
- Traceability between Taiga and GitHub

### Read this when:

- You are creating or updating Taiga work items
- You need to know which epic a story belongs to
- You need to understand sprint assignments
- You need to create tasks or issues consistently

### Relationship to Scrum Guide

These documents work together:

```text
SCRUM_GUIDE.md
     │
     │ explains the process
     ▼
TAIGA_SETUP.md
     │
     │ shows how our project applies that process
     ▼
Taiga Board
```

---

## Pull Request Process

**File:** [`planning/PULL_REQUEST_PROCESS.md`](./planning/PULL_REQUEST_PROCESS.md)

### Purpose

The Pull Request Process explains **how code changes move from development into the main branch**.

It covers:

- Branch naming
- Conventional Commits
- Pull request requirements
- Security-boundary reviews
- Required approvals
- CI requirements
- Reviewer responsibilities
- PR size guidelines
- Merge strategy
- Branch protection
- Taiga/GitHub traceability

### Read this when:

- You are about to create a branch
- You are opening a pull request
- You are reviewing someone's pull request
- You are merging code
- You are making changes related to the security boundary

### Basic workflow

```text
Taiga Story
    ↓
Create Branch
    ↓
Implement Task
    ↓
Run Tests
    ↓
Commit
    ↓
Pull Request
    ↓
Review
    ↓
CI
    ↓
Merge
```

---

# 3. Architecture Documentation

The `architecture/` folder explains **how the project is structured**.

## Repository Structure

**File:** [`architecture/REPOSITORY_STRUCTURE.md`](./architecture/REPOSITORY_STRUCTURE.md)

### Purpose

This document explains the organization of the codebase.

It helps answer:

> "Where does this code belong?"

It describes the expected repository structure and the responsibilities of the major project directories.

### Read this when:

- You are adding a new file
- You do not know where code should go
- You are learning the project structure
- You need to understand the separation between backend, frontend, tests, documentation, and configuration

---

## Database Model

**File:** [`architecture/DATABASE_MODEL.md`](./architecture/DATABASE_MODEL.md)

### Purpose

The Database Model describes the project's data model and database design.

It provides the foundation for understanding how information such as users, documents, permissions, and other project data are represented.

### Read this when:

- Working on database-related code
- Creating or modifying models
- Working with permissions or ACL data
- Implementing retrieval that depends on database information

---

## Database Migrations (Async)

**File:** [`architecture/DATABASE_MIGRATIONS.md`](./architecture/DATABASE_MIGRATIONS.md)

### Purpose

How to change the database: SQLAlchemy 2.0 async + asyncpg + Alembic autogenerate with one driver, one URL, one Base. Companion to the Database Model (schema/what) — read this before adding a model, generating a migration, or touching authorization data.

### Read this when:

- Adding or changing a model
- Generating or reviewing a migration
- Wiring `AsyncSession` / `get_db` into an endpoint
- Writing seed data or migration tests
- Changing anything authorization-related in the DB

---

## Database Query Patterns

**File:** [`architecture/DATABASE_QUERIES.md`](./architecture/DATABASE_QUERIES.md)

### Purpose

How application code queries Supabase (Postgres) with SQLAlchemy 2.0 async: the `await db.execute(select(...))` pattern, sessions, transactions, eager loading, filters, pagination, and the `Principal` domain type behind permission resolution. Companion to the Migrations guide (schema changes) — read this before writing endpoint or service queries.

### Read this when:

- Writing a query in an endpoint, service, or test
- Choosing `scalar_one_or_none()` vs `scalars().all()`
- Grouping writes into one transaction with `flush()` / `rollback()`
- Loading relationships (`selectinload`) or joining ACL tables
- Working with `Principal` objects or authorization context

---

# 4. Security Documentation

The `security/` folder contains some of the **most important documentation in the project**.

The central security requirement is:

```text
R(u, q) ⊆ A(u)
```

Where:

- `R(u, q)` = chunks retrieved for user `u` and query `q`
- `A(u)` = chunks the user is authorized to access

This is the canonical definition used consistently across all docs as `R(u, q) ⊆ A(u)`.

In other words:

> The retrieval system must never retrieve information that the user is not authorized to access.

The security boundary must therefore exist **before information reaches the LLM**.

The intended flow is:

```text
User
  ↓
Authentication
  ↓
Permission Resolution
  ↓
SecureRetriever
  ↓
ACL-Filtered Retrieval
  ↓
RAG Pipeline
  ↓
LLM
  ↓
Response
```

---

## Permission-Aware Retrieval

**File:** [`security/PERMISSION_AWARE_RETRIEVAL.md`](./security/PERMISSION_AWARE_RETRIEVAL.md)

### Purpose

This document explains the project's core permission-aware retrieval design.

It focuses on ensuring that unauthorized information is filtered **during retrieval**, rather than relying on the LLM to ignore information it should not see.

### Read this when:

- Working on `SecureRetriever`
- Working on permissions or ACLs
- Working on vector or keyword retrieval
- Modifying retrieval queries
- Reviewing security-sensitive retrieval code
- You need to understand the project's primary security invariant

### Critical principle

```text
Authorization must constrain retrieval.
```

Not:

```text
Retrieve everything → give it to the LLM → ask the LLM to hide unauthorized information
```

---

## Calibrated Refusal

**File:** [`security/CALIBRATED_REFUSAL.md`](./security/CALIBRATED_REFUSAL.md)

### Purpose

This document explains how the system should respond when it cannot safely provide an answer.

The goal is to distinguish between situations such as:

- No information was found
- Information exists but is inaccessible
- The evidence is insufficient
- The system should refuse to answer

### Read this when:

- Working on refusal behavior
- Working on RAG response generation
- Designing error or uncertainty handling
- Creating tests for unauthorized or insufficient information

---

# 5. Retrieval Documentation

The `retrieval/` folder explains **how the system finds and validates information**.

---

## Retrieval Quality

**File:** [`retrieval/RETRIEVAL_QUALITY.md`](./retrieval/RETRIEVAL_QUALITY.md)

### Purpose

This document explains how retrieval quality is considered and evaluated.

It covers the retrieval process and the mechanisms used to improve the relevance of retrieved information.

### Read this when:

- Working on search
- Working on vector retrieval
- Working on BM25
- Working on RRF
- Working on reranking
- Evaluating whether retrieved chunks are useful

---

## Freshness & Staleness Detection

**File:** [`retrieval/FRESHNESS_STALENESS_DETECTION.md`](./retrieval/FRESHNESS_STALENESS_DETECTION.md)

### Purpose

This document explains how the system identifies potentially outdated information.

The system needs to consider not only:

> "Is this information relevant?"

but also:

> "Is this information current enough to use?"

### Read this when:

- Working on document metadata
- Working on freshness detection
- Working on staleness handling
- Working on RAG reliability
- Testing outdated information

---

## Conflict Detection

**File:** [`retrieval/CONFLICT_DETECTION.md`](./retrieval/CONFLICT_DETECTION.md)

### Purpose

This document explains how the system handles situations where retrieved sources contain conflicting information.

### Read this when:

- Working on multiple-source retrieval
- Working on evidence validation
- Working on conflicting documents
- Working on RAG reliability
- Designing tests involving contradictory information

---

# 6. Evaluation Documentation

The `evaluation/` folder explains **how the system is tested and measured**.

## Evaluation Harness

**File:** [`evaluation/EVALUATION_HARNESS.md`](./evaluation/EVALUATION_HARNESS.md)

### Purpose

The Evaluation Harness defines how the project evaluates system behavior.

It provides a structured way to test important properties of the system, including security and retrieval behavior.

### Read this when:

- Creating evaluation tests
- Adding regression tests
- Testing permission boundaries
- Measuring retrieval quality
- Working on evaluation CI
- Verifying that changes did not break existing behavior

---

# 7. Which Document Should I Read?

Use this quick guide:

| If you want to know...                    | Read                                                                               |
| ----------------------------------------- | ---------------------------------------------------------------------------------- |
| What are we building?                     | [`BUILD_PLAN.md`](./planning/BUILD_PLAN.md)                                        |
| What should we build first?               | [`BUILD_PLAN.md`](./planning/BUILD_PLAN.md)                                        |
| How does the team work?                   | [`SCRUM_GUIDE.md`](./planning/SCRUM_GUIDE.md)                                      |
| How is Taiga organized?                   | [`TAIGA_SETUP.md`](./planning/TAIGA_SETUP.md)                                      |
| How do I create a PR?                     | [`PULL_REQUEST_PROCESS.md`](./planning/PULL_REQUEST_PROCESS.md)                    |
| Where should a file/code go?              | [`REPOSITORY_STRUCTURE.md`](./architecture/REPOSITORY_STRUCTURE.md)                |
| How is the database organized?            | [`DATABASE_MODEL.md`](./architecture/DATABASE_MODEL.md)                            |
| How do I change the database?             | [`DATABASE_MIGRATIONS.md`](./architecture/DATABASE_MIGRATIONS.md)                      |
| How do I query the database?              | [`DATABASE_QUERIES.md`](./architecture/DATABASE_QUERIES.md)                            |
| How are permissions enforced?             | [`PERMISSION_AWARE_RETRIEVAL.md`](./security/PERMISSION_AWARE_RETRIEVAL.md)        |
| How should the system refuse an answer?   | [`CALIBRATED_REFUSAL.md`](./security/CALIBRATED_REFUSAL.md)                        |
| How does retrieval work?                  | [`RETRIEVAL_QUALITY.md`](./retrieval/RETRIEVAL_QUALITY.md)                         |
| How do we handle outdated information?    | [`FRESHNESS_STALENESS_DETECTION.md`](./retrieval/FRESHNESS_STALENESS_DETECTION.md) |
| How do we handle conflicting information? | [`CONFLICT_DETECTION.md`](./retrieval/CONFLICT_DETECTION.md)                       |
| How do we evaluate the system?            | [`EVALUATION_HARNESS.md`](./evaluation/EVALUATION_HARNESS.md)                      |

---

# 8. Recommended Reading by Role

## New Team Member

Read:

```text
1. BUILD_PLAN.md
2. REPOSITORY_STRUCTURE.md
3. SCRUM_GUIDE.md
4. TAIGA_SETUP.md
5. PERMISSION_AWARE_RETRIEVAL.md
```

Then read the documents related to the area you are working on.

---

## Backend Developer

Recommended:

```text
BUILD_PLAN
    ↓
REPOSITORY_STRUCTURE
    ↓
DATABASE_MODEL
    ↓
DATABASE_MIGRATIONS
    ↓
DATABASE_QUERIES
    ↓
PERMISSION_AWARE_RETRIEVAL
    ↓
RETRIEVAL_QUALITY
    ↓
FRESHNESS_STALENESS_DETECTION
    ↓
CONFLICT_DETECTION
    ↓
EVALUATION_HARNESS
```

---

## Frontend Developer

Recommended:

```text
BUILD_PLAN
    ↓
REPOSITORY_STRUCTURE
    ↓
SCRUM_GUIDE
    ↓
TAIGA_SETUP
    ↓
PULL_REQUEST_PROCESS
```

Then read the security documentation when the frontend interacts with authentication, permissions, retrieval, or API behavior.

---

## Reviewer

Before reviewing a security-sensitive change:

```text
PULL_REQUEST_PROCESS
        ↓
PERMISSION_AWARE_RETRIEVAL
        ↓
CALIBRATED_REFUSAL
        ↓
RELEVANT RETRIEVAL DOCUMENT
        ↓
EVALUATION_HARNESS
```

The reviewer should understand the security invariant before approving changes that affect the retrieval path.

---

# 9. How the Documents Fit Together

These documents are not independent notes. They form a connected project system.

```text
                    PROJECT PLAN
                         │
                         ▼
                  BUILD_PLAN.md
                         │
          ┌──────────────┴──────────────┐
          ▼                             ▼
    SCRUM_GUIDE.md                TAIGA_SETUP.md
          │                             │
          └──────────────┬──────────────┘
                         ▼
                  DEVELOPMENT WORK
                         │
                         ▼
             REPOSITORY_STRUCTURE.md
                         │
                         ▼
                   IMPLEMENTATION
                         │
          ┌──────────────┴──────────────┐
          ▼                             ▼
     SECURITY                       RETRIEVAL
          │                             │
          ▼                             ▼
PERMISSION_AWARE_RETRIEVAL      RETRIEVAL_QUALITY
          │                             │
          ▼                             ├── FRESHNESS_STALENESS_DETECTION
CALIBRATED_REFUSAL                    │
          │                             └── CONFLICT_DETECTION
          │
          └──────────────┬──────────────┘
                         ▼
                 EVALUATION_HARNESS
                         │
                         ▼
                    TEST / CI
                         │
                         ▼
                PULL_REQUEST_PROCESS
```

---

# 10. When You Are Working on a Task

Before starting a task:

### Step 1 — Find the Taiga Story

Identify the story and understand its acceptance criteria.

### Step 2 — Check the Build Plan

Open [`BUILD_PLAN.md`](./planning/BUILD_PLAN.md) to understand where the task fits in the overall implementation sequence.

### Step 3 — Check the Architecture

Open [`REPOSITORY_STRUCTURE.md`](./architecture/REPOSITORY_STRUCTURE.md) to determine where the implementation belongs.

If the task involves data, also check [`DATABASE_MODEL.md`](./architecture/DATABASE_MODEL.md).

### Step 4 — Check Security Requirements

If the task touches:

- Authentication
- Authorization
- ACLs
- Retrieval
- Documents
- Search
- RAG
- LLM input
- Refusal behavior

read the relevant security documentation before implementing it.

### Step 5 — Implement

Make the smallest change necessary to satisfy the story.

### Step 6 — Test

Use the appropriate tests and evaluation procedures described in [`EVALUATION_HARNESS.md`](./evaluation/EVALUATION_HARNESS.md).

### Step 7 — Create a Pull Request

Follow [`PULL_REQUEST_PROCESS.md`](./planning/PULL_REQUEST_PROCESS.md).

### Step 8 — Update Taiga

Make sure the GitHub work remains traceable to the corresponding Taiga story/task.

---

# 11. Documentation Rules

When adding new project documentation:

1. Put it in the appropriate `docs/` category.
2. Use a clear descriptive filename.
3. Use Markdown.
4. Update this `START_HERE.md` file if the new document is important enough for team members to discover.
5. Link related documents together.
6. Avoid duplicating information that already exists elsewhere.
7. Keep implementation details in the code when they do not belong in project documentation.

---

# 12. Quick Navigation

### Planning

- [Build Plan](./planning/BUILD_PLAN.md)
- [Scrum Guide](./planning/SCRUM_GUIDE.md)
- [Taiga Setup](./planning/TAIGA_SETUP.md)
- [Pull Request Process](./planning/PULL_REQUEST_PROCESS.md)

### Architecture

- [Repository Structure](./architecture/REPOSITORY_STRUCTURE.md)
- [Database Model](./architecture/DATABASE_MODEL.md)
- [Database Migrations (Async)](./architecture/DATABASE_MIGRATIONS.md)
- [Database Query Patterns](./architecture/DATABASE_QUERIES.md)

### Security

- [Permission-Aware Retrieval](./security/PERMISSION_AWARE_RETRIEVAL.md)
- [Calibrated Refusal](./security/CALIBRATED_REFUSAL.md)

### Retrieval

- [Retrieval Quality](./retrieval/RETRIEVAL_QUALITY.md)
- [Freshness & Staleness Detection](./retrieval/FRESHNESS_STALENESS_DETECTION.md)
- [Conflict Detection](./retrieval/CONFLICT_DETECTION.md)

### Evaluation

- [Evaluation Harness](./evaluation/EVALUATION_HARNESS.md)

### Research

- [Hosting Options](./research/hosting-options.md)
- [CI Docker-Build Gate](./research/ci-docker-build.md)

---

# 13. Final Principle

The documentation should help the team answer four questions:

```text
WHAT are we building?
        ↓
BUILD_PLAN

HOW do we organize and execute the work?
        ↓
SCRUM + TAIGA + PR PROCESS

HOW does the system work?
        ↓
ARCHITECTURE + SECURITY + RETRIEVAL

HOW do we know it works?
        ↓
EVALUATION
```

If you are unsure where to begin, **start with `BUILD_PLAN.md`**, then use this file to navigate to the documentation relevant to your task.
