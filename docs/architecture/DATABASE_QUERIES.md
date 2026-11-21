# Database Query Patterns — Permission-Aware Knowledge Agent

**Project:** SER 401 – Project 14: Permission-Aware Knowledge Agent

**Author:** Lana Ghanim, Elliot Davis

**Date:** October 28th, 2026 (Last Modified)

**Purpose:** How application code queries Supabase (Postgres) using SQLAlchemy 2.0 async. This document covers the *how* of querying. See [`DATABASE_MIGRATIONS.md`](./DATABASE_MIGRATIONS.md) for the *how* of schema changes, and [`DATABASE_MODEL.md`](./DATABASE_MODEL.md) for the *what* (schema).

## Implementation status

The current database models are `User`, `Profile`, `Group`, and `UserGroup`.
The `/api/auth/me` endpoint demonstrates the current async join between
`Profile` and `User`; `get_db` supplies a request-scoped `AsyncSession`.
Examples later in this guide that use documents, ACLs, projections, audit
events, or `password_hash` refer to a **proposed design** and are not executable
against the current models. Supabase Auth owns credentials; do not add or query
a local password hash.

---

## 1. The Basic Shape

Every query follows the same pattern:

```python
result = await db.execute(select(Model).where(...))
data = result.scalar_one_or_none()
```

| Ingredient | What It Is |
|---|---|
| `select(...)` | Builds the SQL query |
| `await db.execute(...)` | Runs it asynchronously |
| `result.scalar_*()` | Extracts the data |

---

## 2. Getting a Session

```python
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db

@router.get("/users/{user_id}")
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
):
    ...
```

Rules:

- Every request gets its own session.
- Always use `Depends(get_db)`.
- Never share a session across requests.
- Never create `AsyncSessionLocal()` directly in a route.

---

## 3. Reading Data

### Select one row by ID

```python
result = await db.execute(
    select(User).where(User.id == user_id)
)
user = result.scalar_one_or_none()
```

### Understanding `scalar_one_or_none()` vs `scalar_one()` vs `scalars().first()`

| Method | Behavior | Use When |
|---|---|---|
| `scalar_one_or_none()` | Returns one row, or `None` if zero rows. Raises if more than one row. | Querying by unique column (`id`, `email`, `username`) |
| `scalar_one()` | Returns one row. Raises if zero or more than one. | You expect exactly one row and want an error otherwise |
| `scalars().first()` | Returns first row or `None`. Does not enforce uniqueness. | You want the first row of many |

Team rule:

- Querying by unique column → `scalar_one_or_none()`
- Querying for a list → `scalars().all()`
- Never use `.first()` when the column is unique.

### Select all rows

```python
result = await db.execute(select(User))
users = result.scalars().all()
```

### Select with a condition

```python
result = await db.execute(
    select(User).where(User.username == "alice")
)
user = result.scalar_one_or_none()
```

### Select specific columns

```python
result = await db.execute(
    select(User.id, User.username).where(User.id == 1)
)
row = result.one()
print(row.id, row.username)
```

---

## 4. Writing Data

### Insert

```python
user = User(
    username="alice",
    email="alice@company.com",
)
db.add(user)
await db.commit()
await db.refresh(user)
```

In the current signup flow, the backend first creates the account through
Supabase Auth, then creates its `User` and `Profile` rows in one database
transaction. Application code must not create local credentials.

### Update

```python
result = await db.execute(
    select(User).where(User.id == user_id)
)
user = result.scalar_one_or_none()

if user:
    user.email = "new@company.com"
    await db.commit()
```

### Delete

```python
result = await db.execute(
    select(User).where(User.id == user_id)
)
user = result.scalar_one_or_none()

if user:
    await db.delete(user)
    await db.commit()
```

---

## 5. Transactions: `flush()` vs `commit()`

Do not commit after every write. Your application will often perform multiple writes that belong to one logical transaction.

Example — creating a document with ACLs and a projection record (abridged — full columns in [`DATABASE_MODEL.md`](./DATABASE_MODEL.md) §3.1):

```python
from app.models.document import Document
from app.models.document_acl import DocumentACL
from app.models.projection import DocumentProjection

try:
    doc = Document(source="mock", source_id="doc-1", title="Handbook")
    db.add(doc)
    await db.flush()          # get doc.id without committing

    db.add(DocumentACL(
        document_id=doc.id,
        group_id=17,
        permission="read",
    ))
    db.add(DocumentProjection(
        document_id=doc.id,
        projection_version=1,
        projection_status="PENDING",
    ))

    await db.commit()         # single commit at the end
except Exception:
    await db.rollback()
    raise
```

