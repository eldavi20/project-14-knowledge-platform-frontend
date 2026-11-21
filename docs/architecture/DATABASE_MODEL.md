# Database Model — Permission-Aware Knowledge Agent

**Project:** SER 401 – Project 14: Permission-Aware Knowledge Agent  
**Date:** October 28th, 2026 (Last Modified)

**Purpose:** Complete database schema and data model for the system, covering both Supabase (Postgres source of truth, Auth for identity) and the vector database (searchable projection).

## Implementation status (October 2026)

This document contains the **target data model**, not a description of tables
all present in the database. The current ORM metadata and initial Alembic
revision implement only `users`, `profiles`, `groups`, and `user_groups`.
Supabase owns `auth.users`; the app maps its UUID to the integer `users.id`
through `profiles`. The signup endpoint creates the app-side `users` and
`profiles` rows explicitly; there is no database trigger for that provisioning.

The later `documents`, ACL, projection, chunk, and audit designs in this
document are proposed and have no corresponding current ORM models or
migrations. Retrieval and vector database components are also not implemented.
Use §§2.1–2.4 and the migration history as the source of truth when changing
the running backend.

---

## 1. Architecture Overview

The system uses two databases with distinct responsibilities.

| Database       | Role                          | Contains                                           |
| -------------- | ----------------------------- | -------------------------------------------------- |
| **Supabase (Postgres)** | Source of truth | Identity mirror, documents, ACLs, projections, audit logs |
| **Vector DB**  | Derived searchable projection | Chunks, embeddings, retrieval metadata             |

### Core Principle

> **Supabase is authoritative. The vector DB is a projection that can be rebuilt from Supabase at any time.**

If the vector DB becomes corrupted or stale, Supabase remains the authority.

This separation is especially important for permission-aware retrieval: authorization data originates from Supabase, while the vector database contains the searchable representation needed for efficient retrieval.

Connect via the Supabase-provided connection string (`SUPABASE_DB_URL`, asyncpg driver) — see [`DATABASE_MIGRATIONS.md`](./DATABASE_MIGRATIONS.md) §5.

---

# 2. Supabase Schema

## 2.1 `users`

App-level identity mirror. Credentials and sessions are owned by Supabase Auth (`auth.users`); this table holds the stable app identity that ACL relationships reference.

| Attribute       | Type                | Description                                                     |
| --------------- | ------------------- | --------------------------------------------------------------- |
| `id`            | BIGSERIAL (PK)      | Immutable unique identifier                                     |
| `username`      | VARCHAR(64) UNIQUE  | Optional app-side username; authentication currently uses email |
| `email`         | VARCHAR(255) UNIQUE | Contact email copied from Supabase Auth at signup              |
| `full_name`     | VARCHAR(255)        | Display name                                                    |
| `department`    | VARCHAR(64)         | Organizational department, e.g. `engineering`                   |
| `access_level`  | VARCHAR(32)         | User's highest access tier, e.g. `employee`, `manager`, `admin` |
| `is_active`     | BOOLEAN             | Whether the account is enabled                                  |
| `created_at`    | TIMESTAMP           | Account creation time                                           |
| `updated_at`    | TIMESTAMP           | Last update to this app-side user row                           |

> No `password_hash` column — Supabase Auth owns credentials. Never store passwords in app tables.

### Design Notes

The immutable `id` is the identity used by ACL relationships. Usernames and other display attributes can change without changing permission references.

## 2.2 `profiles`

Links a Supabase `auth.users` identity to the app-side user and stores
app-specific profile fields. The signup API creates the row after it creates
the corresponding `users` record.

| Attribute       | Type                     | Description                                                      |
| --------------- | ------------------------ | ---------------------------------------------------------------- |
| `id`            | UUID (PK)                | Mirrors `auth.users.id` — the Supabase identity                  |
| `user_id`       | BIGINT UNIQUE (FK → `users.id`) | Links the Supabase identity to the app identity            |
| `department`    | VARCHAR(64)              | Organizational department, e.g. `engineering`                    |
| `access_level`  | VARCHAR(32)              | User's highest access tier, e.g. `employee`, `manager`, `admin`  |
| `full_name`     | VARCHAR(255)             | Display name                                                     |
| `is_active`     | BOOLEAN                  | Whether the account is enabled                                   |
| `created_at`    | TIMESTAMP                | Profile creation time                                            |
| `updated_at`    | TIMESTAMP                | Last profile update time                                         |

