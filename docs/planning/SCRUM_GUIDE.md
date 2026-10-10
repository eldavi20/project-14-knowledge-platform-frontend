# Scrum Guide - Permission-Aware Knowledge Agent

**Project:** SER 401 - Project 14: Permission-Aware Knowledge Agent  
**Date:** October 10th, 2026 (Last Modified)
**Purpose:** How the team uses Taiga and Scrum to plan, track, and deliver work across the 8-week build.

---

## 1. Why We Use Scrum

Scrum gives us:

1. **Structure** — A clear rhythm of planning, working, and reviewing
2. **Visibility** — The professor and sponsor can see our progress
3. **Traceability** — Every PR links to a user story, every story links to a sprint
4. **Adaptability** — We adjust scope every 2 weeks based on what we learned
5. **Grading evidence** — Sprint notes, burndown charts, and individual ownership are all visible

Our project is complex and has several uncertain areas (permissions, refusal logic, retrieval quality). Scrum lets us tackle those incrementally rather than in one giant push.

---

## 2. The Taiga Hierarchy

Taiga organizes work in this hierarchy:

```text
Project → Epics → User Stories → Tasks → Issues
```

| Level            | What It Is               | Example                                                |
| ---------------- | ------------------------ | ------------------------------------------------------ |
| **Project**      | The entire effort        | Permission-Aware Knowledge Agent                       |
| **Epic**         | A large feature area     | Authentication                                         |
| **User Story**   | A user-facing capability | As a user, I want to log in so I can access the system |
| **Task**         | A concrete piece of work | Create `POST /api/auth/login` endpoint                 |
| **Issue**        | A bug or problem         | Unauthorized document access                           |
| **Backlog**      | All planned work         | Everything not yet in a sprint                         |
| **Sprint**       | A time-boxed work period | Sprint 1 (2 weeks)                                     |
| **Kanban Board** | Visual workflow          | TODO → In Progress → Review → Done                     |

---

## 3. The Project Structure in Taiga

Here is how the project is organized:

```text
PROJECT: Permission-Aware Knowledge Agent

├── EPIC: Authentication
│   ├── Story: User login
│   │   ├── Task: Create login endpoint
│   │   ├── Task: Validate credentials
│   │   └── Task: Add authentication tests
│   └── Story: User session management
│
├── EPIC: Documents & ACL
│   ├── Story: Store documents with ACLs
│   ├── Story: Resolve user principals
│   └── Story: View document ACLs in Admin UI
│
├── EPIC: Secure Retrieval
│   ├── Story: Filter retrieval by permissions
│   │   ├── Task: Build SecureRetriever
│   │   ├── Task: Enforce ACL filter
│   │   └── Task: Write permission-leakage test
│   └── Story: Fail closed on permission errors
│
├── EPIC: Ingestion
│   ├── Story: Ingest from mock source
│   ├── Story: Translate source ACLs
│   └── Story: Sync permission changes
│
├── EPIC: RAG Pipeline
│   ├── Story: Retrieve and answer questions
│   ├── Story: Hybrid search (BM25 + vector)
│   ├── Story: Rerank candidates
│   └── Story: Citation verification
│
├── EPIC: Reliability
│   ├── Story: Refuse when evidence is insufficient
│   ├── Story: Flag stale sources
│   └── Story: Detect conflicting sources
│
├── EPIC: Evaluation
│   ├── Story: Golden dataset
│   ├── Story: Metrics engine
│   └── Story: CI security gates
│
└── EPIC: Frontend
    ├── Story: Login page
    ├── Story: Chat interface
    ├── Story: Admin dashboard
    └── Story: User switcher
```

---

## 4. The Epic Definitions

| Epic                 | Purpose                             | Weeks |
| -------------------- | ----------------------------------- | ----: |
| **Authentication**   | Users can log in and receive a Supabase session |     1 |
| **Documents & ACL**  | Documents exist with permissions    |     2 |
| **Secure Retrieval** | ★ Permissions enforced at retrieval |     3 |
| **Ingestion**        | Documents flow from sources         |     4 |
| **RAG Pipeline**     | System answers questions            |     5 |
| **Reliability**      | Freshness + Conflict warnings       |     6 |
| **Evaluation**       | Metrics + CI gates                  |     7 |
| **Frontend**         | UI across all phases                |   1–8 |

---

## 5. The User Story Format

Every user story uses this format:

```text
As a <role>, I want <capability>, so that <benefit>.
```

### Examples

```text
As an employee, I want to ask a question in plain language
so that I can find information without searching manually.

As a security admin, I want to verify that retrieval respects permissions
so that no unauthorized data reaches the LLM.

As an intern, I want clear refusals when I lack access
so that I know the system isn't hiding information.

As a developer, I want the retrieval pipeline to fail closed
so that a permission error never results in a leak.
```

### Acceptance Criteria

Every user story also has acceptance criteria.

Example:

```text
Story: Filter retrieval by permissions

Acceptance Criteria:
- Given a user with role "intern"
- When they query "What is the CEO's salary?"
- Then no HR or executive chunks are returned
- And the response indicates the user does not have access
- And the audit log records the query with reason "permission_blocked"
```