| Method | Does |
|---|---|
| `flush()` | Sends SQL to the DB but does not end the transaction |
| `commit()` | Flushes + commits the transaction |

Rules:

- Use `flush()` when you need generated IDs before the transaction ends.
- Use one `commit()` per logical transaction.
- Always wrap writes in try/except with `await db.rollback()` on failure.

Why rollback matters: a failed transaction leaves the session in a failed-transaction state. If you don't rollback, subsequent queries in the same session fail until it's reset.

Pattern:

```python
try:
    ...
    await db.commit()
except Exception:
    await db.rollback()
    raise
```

---

## 6. Timezone-Aware Datetimes

The project uses `created_at`, `updated_at`, and `source_synced_at`. These must be timezone-aware.

Do this:

```python
from datetime import datetime, timezone

now = datetime.now(timezone.utc)
```

Not this:

```python
from datetime import datetime

now = datetime.utcnow()   # naive, deprecated in Python 3.12+
```

Why:

- Naive datetimes cause comparison bugs across time zones.
- The freshness policy compares `updated_at` against now (see [`FRESHNESS_STALENESS_DETECTION.md`](../retrieval/FRESHNESS_STALENESS_DETECTION.md)).
- Team members are in different time zones.

Store all timestamps as UTC. Convert for display only if needed.

---

## 7. Relationships

### Loading related data

```python
from sqlalchemy.orm import selectinload

result = await db.execute(
    select(User)
    .options(selectinload(User.groups))
    .where(User.id == user_id)
)
user = result.scalar_one_or_none()

print(user.groups)   # list of Group objects
```

Team rule: do not rely on implicit lazy loading in async request code (async cannot lazy-load). Always explicitly eager-load relationships.

| Option | Use When |
|---|---|
| `selectinload(User.groups)` | One-to-many or many-to-many — default choice |
| `joinedload(User.groups)` | One-to-one or small joins |

`selectinload()` is the safe default.

### Querying through relationships

`UserGroup` lives in `app.models.group` (there is no `user_group.py` — see [`REPOSITORY_STRUCTURE.md`](./REPOSITORY_STRUCTURE.md)):

```python
from sqlalchemy import select
from app.models.group import Group, UserGroup

result = await db.execute(
    select(Group)
    .join(UserGroup, UserGroup.group_id == Group.id)
    .where(UserGroup.user_id == user_id)
)
groups = result.scalars().all()
```

---

## 8. Joins

```python
from sqlalchemy import select
from app.models.document import Document
from app.models.document_acl import DocumentACL

result = await db.execute(
    select(Document)
    .join(DocumentACL, DocumentACL.document_id == Document.id)
    .where(DocumentACL.group_id == 17)
)
documents = result.scalars().unique().all()
```

Why `.unique()`? A document may match multiple ACL rows. `.unique()` deduplicates.

Translation to SQL:

```sql
SELECT DISTINCT documents.*
FROM documents
JOIN document_acls ON document_acls.document_id = documents.id
WHERE document_acls.group_id = 17
```

---

## 9. Filters

### Basic comparisons

```python
select(User).where(User.id == 1)
select(User).where(User.department == "engineering")
select(User).where(User.id != 1)
```

### Logical operators

```python
from sqlalchemy import and_, or_, not_

select(User).where(and_(User.department == "engineering", User.access_level == "employee"))
select(User).where(or_(User.department == "engineering", User.department == "hr"))
select(User).where(not_(User.access_level == "intern"))
```

### IN

```python
select(Document).where(Document.content_type.in_(["hr_policy", "financial_report"]))
```

### LIKE

```python
select(Document).where(Document.title.ilike("%vacation%"))
```

### Date comparisons

```python
from datetime import datetime, timezone, timedelta

cutoff = datetime.now(timezone.utc) - timedelta(days=365)
select(Document).where(Document.updated_at < cutoff)
```

### Null checks

```python
select(Document).where(Document.supersedes_document_id.is_(None))
select(Document).where(Document.supersedes_document_id.is_not(None))
```

### Multiple conditions

```python
select(Document)
    .where(Document.authority_level == "official")
    .where(Document.document_status == "active")
    .where(Document.updated_at > cutoff)
```

---

## 10. Ordering and Pagination

```python
select(Document).order_by(Document.updated_at.desc())
select(User).order_by(User.username.asc(), User.id.desc())
select(Document).limit(20).offset(40)
```

Cursor pagination (recommended for large tables):

```python
select(Document).where(Document.id > last_seen_id).limit(20)
```

---

## 11. Aggregations

### Count

```python
from sqlalchemy import func

result = await db.execute(select(func.count()).select_from(User))
count = result.scalar_one()
```

### Group by