### Design Notes

`profiles` is the sync seam between Supabase Auth and the app: `profiles.id` is the Supabase identity, `profiles.user_id` is the app identity used by `user_groups` and `document_acls`. ACL principals keep referencing immutable `users.id` (`user:<id>`), so the ACL model is unchanged.

---

## 2.3 `groups`

Stores all groups used for ACL principals.

| Attribute     | Type               | Description                                      |
| ------------- | ------------------ | ------------------------------------------------ |
| `id`          | BIGSERIAL (PK)     | Immutable unique identifier                      |
| `name`        | VARCHAR(64) UNIQUE | Group name, e.g. `engineering`, `hr`, `managers` |
| `description` | TEXT               | Purpose of the group                             |
| `is_active`   | BOOLEAN            | Whether the group is currently in use            |
| `created_at`  | TIMESTAMP          | Group creation time                              |

---

## 2.4 `user_groups`

Membership table between users and groups.

| Attribute       | Type                      | Description                    |
| --------------- | ------------------------- | ------------------------------ |
| `user_id`       | BIGINT (FK → `users.id`)  | User in the membership         |
| `group_id`      | BIGINT (FK → `groups.id`) | Group in the membership        |
| `joined_at`     | TIMESTAMP                 | When the user joined the group |
| **PRIMARY KEY** | (`user_id`, `group_id`)   | Composite primary key          |

This table allows a user to inherit access through group membership.

Example:

```text
User
  Lana
    ↓
user_groups
    ↓
engineering
    ↓
document_acls
    ↓
Engineering documentation
```

---

# 3. Document and Permission Model

## 3.1 `documents`

Stores metadata for every ingested document.

| Attribute                | Type                                   | Description                                                                |
| ------------------------ | -------------------------------------- | -------------------------------------------------------------------------- |
| `id`                     | UUID (PK)                         | Immutable unique identifier                                                |
| `source`                 | VARCHAR(64)                            | Source system, e.g. `google_drive`, `discord`                  |
| `source_id`              | VARCHAR(255)                           | Original document ID in the source                                         |
| `title`                  | VARCHAR(512)                           | Document title                                                             |
| `source_type`            | VARCHAR(32)                            | Type of source: `policy`, `handbook`, `discord`, `email`, `drive`       |
| `authority_level`        | VARCHAR(32)                            | `official`, `authoritative`, `informational`, `unknown`                    |
| `document_status`        | VARCHAR(32)                            | `active`, `draft`, `superseded`, `archived`                                |
| `supersedes_document_id` | UUID (FK → `documents.id`, nullable) | If this document explicitly supersedes another                             |
| `classification`         | VARCHAR(32)                            | `public`, `internal`, `confidential`, `restricted`                         |
| `content_type`           | VARCHAR(64)                            | `hr_policy`, `engineering_doc`, `financial_report`, `legal_contract`, etc. |
| `created_at`             | TIMESTAMP                              | When the source content was first created                                  |
| `updated_at`             | TIMESTAMP                              | When the source content last changed                                       |
| `source_synced_at`       | TIMESTAMP                              | When the system last pulled this document from the source                  |
| `metadata_version`       | BIGINT                                 | Incremented on any ACL/metadata change; used for projection sync           |
| **UNIQUE**               | (`source`, `source_id`)                | One record per source document                                             |

### Important Timestamp Distinction

The model intentionally stores both:

- `updated_at` — when the source document changed
- `source_synced_at` — when the system last synchronized the document

These timestamps support freshness and projection-health checks.

---

## 3.2 `document_acls`

ACL entries specify which users and groups can access each document.