---

## 6. The Story States

Every story moves through these states:

```text
NEW → READY → IN PROGRESS → READY FOR TEST → DONE
```

| State              | Meaning                                         |
| ------------------ | ----------------------------------------------- |
| **New**            | Just created, not yet refined                   |
| **Ready**          | Refined, estimated, ready to pull into a sprint |
| **In Progress**    | Actively being worked on                        |
| **Ready for Test** | Code written, awaiting test / review            |
| **Done**           | Reviewed, tested, merged                        |
| **Archived**       | Removed (with reason)                           |

**Rule:** Only stories in **Ready** can be pulled into a sprint.

---

## 7. The Task Format

Tasks are the concrete work items under a story.

| Task                                   | Owner     | Estimated Hours |
| -------------------------------------- | --------- | --------------: |
| Initialize Next.js project structure | Elliot      |               2 |
| Build responsive Next.js login page with form validation                  | Troy      |               4 |
| Create Supabase authentication client helper in `src/lib/api.ts`           | Ahmed     |               3 |
| Create protected route wrapper component to handle unauthenticated redirection           | Oleksandr |               2 |

### Rules

- Every task has one owner.
- Every task has an hour estimate.
- Tasks should be completable in 1–2 days.

---

## 8. The Sprint Structure

We use **2-week sprints**.

### Sprint Cadence

| Day              | Activity                                           |
| ---------------- | -------------------------------------------------- |
| **Day 1 (Mon)**  | Sprint planning — select stories, break into tasks |
| **Day 2–9**      | Development — async standups Tue/Sat               |
| **Day 10 (Fri)** | Sprint review — demo what works                    |
| **Day 11 (Fri)** | Sprint retrospective — what worked, what didn't    |

### Sprint Contents

Each sprint selects **3–6 user stories** from the backlog.

### Sprint 1 — Example (Week 1–2)

| Story                     | Owner     | Points |
| ------------------------- | --------- | -----: |
| User login                | Lana      |      5 |
| User session management   | Troy      |      3 |
| Store documents with ACLs | Oleksandr |      5 |
| Resolve user principals   | Ahmed     |      3 |
| Login page                | All       |      3 |
| **Total**                 |           | **19** |

**Rule:** Do not exceed the team's estimated velocity. Adjust after each sprint.

---

## 9. The Sprint Ceremonies

### Sprint Planning

**When:** Day 1 of each sprint  
**Duration:** 45–60 minutes  
**Attendees:** All 5 team members

#### Agenda

1. Review sprint goal
2. Review backlog
3. Select stories for the sprint
4. Break each story into tasks
5. Assign task owners
6. Estimate hours per task

**Output:** Sprint backlog with tasks and owners.

---

### Async Standup

**When:** Tuesdays and Saturdays  
**Format:** Posted in Discord, not a live meeting

#### Template

```text
Async Standup — [Date]

@Lana
✅ Completed: SecureRetriever class
🔨 Working on: ACL filter builder
🚧 Blockers: None

@Troy
✅ Completed: Supabase token validation
🔨 Working on: Login endpoint
🚧 Blockers: Need database migration ready

@Ahmed
✅ Completed: Database schema
🔨 Working on: Seed data
🚧 Blockers: None
```

**Rule:** Post by end of day in your time zone.

---

### Sprint Review

**When:** Last day of sprint  
**Duration:** 30 minutes  
**Attendees:** Team + optionally sponsor

#### Agenda

1. Demo each completed story
2. Show what works in the browser
3. Note any stories that didn't finish
4. Update backlog with new findings

**Output:** Sprint summary posted in Discord.

---

### Sprint Retrospective

**When:** Last day of sprint  
**Duration:** 30 minutes  
**Attendees:** Team only

#### Format

```text
What went well?
- Async standups kept us aligned
- Security tests caught a leak early

What didn't go well?
- Underestimated the ACL projection complexity
- Missed 2 standups due to time zones

What will we improve?
- Break ACL work into smaller tasks
- Rotate standup times
```

**Output:** Retrospective notes saved in Google Drive.

---

## 10. The Kanban Board

Inside each sprint, work moves through the same five states defined in Section 6:

```text
NEW → READY → IN PROGRESS → READY FOR TEST → DONE
```

### Rules

- Max **2 items per person** in "In Progress".
- Every item in "Ready for Test" has a linked PR.
- "Done" means merged to `main` and tested.

---

## 11. The Issue Format

Issues are for bugs, blockers, or problems.

### Example Issue

```text
Issue: Unauthorized document access

Type: Bug
Priority: Critical
Assigned: Lana
Related Story: US-42 (Filter retrieval by permissions)

Description:
An intern user was able to retrieve an HR document
through the BM25 path. The vector path correctly
filtered but BM25 was not applying the ACL filter.

Steps to Reproduce:
1. Log in as intern
2. Query "What is the CEO's salary?"
3. Observe HR chunks in the response

Expected: No HR chunks returned
Actual: 2 HR chunks returned

Fix:
Apply ACL filter to BM25 index queries.
Add regression test to test_acl_invariant_stages.py.
```