```python
result = await db.execute(
    select(User.department, func.count(User.id))
    .group_by(User.department)
)
for department, count in result.all():
    print(department, count)
```

### Exists

```python
from sqlalchemy import exists

result = await db.execute(
    select(exists().where(User.username == "alice"))
)
exists_bool = result.scalar_one()
```

---

## 12. The Principal Model

Before showing the permission query pattern, we need to define what a principal is.

A principal is a (type, id) pair — the kind of thing that can appear in an ACL entry. It lives in `app/core/permission_service.py`, the canonical home of principal resolution (see [`DATABASE_MODEL.md`](./DATABASE_MODEL.md) §7.1). There is no `app/services/principals.py`.

```python
from dataclasses import dataclass
from typing import Literal

@dataclass(frozen=True)
class Principal:
    type: Literal["user", "group"]
    id: int

    def __str__(self) -> str:
        return f"{self.type}:{self.id}"
```

Examples:

```python
Principal(type="user", id=123)     # user:123
Principal(type="group", id=17)     # group:17
```

Why a structured type?

- The database schema uses `principal_type` + `principal_id` columns. The vector DB projection uses the string form `user:123`.
- Using a `Principal` dataclass keeps the two representations aligned — `str(p)` is the vector-store form, `(p.type, p.id)` is the database form.
- It prevents leaks of vector-store-specific string formats into the DB layer and makes queries readable.

---

## 13. The Permission Query Pattern

`PermissionService.resolve_effective_principals` resolves a user's effective principals from Supabase. Unknown users fail closed (see [`PERMISSION_AWARE_RETRIEVAL.md`](../security/PERMISSION_AWARE_RETRIEVAL.md) §23 — no permission decision never means permission granted):

```python
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.models.group import Group, UserGroup
from app.core.exceptions import AuthorizationError
from app.core.permission_service import Principal

async def resolve_effective_principals(
    db: AsyncSession,
    user_id: int,
) -> list[Principal]:
    # 1. Get the user
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise AuthorizationError(f"Unknown user {user_id}")

    # 2. Get the user's groups
    result = await db.execute(
        select(Group.id)
        .join(UserGroup, UserGroup.group_id == Group.id)
        .where(UserGroup.user_id == user_id)
    )
    group_ids = result.scalars().all()

    # 3. Build principals
    principals = [Principal(type="user", id=user.id)]
    principals.extend(Principal(type="group", id=gid) for gid in group_ids)

    return principals
```

Result: `[Principal("user", 123), Principal("group", 17), Principal("group", 23)]` — string form `["user:123", "group:17", "group:23"]`.

Why this matters: `PermissionService` returns domain principals, not vector-store-specific strings. `SecureRetriever` translates principals into the vector store's filter format:

```python
# Inside SecureRetriever
acl_filter = {"acl_principals": {"$in": [str(p) for p in principals]}}
# → {"acl_principals": {"$in": ["user:123", "group:17", "group:23"]}}
```

This preserves the architectural boundary:

```text
Supabase
    │
    ▼
PermissionService
    │
    │  authorized principals (domain objects)
    ▼
SecureRetriever
    │
    ├── Vector search + ACL filter (converts to store-specific format)
    └── BM25 search + ACL filter
```

---

## 14. The ACL Query Pattern

When querying documents directly from Supabase (for admin or audit purposes — user-facing retrieval always goes through `SecureRetriever`), use the structured ACL schema:

```python
from sqlalchemy import select, or_
from app.models.document import Document
from app.models.document_acl import DocumentACL
from app.core.permission_service import Principal

async def get_authorized_documents(
    db: AsyncSession,
    principals: list[Principal],
) -> list[Document]:
    # Build conditions separating user and group principals
    user_ids = [p.id for p in principals if p.type == "user"]
    group_ids = [p.id for p in principals if p.type == "group"]

    conditions = []
    if user_ids:
        conditions.append(DocumentACL.user_id.in_(user_ids))
    if group_ids:
        conditions.append(DocumentACL.group_id.in_(group_ids))

    if not conditions:
        return []

    result = await db.execute(
        select(Document)
        .join(DocumentACL, DocumentACL.document_id == Document.id)
        .where(or_(*conditions))
    )
    return result.scalars().unique().all()
```

Translation to SQL for three principals:

```sql
SELECT DISTINCT documents.*
FROM documents
JOIN document_acls ON document_acls.document_id = documents.id
WHERE (document_acls.user_id = 123
    OR document_acls.group_id IN (17, 23))
```

**Why separate user and group lists?**

Because `document_acls` uses explicit, typed foreign key columns (`user_id` referencing `users.id` and `group_id` referencing `groups.id`), allowing clean `IN` clauses for each table type.