| Attribute        | Type                                                              | Description                                      |
| ---------------- | ----------------------------------------------------------------- | ------------------------------------------------ |
| `id`             | UUID (PK)                                                         | Immutable unique identifier                      |
| `document_id`    | UUID (FK → `documents.id`, `ON DELETE CASCADE`)                   | Document this ACL applies to                     |
| `user_id`        | BIGINT (FK → `users.id`, `ON DELETE CASCADE`, nullable)           | Targeted user principal, if this is a user ACL   |
| `group_id`       | BIGINT (FK → `groups.id`, `ON DELETE CASCADE`, nullable)          | Targeted group principal, if this is a group ACL |
| `permission`     | VARCHAR(32)                                                       | Permission level; defaults to `read`             |
| `created_at`     | TIMESTAMP                                                         | When this ACL entry was created                  |
| **UNIQUE**       | (`document_id`, `user_id`), (`document_id`, `group_id`)           | Prevent duplicate user/group ACL entries         |
| **CHECK**        | (`user_id IS NOT NULL AND group_id IS NULL`) `OR` (`user_id IS NULL AND group_id IS NOT NULL`) | Ensures exactly one principal target is set |

### Critical Design Decision

`document_acls` uses explicit foreign key columns (`user_id` and `group_id`).

This architecture guarantees:
- Database-level referential integrity
    - Natively enforced foreign key constraints to both `users.id` and `groups.id`.
- Cascading deletes
    - Deleting a user, group, or document automatically cleans up related ACL records without requiring application triggers.
- Type-safe ORM mapping
    - Direct SQLAlchemy relationship back-populates across models.

---

## 3.3 `document_projections`

Tracks synchronization state for each document's vector database projection.

| Attribute            | Type                                                    | Description                                            |
| -------------------- | ------------------------------------------------------- | ------------------------------------------------------ |
| `document_id`        | UUID (PK, FK → `documents.id`, `ON DELETE CASCADE`)                        | Document being projected                               |
| `projection_version` | BIGINT                                                  | Matches `documents.metadata_version` when synchronized |
| `projected_at`       | TIMESTAMP                                               | When the last successful projection occurred           |
| `projection_status`  | VARCHAR(32)                                             | `CURRENT`, `PENDING`, `FAILED`                         |
| `last_error`         | TEXT (nullable)                                         | Error message if status is `FAILED`                    |
| **CHECK**            | `projection_status IN ('CURRENT', 'PENDING', 'FAILED')` | Constrain status                                       |

### Projection Invariant

A projection is current when:

```text
projection_version == metadata_version
```

If:

```text
projection_version < metadata_version
```

the vector DB projection is stale relative to Supabase metadata.

---

# 4. Audit Model

## 4.1 `audit_events`

Records every query request and its retrieval trace.

| Attribute                  | Type                     | Description                                                                                                   |
| -------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `id`                       | BIGSERIAL (PK)           | Immutable unique identifier                                                                                   |
| `request_id`               | UUID                     | Correlates all log entries for one request                                                                    |
| `user_id`                  | BIGINT (FK → `users.id`) | User who made the request                                                                                     |
| `timestamp`                | TIMESTAMP                | When the request was made                                                                                     |
| `query_hash`               | VARCHAR(64)              | SHA-256 hash of the query; raw text is not stored                                                             |
| `query_classification`     | VARCHAR(32)              | `answered`, `refused`, `blocked`                                                                              |
| `refusal_reason`           | VARCHAR(64)              | `NO_EVIDENCE`, `LOW_EVIDENCE`, `PERMISSION_BLOCKED`, `OUT_OF_SCOPE`, `STALE_EVIDENCE`, `CONFLICTING_EVIDENCE` |
| `retrieval_policy_version` | VARCHAR(32)              | Version of the retrieval policy used                                                                          |
| `vector_candidate_ids`     | JSONB                    | Chunk IDs from vector search                                                                                  |
| `bm25_candidate_ids`       | JSONB                    | Chunk IDs from BM25 search                                                                                    |
| `rrf_candidate_ids`        | JSONB                    | Chunk IDs after RRF fusion                                                                                    |
| `reranked_chunk_ids`       | JSONB                    | Chunk IDs after reranking                                                                                     |
| `context_chunk_ids`        | JSONB                    | Chunk IDs passed to the LLM                                                                                   |
| `authorization_decision`   | VARCHAR(32)              | `allowed`, `blocked`, `failed_closed`                                                                         |
| `conflict_detected`        | BOOLEAN                  | Whether a conflict was detected                                                                               |
| `freshness_warnings`       | JSONB                    | Freshness warnings attached to the response                                                                   |
| `conflict_metadata`        | JSONB                    | Conflict details, if any                                                                                      |
| `model_used`               | VARCHAR(64)              | LLM model used                                                                                                |
| `response_id`              | UUID                     | Correlates with the answer returned                                                                           |
| `latency_ms`               | INTEGER                  | End-to-end latency                                                                                            |