### Rules

- Every bug has a severity: Critical, High, Medium, Low.
- Critical bugs are fixed within 24 hours.
- Every fix references the issue number in the commit.

---

## 12. Story Points

We use a simplified Fibonacci scale:

| Points | Meaning                          |
| -----: | -------------------------------- |
|      1 | Trivial (an hour or less)        |
|      2 | Simple (half a day)              |
|      3 | Moderate (1 day)                 |
|      5 | Complex (2–3 days)               |
|      8 | Large (a week) — should be split |
|     13 | Too large — must be split        |

**Rule:** Stories over 8 points must be split before entering a sprint.

---

## 13. The Sprint Map (8 Weeks)

| Sprint       | Weeks | Focus                        | Key Stories                                     |
| ------------ | ----- | ---------------------------- | ----------------------------------------------- |
| **Sprint 1** | 1–2   | Foundation + Auth + ACL      | Login, session, documents, principals           |
| **Sprint 2** | 3–4   | Secure Retrieval + Ingestion | SecureRetriever, ACL filter, mock ingestion     |
| **Sprint 3** | 5–6   | RAG + Reliability            | Retrieval, hybrid, refusal, freshness, conflict |
| **Sprint 4** | 7–8   | Evaluation + Delivery        | Golden dataset, CI gates, admin UI, demo        |

**Rule:** Each sprint produces something demoable.

---

## 14. The Traceability Chain

Every piece of work traces back to a user story:

```text
Taiga User Story: US-11 + Task T-11.5
        ↓
GitHub Issue: #11 (mirrors US-11)
        ↓
Branch: security/us-11-t-11.5-acl-filter
        ↓
PR: security(retriever): [US-11][T-11.5] enforce ACL filter (#11)
        ↓
Commit: security(retriever): enforce ACL filter / Refs: US-11, T-11.5, #11
        ↓
Merged to main
```

This makes grading individual contribution easy for the professor.

---

## 15. The Taiga Board Setup

See [`TAIGA_SETUP.md`](./TAIGA_SETUP.md) for the canonical project setup: epics, user stories US-1–US-27, tasks, dependencies, sprint assignments, Kanban workflow, and traceability.

Do not duplicate that structure here — this guide defines the Scrum process, `TAIGA_SETUP.md` defines how this project applies it.

---

## 16. The Weekly Cadence

| Day                    | Activity                                              |
| ---------------------- | ----------------------------------------------------- |
| **Monday**             | Sprint planning (if sprint starts)                    |
| **Tuesday**            | Async standup in Discord                              |
| **Wednesday**          | —                                                     |
| **Thursday**           | —                                                     |
| **Friday**             | Sponsor meeting (as scheduled)                        |
| **Saturday 3:30 PM ET**| Weekly team meeting (review, planning, retro as scheduled) |

**Rule:** Sponsor meeting minutes submitted to Canvas the week of the meeting.

---

## 17. What NOT to Do

| Anti-Pattern                        | Why It Fails                      |
| ----------------------------------- | --------------------------------- |
| Stories without acceptance criteria | Can't tell when it's done         |
| Tasks without owners                | No accountability                 |
| Stories over 8 points               | Too large to complete in a sprint |
| Skipping standups                   | Team loses visibility             |
| No sprint retrospective             | Same problems repeat              |
| No Taiga → GitHub link              | No traceability for grading       |
| Big-bang sprints (10+ stories)      | Guaranteed to miss targets        |
| No burndown chart                   | Can't see if we're on track       |

---

## 18. Scrum + Security for This Project

The Scrum process is specifically structured so the project's security boundary is visible throughout development.

The security-related work is not postponed until the final sprint:

```text
Sprint 1
Foundation → Authentication → Documents + ACL
                         ↓
Sprint 2
              Secure Retrieval
                         ↓
Sprint 3
              RAG + Reliability
                         ↓
Sprint 4
              Evaluation + CI Security Gates
```

The **Secure Retrieval** epic is the critical transition point. Once it is implemented, tested, and tracked through Taiga, later RAG and retrieval-quality work builds on an established authorization boundary.

For every story that can affect permissions or retrieval, the team should maintain traceability through:

```text
Taiga Story
    ↓
GitHub Issue
    ↓
Branch
    ↓
PR
    ↓
Security Tests
    ↓
Merge
```

---

## Final Scrum Principle

The team uses Scrum not simply as a meeting schedule, but as a way to make the 8-week engineering process visible and traceable.

The working model is:

```text
Backlog
   ↓
Sprint Planning
   ↓
User Stories
   ↓
Tasks + Owners
   ↓
Development
   ↓
PR + Review
   ↓
Testing
   ↓
Sprint Review
   ↓
Retrospective
   ↓
Updated Backlog
   ↓
Next Sprint
```

Every sprint should produce something demonstrable, every task should have clear ownership, and every significant code change should trace back to a user story.

For this project, Scrum also provides a way to continuously expose and validate the security work rather than treating authorization as a final-stage feature.