---

## 15. Common Mistakes

| Mistake | Why It Fails | Fix |
|---|---|---|
| `db.query(User)` | Removed in SQLAlchemy 2.0 | `await db.execute(select(User))` |
| Forgetting `await` | Returns a coroutine | Always `await db.execute(...)` |
| Lazy-loading relationships | Async cannot lazy-load | Use `selectinload(...)` |
| Sharing a session across requests | Race conditions | Use `Depends(get_db)` |
| Forgetting `await db.rollback()` | Session stays in failed state | Always rollback on error |
| Using `scalar_one_or_none()` on non-unique columns | Raises on 2+ rows | Use `scalars().first()` for non-unique |
| Using `.first()` on unique columns | Hides duplicate data | Use `scalar_one_or_none()` |
| `datetime.utcnow()` | Naive datetime | Use `datetime.now(timezone.utc)` |
| Querying `principal_id IN ["user:123", ...]` | Type mismatch | Query `principal_type` + `principal_id` together |
| Committing after every write | Breaks transactions | One commit per logical transaction |

---

## 16. The Cheat Sheet

| Task | Code |
|---|---|
| Select one (unique) | `result = await db.execute(select(User).where(User.id == 1))` |
| Get one or None | `user = result.scalar_one_or_none()` |
| Get all | `users = result.scalars().all()` |
| Add | `db.add(user); await db.commit()` |
| Flush (get ID) | `await db.flush()` |
| Update | `user.email = "x"; await db.commit()` |
| Delete | `await db.delete(user); await db.commit()` |
| Rollback | `await db.rollback()` |
| Join | `.join(Other, Other.fk == Model.id)` |
| Load relation | `.options(selectinload(User.groups))` |
| Filter | `.where(User.department == "engineering")` |
| Order | `.order_by(User.username)` |
| Limit | `.limit(20)` |
| Count | `select(func.count()).select_from(User)` |
| Exists | `select(exists().where(...))` |
| Now (UTC) | `datetime.now(timezone.utc)` |

---

## 17. A Real Example: Chat Endpoint

Follows [`PERMISSION_AWARE_RETRIEVAL.md`](../security/PERMISSION_AWARE_RETRIEVAL.md) §22 (FastAPI authentication boundary) — the endpoint resolves identity, builds the authorization context server-side, and delegates all filtering to `SecureRetriever`. Router mounted under `/api` → `POST /api/chat`:

```python
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.security import get_current_user
from app.core.permission_service import get_authorization_context
from app.services.retrieval.secure_retriever import SecureRetriever
from app.services.retrieval.vector_store import vector_store
from app.models.user import User
from app.schemas.chat import ChatRequest, ChatResponse

router = APIRouter()

@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 1. Resolve permissions server-side (never trust the frontend)
    auth_context = await get_authorization_context(db, current_user.id)

    # 2. Secure retrieval (translates principals to the vector-store filter)
    retriever = SecureRetriever(vector_store)
    chunks = await retriever.search(
        auth_context=auth_context,
        query=request.query,
        top_k=5,
    )

    # 3. Return
    return ChatResponse(
        answer="...",
        citations=[c.id for c in chunks],
    )
```

Notice: the endpoint does not construct an ACL filter. It delegates to `SecureRetriever`.

---

## 18. Summary

| Question | Answer |
|---|---|
| What does a query look like? | `result = await db.execute(select(Model).where(...))` |
| How do I get one row? | `result.scalar_one_or_none()` |
| How do I get many? | `result.scalars().all()` |
| How do I insert? | `db.add(obj); await db.commit()` |
| How do I update? | Modify attribute; `await db.commit()` |
| How do I delete? | `await db.delete(obj); await db.commit()` |
| How do I join? | `.join(Other, Other.fk == Model.id)` |
| How do I load a relation? | `.options(selectinload(Model.relation))` |
| How do I handle multiple writes? | `flush()` for IDs, one `commit()` at the end |
| What do I do on error? | `await db.rollback(); raise` |
| What datetime do I use? | `datetime.now(timezone.utc)` |
| What do I avoid? | `db.query(...)`, naive datetimes, `principal_id IN ["user:123"]` |
| Where do I get a session? | `Depends(get_db)` |
| Who builds the ACL filter? | `SecureRetriever` — never the endpoint |

> Every query is `await db.execute(select(...))` → `result.scalar_*()`; writes use `flush()` for IDs and one `commit()` per transaction with `rollback()` on error; relationships are eagerly loaded with `selectinload()`; and ACL filtering is done by `SecureRetriever` from domain `Principal` objects — never constructed in endpoint code.