### Why Stage-Level IDs Matter

The evaluation harness can verify the authorization invariant at every stage instead of only checking the final answer.

For example:

```text
vector candidates
      ↓
BM25 candidates
      ↓
RRF candidates
      ↓
reranked chunks
      ↓
LLM context
```

Each set can be audited independently.

---

# 5. Vector Database Schema

## 5.1 `chunks`

The vector database contains one record per chunk.

This is a **derived projection** from Supabase.

| Attribute            | Type          | Description                                             |
| -------------------- | ------------- | ------------------------------------------------------- |
| `id`                 | STRING (PK)   | Unique chunk identifier, e.g. `chunk-4521-003`          |
| `document_id`        | STRING / UUID        | Links back to Supabase `documents.id` (UUID as string)                 |
| `chunk_index`        | INTEGER       | Position of chunk within the document                   |
| `content`            | TEXT          | Actual chunk text                                       |
| `embedding`          | VECTOR        | Embedding managed by vector DB                          |
| `acl_principals`     | ARRAY[STRING] | Flattened principals, e.g. `["user:123", "group:17"]`   |
| `classification`     | VARCHAR(32)   | Mirrors `documents.classification`                      |
| `authority_level`    | VARCHAR(32)   | Mirrors `documents.authority_level`                     |
| `document_status`    | VARCHAR(32)   | Mirrors `documents.document_status`                     |
| `content_type`       | VARCHAR(64)   | Mirrors `documents.content_type`                        |
| `updated_at`         | TIMESTAMP     | Mirrors `documents.updated_at`                          |
| `source_synced_at`   | TIMESTAMP     | Mirrors `documents.source_synced_at`                    |
| `source`             | VARCHAR(64)   | Mirrors `documents.source`                              |
| `source_id`          | VARCHAR(255)  | Mirrors `documents.source_id`                           |
| `title`              | VARCHAR(512)  | Mirrors `documents.title`                               |
| `section_id`         | VARCHAR(64)   | Section identifier, if structured                       |
| `heading`            | VARCHAR(512)  | Section heading, if structured                          |
| `projection_version` | BIGINT        | Mirrors `documents.metadata_version` at projection time |

### Projection Rule

The vector DB should contain enough metadata to perform authorized retrieval without becoming the authority for permissions.

Conceptually:

```text
Supabase
    ↓
Projection Worker
    ↓
Vector DB
    ↓
SecureRetriever
```

---

# 6. ACL Projection Logic

## 6.1 Immutable ID Construction

`document_acls` references immutable user and group foreign keys (`user_id` / `group_id`). The vector projection formats these into uniform string principals (`user:<id>` / `group:<id>`) for filtering.

---

## 6.2 Projection Function

```python
async def build_acl_principals(db: AsyncSession, document_id: uuid.UUID) -> list[str]:
    """
    Convert document_acls rows into a flattened principals list
    using explicit foreign keys (user_id / group_id).
    Returns the string form for the vector projection.
    """
    result = await db.execute(
        select(DocumentACL).where(DocumentACL.document_id == document_id)
    )
    rows = result.scalars().all()

    principals = []

    for row in rows:
        if row.user_id is not None:
            principals.append(f"user:{row.user_id}")
        elif row.group_id is not None:
            principals.append(f"group:{row.group_id}")

    return principals
```

The resulting array is copied into the vector projection (`acl_principals`).
The implementation is `app/services/sync/projection.py::build_acl_principals`.
It returns an empty list when a document has no ACL rows and raises an error if
an ACL row targets both or neither a user and a group.

---

## 6.3 Query-Time Principal Resolution

`Principal` is the domain type for a (type, id) pair, defined in `app/core/permission_service.py` (see [`DATABASE_QUERIES.md`](./DATABASE_QUERIES.md) §12). Its string form (`str(p)` → `"user:123"`) is what the vector projection stores in `acl_principals`.

```python
async def resolve_effective_principals(db: AsyncSession, user_id: int) -> list[Principal]:
    """
    Return the principals a user effectively belongs to.
    """
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise AuthorizationError(f"Unknown user {user_id}")

    result = await db.execute(
        select(Group.id)
        .join(UserGroup, UserGroup.group_id == Group.id)
        .where(UserGroup.user_id == user_id)
    )
    group_ids = result.scalars().all()

    return [Principal(type="user", id=user.id)] + [
        Principal(type="group", id=gid) for gid in group_ids
    ]
```

For example:

```text
user_id = 123

Effective principals:
[
    Principal(type="user", id=123),    # "user:123"
    Principal(type="group", id=17),    # "group:17"
    Principal(type="group", id=23),    # "group:23"
]
```

The SecureRetriever can then use these principals when applying the ACL filter.

---

# 7. PermissionService and SecureRetriever

## 7.1 PermissionService

`PermissionService` is the single architectural component responsible for resolving user permissions.

| Method                         | Input                    | Output                 | Purpose                                                              |
| ------------------------------ | ------------------------ | ---------------------- | -------------------------------------------------------------------- |
| `resolve_effective_principals` | `user_id`                | `list[Principal]`      | Returns principals such as `[Principal("user", 123), ...]` (`str` form `"user:123"`) |
| `can_access_document`          | `user_id`, `document_id` (UUID) | `bool`                 | Direct access check for one document                                 |
| `get_authorization_context`    | `user_id`                | `AuthorizationContext` | Full context containing user, groups, and principals                 |

`Principal` is a frozen `(type, id)` dataclass in `app/core/permission_service.py` with `type ∈ {"user", "group"}` — see [`DATABASE_QUERIES.md`](./DATABASE_QUERIES.md) §12. The string form is used only at the vector-store filter boundary.

### AuthorizationContext

Conceptually:

```text
AuthorizationContext
├── user_id
├── user
├── groups
└── effective_principals: list[Principal]
```

The context is then passed to retrieval rather than allowing each retrieval function to independently reconstruct permissions.

---

## 7.2 SecureRetriever

`SecureRetriever` is the only component allowed to query the vector database.

| Method          | Input                                 | Output        | Purpose                           |
| --------------- | ------------------------------------- | ------------- | --------------------------------- |
| `search`        | `auth_context`, `query`, `top_k`      | `list[Chunk]` | Mandatory ACL filter              |
| `search_hybrid` | `auth_context`, `query`, `top_k`      | `list[Chunk]` | BM25 + vector with ACL on both    |
| `rerank`        | `auth_context`, `query`, `candidates` | `list[Chunk]` | Rerank authorized candidates only |

### Architectural Rule

> **There is no public vector DB method that bypasses the SecureRetriever.**

The intended dependency direction is:

```text
Application
    ↓
SecureRetriever
    ↓
Vector DB
```

not:

```text
Application
    ├── SecureRetriever
    └── Vector DB directly  ← prohibited
```

---

# 8. Projection Synchronization

## 8.1 Synchronization Flow

```text
1. Document ACL or metadata changes in Supabase
       ↓
2. documents.metadata_version is incremented
       ↓
3. Projection worker picks up the change
       ↓
4. Vector DB chunks are updated with new acl_principals
       ↓
5. document_projections.projection_version =
       documents.metadata_version
       ↓
6. document_projections.projection_status = 'CURRENT'
```

The important property is that Supabase records the authoritative change first.

---

## 8.2 Detecting Stale Projections

```sql
SELECT
    d.id,
    d.metadata_version,
    p.projection_version
FROM documents d
JOIN document_projections p
    ON p.document_id = d.id
WHERE p.projection_version < d.metadata_version
   OR p.projection_status != 'CURRENT';
```

This query identifies documents whose vector projection needs attention.

---

## 8.3 ACL Revocation Is a Security-Critical Path

When access is revoked, the projection must be updated before the next query.

Regression test:

```text
T0: Alice has access
    ↓
    Query succeeds

T1: Revoke Alice
    ↓
    Sync projection

T2: Same query
    ↓
    Refused

T3: Restore Alice
    ↓
    Sync projection

T4: Same query
    ↓
    Succeeds
```

This test verifies that permission changes propagate through the complete authorization path.

---

# 9. Audit Trail

## 9.1 Stage-by-Stage Recording

Every request records chunk IDs at every retrieval stage.

The evaluation harness can verify:

```text
vector_candidate_ids ⊆ authorized
bm25_candidate_ids   ⊆ authorized
rrf_candidate_ids    ⊆ authorized
reranked_chunk_ids   ⊆ authorized
context_chunk_ids    ⊆ authorized
```

This provides an auditable representation of the central security invariant.

---

## 9.2 Refusal Reason Codes

| Code                   | Meaning                                      |
| ---------------------- | -------------------------------------------- |
| `NO_EVIDENCE`          | No chunks retrieved                          |
| `LOW_EVIDENCE`         | Chunks retrieved but low relevance           |
| `PERMISSION_BLOCKED`   | Relevant chunks exist but user lacks access  |
| `OUT_OF_SCOPE`         | Query unrelated to indexed content           |
| `STALE_EVIDENCE`       | Only critically stale evidence available     |
| `CONFLICTING_EVIDENCE` | Sources conflict and authority is unresolved |

These codes make refusal behavior easier to analyze and evaluate.

---

## 9.3 Privacy-Conscious Logging

Raw query text is not stored.

Instead, the model stores:

```text
query_hash
query_classification
```

The query hash allows requests to be correlated or analyzed without storing the raw query content.

---

# 10. Critical Security Rules

### Rule 1 — SecureRetriever Enforcement

No generic vector search may bypass the SecureRetriever.

### Rule 2 — Authorization Subset Invariant

Every retrieval stage must be a subset of authorized chunks.

```text
R(u, q) ⊆ A(u)
```

Where `R(u, q)` = chunks retrieved for user `u` and query `q`, `A(u)` = chunks the user is authorized to access. See `PERMISSION_AWARE_RETRIEVAL.md` for the full security model.

### Rule 3 — Revocation Propagation

ACL revocation propagation is a security-critical path and must have a regression test.

### Rule 4 — Supabase Is the Authority

The vector DB is never the authorization authority.

```text
Supabase = authoritative
Vector DB = derived projection
```

### Rule 5 — Fail Closed

If the PermissionService fails, retrieval fails closed.

The system must not interpret an authorization failure as permission to retrieve.

---

# 11. Full System Flow

```text
User Login (Supabase Auth)
    ↓
Supabase session issued (user_id)
    ↓
FastAPI receives request
    ↓
PermissionService.resolve_effective_principals(user_id)
    ↓
["user:123", "group:17", "group:23"]
    ↓
SecureRetriever.search(auth_context, query)
    ↓
    ├── Vector DB
    │     └── ACL filter: acl_principals ∈ principals
    │
    └── BM25
          └── ACL filter: acl_principals ∈ principals
    ↓
RRF
    ↓
Reranker
    ↓
Freshness Evaluation
    ↓
Conflict Detection
    ↓
Evidence Sufficiency
    ├── PASS
    │    ↓
    │   LLM
    │    ↓
    │   Citation Verification
    │    ↓
    │   Response
    │
    └── FAIL
         ↓
        Refusal Response
    ↓
audit_events.write(...)
    ↓
Response returned to user
```

This flow connects the database model to the previously defined permission-aware retrieval, retrieval-quality, freshness, conflict-detection, calibrated-refusal, and evaluation layers.

---

# 12. What NOT to Do

| Anti-Pattern                                                | Why It Fails                                      |
| ----------------------------------------------------------- | ------------------------------------------------- |
| Use usernames as ACL principals                             | Renaming breaks projections                       |
| Let any code call `vector_store.similarity_search()`        | Bypasses ACL enforcement                          |
| Store `write` permission without document writes            | Unused permission and unnecessary complexity      |
| Skip projection versioning                                  | Cannot detect stale ACL metadata                  |
| Store raw queries in audit log                              | Privacy risk                                      |
| Skip stage-level audit recording                            | Cannot trace where a leak occurred                |
| Combine authority, `source_type`, and status into one field | They are orthogonal dimensions                    |
| Treat vector DB as authoritative for ACLs                   | Corrupted projection could become a security hole |

---

# 13. Summary

Eight Supabase tables (`users`, `profiles`, `groups`, `user_groups`, `documents`, `document_acls`, `document_projections`, `audit_events`) + one vector `chunks` collection. See §§2–5 for the canonical schema; §14 below for the five design rules.

---

# 14. Key Design Decisions

### 1. Immutable IDs in ACL Principals

Canonical rule (see Section 3.2): use `user:<id>` / `group:<id>` (e.g. `user:123`, `group:17`), never names. This prevents ordinary renames from requiring ACL projection changes.

### 2. Mandatory SecureRetriever

All vector database access goes through:

```text
SecureRetriever
```

This creates a single enforcement boundary for permission-aware retrieval.

### 3. Projection Versioning

`metadata_version` in Supabase is compared against `projection_version` in the vector projection.

```text
metadata_version == projection_version
        ↓
    projection current

metadata_version > projection_version
        ↓
    projection stale
```

### 4. Stage-by-Stage Audit Recording

The system records chunk IDs through the retrieval pipeline so the Evaluation Harness can verify that unauthorized chunks never enter downstream stages.

### 5. Explicit Refusal Reason Codes

Reason codes such as:

```text
NO_EVIDENCE
LOW_EVIDENCE
PERMISSION_BLOCKED
OUT_OF_SCOPE
STALE_EVIDENCE
CONFLICTING_EVIDENCE
```

make system behavior observable and testable.

---

# 15. Database Relationship Model

Conceptually, the Supabase relationships are:

```text
┌──────────────┐
│ auth.users   │  ← Supabase Auth owns credentials
└──────┬───────┘
       │ 1:1 mirrored by
       ↓
┌──────────────┐
│   profiles   │
└──────┬───────┘
       │ 1:1 links to
       ↓
┌──────────────┐
│    users     │
└──────┬───────┘
       │
       │ 1:N
       ↓
┌──────────────┐
│ user_groups  │
└──────┬───────┘
       │
       │ N:1
       ↓
┌──────────────┐
│    groups    │
└──────────────┘


┌──────────────┐
│  documents   │
└──────┬───────┘
       │
       ├───────────────┐
       │               │
       │ 1:N           │ 1:1
       ↓               ↓
┌──────────────┐ ┌────────────────────┐
│ document_acls │ │document_projections│
└──────────────┘ └────────────────────┘
       │
       │
       │ references
       ↓
users / groups


┌──────────────┐
│  documents   │
└──────┬───────┘
       │
       │ projection
       ↓
┌────────────────────┐
│ Vector DB: chunks  │
└────────────────────┘


┌──────────────┐
│ audit_events │
└──────┬───────┘
       │
       ├── user_id
       ├── retrieval trace
       ├── authorization decision
       ├── freshness metadata
       └── conflict metadata
```

The critical architectural direction is:

```text
Supabase
   │
   │ authoritative metadata
   ↓
Projection Worker
   │
   ↓
Vector DB
   │
   │ authorized retrieval
   ↓
SecureRetriever
```

---

# 16. Security Invariant Across the Entire Data Model

The database design exists to enforce one central property:

> **A user can only receive information contained in documents they are authorized to access.**

Represented canonically as:

```text
R(u, q) ⊆ A(u)
```

And, more strictly, at every stage:

```text
VectorCandidates(u,q) ⊆ Authorized(u)

BM25Candidates(u,q)   ⊆ Authorized(u)

RRFCandidates(u,q)    ⊆ Authorized(u)

RerankedChunks(u,q)   ⊆ Authorized(u)

ContextChunks(u,q)    ⊆ Authorized(u)
```

The vector database improves search performance, but it does not replace Supabase as the source of truth for authorization.

---

# 17. Implementation Checklist

## Supabase

- [ ] Create `users` (no credentials — Supabase Auth owns them)
- [ ] Create `profiles` (mirrors `auth.users` + app fields)
- [ ] Create `groups`
- [ ] Create `user_groups`
- [ ] Create `documents`
- [ ] Create `document_acls`
- [ ] Create `document_projections`
- [ ] Create `audit_events`
- [ ] Add primary keys and foreign keys
- [ ] Add unique constraints
- [ ] Add ACL check constraints
- [ ] Add projection-status check constraint
- [ ] Add document self-reference for `supersedes_document_id`

## Vector DB

- [ ] Create `chunks` collection/index
- [ ] Store `document_id`
- [ ] Store `acl_principals`
- [ ] Store classification
- [ ] Store authority metadata
- [ ] Store document status
- [ ] Store freshness metadata
- [ ] Store source identifiers
- [ ] Store projection version

## Authorization

- [ ] Implement `PermissionService`
- [ ] Implement effective-principal resolution
- [ ] Implement `AuthorizationContext`
- [ ] Implement `SecureRetriever`
- [ ] Apply ACL filtering to vector search
- [ ] Apply ACL filtering to BM25 search
- [ ] Ensure reranking receives only authorized candidates
- [ ] Ensure PermissionService failures fail closed

## Synchronization

- [ ] Increment `metadata_version` on ACL/metadata changes
- [ ] Implement projection worker
- [ ] Update `acl_principals` during projection
- [ ] Update `projection_version`
- [ ] Update `projection_status`
- [ ] Detect stale projections
- [ ] Test ACL revocation propagation

## Auditing

- [ ] Record request IDs
- [ ] Record user IDs
- [ ] Store query hashes rather than raw query text
- [ ] Record stage-level chunk IDs
- [ ] Record authorization decisions
- [ ] Record refusal reason codes
- [ ] Record freshness warnings
- [ ] Record conflict metadata
- [ ] Record model and latency

## Evaluation

- [ ] Verify every retrieval stage is authorized
- [ ] Test permission revocation
- [ ] Test projection staleness
- [ ] Test failed-closed behavior
- [ ] Test direct vector DB bypass prevention
- [ ] Integrate audit data with the Evaluation Harness

---

# 18. Target Architecture Definition of Done

The full proposed database model is complete when:

- [ ] Supabase is the documented source of truth.
- [ ] The vector database is explicitly treated as a derived projection.
- [ ] All eight Supabase tables are implemented.
- [ ] The vector `chunks` collection is implemented.
- [ ] ACLs use immutable user/group IDs.
- [ ] Effective principals can be resolved for every authenticated user.
- [ ] SecureRetriever is the only vector retrieval boundary.
- [ ] Both vector and BM25 retrieval paths enforce ACLs.
- [ ] Projection versions detect stale metadata.
- [ ] ACL revocation propagation has a regression test.
- [ ] Permission failures fail closed.
- [ ] Retrieval-stage chunk IDs are auditable.
- [ ] Raw query text is not stored in `audit_events`.
- [ ] Refusal reason codes are recorded.
- [ ] Freshness and conflict metadata can be attached to audit events.
- [ ] The Evaluation Harness can verify the authorization subset invariant.

---

# 19. Final Systems Mental Model

The complete system can be understood as seven questions:

| Layer             | Question                              |
| ----------------- | ------------------------------------- |
| **Authorization** | Can the user see this?                |
| **Retrieval**     | Is this relevant?                     |
| **Freshness**     | How current is it?                    |
| **Conflict**      | Do the sources disagree?              |
| **Evidence**      | Is there enough reliable evidence?    |
| **LLM**           | How should the evidence be explained? |
| **Verification**  | Did the answer stay grounded?         |

The database layer supports all of them:

```text
                     Supabase
                  Source of Truth
                       │
       ┌───────────────┼────────────────┐
       ↓               ↓                ↓
   Identity          ACLs          Document Metadata
       │               │                │
       └───────────────┼────────────────┘
                       ↓
                Projection Worker
                       ↓
                  Vector DB
                 Searchable
                 Projection
                       ↓
                SecureRetriever
                       ↓
            Authorization-Safe Retrieval
                       ↓
                Reranking
                       ↓
                 Freshness
                       ↓
                  Conflict
                       ↓
                 Evidence
                       ↓
                    LLM
                       ↓
                Verification
                       ↓
                   Response
                       ↓
                 Audit Events
```

The most important architectural rule is:

> **Supabase decides what is authoritative. The vector database makes authorized data searchable. SecureRetriever enforces the boundary between the two.**

This keeps permissions, synchronization, retrieval, conflict detection, freshness detection, refusal behavior, and evaluation connected through explicit, testable data contracts.
