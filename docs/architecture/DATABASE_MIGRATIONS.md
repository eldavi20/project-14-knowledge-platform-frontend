# Database Migrations (Async) — Permission-Aware Knowledge Agent

**Project:** SER 401 – Project 14: Permission-Aware Knowledge Agent

**Author:** Lana Ghanim, Elliot Davis

**Date:** October 28th, 2026 (Last Modified)

**Purpose:** Async database setup using SQLAlchemy 2.0, asyncpg, and Alembic with autogenerate — one driver, one URL, one Base. Companion to [`DATABASE_MODEL.md`](./DATABASE_MODEL.md) (schema/what) — this guide covers how to change it.

## Current migration state

The app and Alembic currently use `SUPABASE_DB_URL` with the async SQLAlchemy
engine. `migrations/env.py` imports the registered models and runs migrations
through `connection.run_sync()`. The only checked-in revision is
`d6c1c9809b5c`, which creates `users`, `profiles`, `groups`, and `user_groups`;
`auth.users` is managed by Supabase and is referenced, not created, by this
project.

The example file lists and broader schema below include **future target
components**. They are not all present in the repository. There is currently
no tracked `.env.example`.

> Convention note: this file lives at `docs/architecture/DATABASE_MIGRATIONS.md` (UPPER_SNAKE, sibling to `DATABASE_MODEL.md`). There is currently no `docs/development/database-migrations.md`.

---

## 1. Why Async?

FastAPI is async-first. If your database driver is sync, every query blocks the event loop.

Sync (blocking):

```python
def get_user(db):
    return db.query(User).first()   # blocks the whole app
```

Async (non-blocking):

```python
async def get_user(db):
    result = await db.execute(select(User))
    return result.scalar_one_or_none()   # other requests keep flowing
```

The current auth routes perform database access from async request handlers, so
keeping the database operations asynchronous avoids blocking the event loop.

---

## 2. The Tool Stack

| Layer | Choice |
|---|---|
| ORM | SQLAlchemy 2.0 (typed `Mapped[]` syntax) |
| Driver | asyncpg |
| Migrations | Alembic with `async_engine_from_config` + `connection.run_sync()` |
| FastAPI integration | `AsyncSession` with `Depends(get_db)` |
| Config | One `SUPABASE_DB_URL` |

Key insight: Alembic's migration API is synchronous. SQLAlchemy provides an async migration pattern in which an async connection executes the synchronous Alembic migration function through `connection.run_sync()`.

The application engine and Alembic use asyncpg through
`SUPABASE_DB_URL` and the shared Base (`app/db/base.py`). `pyproject.toml`
also currently declares `psycopg[binary]`; the app session and configured
migration engine do not use it.

---

## 3. How Alembic Works With Async

```text
Application:
    FastAPI
      ↓
    AsyncSession
      ↓
    asyncpg
      ↓
    Supabase (Postgres)

Migrations:
    Alembic
      ↓
    async_engine_from_config
      ↓
    asyncpg
      ↓
    connection.run_sync(do_run_migrations)
      ↓
    Alembic migration operations (synchronous)
      ↓
    Supabase (Postgres)
```

Alembic's own migration operations are synchronous, but they run through an async connection. No second driver is needed.

---

## 4. Dependencies

The relevant current `pyproject.toml` dependencies are managed with `uv`:

```toml
dependencies = [
    "sqlalchemy[asyncio]>=2.0,<3.0",
    "asyncpg>=0.29",
    "alembic>=1.13,<2.0",
    "pydantic-settings>=2.0",
    "psycopg[binary]>=3.3.6",
]
```

Notes:

- `sqlalchemy[asyncio]` pulls in the async dependencies it needs (including greenlet).
- Do not manually pin greenlet unless the project needs it.
- The current manifest also declares `psycopg[binary]`, but the async engine
  and Alembic environment use `asyncpg`.
- `uv.lock` pins the exact resolved versions.

The development dependency group currently includes `pytest`,
`pytest-asyncio`, and `ruff`:

```toml
dev = [
    "pytest>=9.1.1",
    "pytest-asyncio>=1.4.0",
    "ruff>=0.16.10",
]
```

---

## 5. Configuration

`app/config.py` (settings loaded from environment or `.env`; no tracked
`.env.example` exists currently):

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    class Config:
        env_file = ".env"

    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str
    supabase_db_url: str   # Supabase-provided asyncpg URL, e.g. postgresql+asyncpg://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres

    pinecone_api_key: str
    pinecone_index: str = "project-14-knowledge"

    llm_provider: str = "openai"   # openai | anthropic | gemini
    openai_api_key: str | None = None
    anthropic_api_key: str | None = None
    google_api_key: str | None = None

    environment: str = "development"
    log_level: str = "INFO"

settings = Settings()
```

Suggested `.env` variable names (this template is not currently checked in):

```text
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_DB_URL=

PINECONE_API_KEY=
PINECONE_INDEX=project-14-knowledge

LLM_PROVIDER=openai
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_API_KEY=

ENVIRONMENT=development
LOG_LEVEL=INFO
```

The app and Alembic use the same `SUPABASE_DB_URL` and asyncpg driver.

---

## 6. Planned File Structure

The following illustrates the intended full schema/migration layout. Only
`user.py`, `profile.py`, and `group.py` are current model modules; only the
initial revision listed above exists today.

```text
├── app/
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── profile.py           ← profiles (mirrors auth.users)
│   │   ├── group.py
│   │   ├── document.py
│   │   ├── document_acl.py
│   │   ├── projection.py
│   │   └── audit_event.py
│   │
│   └── db/
│       ├── base.py              ← Single DeclarativeBase with naming convention
│       ├── session.py           ← Async engine + async_sessionmaker
│       └── seed.py              ← Async seed script (idempotent)
│
├── migrations/
│   ├── env.py
│   ├── script.py.mako
│   └── versions/
│       ├── 001_create_users_and_profiles.py
│       ├── 002_create_groups_and_membership.py   ← groups + user_groups
│       ├── 003_create_documents.py
│       ├── 004_create_document_acls.py
│       ├── 005_create_document_projections.py
│       └── 006_create_audit_events.py
│
└── alembic.ini
```

Matches [`REPOSITORY_STRUCTURE.md`](./REPOSITORY_STRUCTURE.md) (canonical layout).

Important: There is one Base — `app/db/base.py`. Models import from it. Alembic imports from it.

---

## 7. The Single Base Class

`app/db/base.py`:

```python
from sqlalchemy import MetaData
from sqlalchemy.orm import DeclarativeBase

NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}

class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=NAMING_CONVENTION)
```

Predictable constraint names such as:

```text
pk_users
uq_users_username
uq_users_email
fk_document_acls_document_id_documents
```

That makes migrations easier to read.

---

## 8. Async Engine and Session

`app/db/session.py`:

```python
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from app.config import settings

engine = create_async_engine(
    settings.supabase_db_url,
    echo=False,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=5,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session
```

Notes:

| Setting | Value | Reason |
|---|---|---|
| `create_async_engine` | — | Async variant |
| `pool_pre_ping` | True | Detect stale connections |
| `pool_size` | 5 | Small capstone, not production scale |
| `max_overflow` | 5 | Avoid over-provisioning connections |
| `expire_on_commit` | False | Keep attributes accessible after commit |

Do not create a single global `AsyncSession` and share it across requests. Each request gets its own session via `Depends(get_db)`.

---

## 9. The Async Models

`app/models/user.py` (abridged — full columns in [`DATABASE_MODEL.md`](./DATABASE_MODEL.md) §2.1):

```python
from datetime import datetime
from sqlalchemy import Boolean, DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    full_name: Mapped[str | None] = mapped_column(String(255))
    department: Mapped[str | None] = mapped_column(String(64))
    access_level: Mapped[str | None] = mapped_column(String(32))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    groups: Mapped[list["Group"]] = relationship(
        secondary="user_groups",
        back_populates="users",
    )
```

Architectural decision to preserve (see [`DATABASE_MODEL.md`](./DATABASE_MODEL.md) §3.2): ACL principals uses explicit foreign key columns (`user_id` and `group_id`). Permission projections and vector-store filters normalize these into stable string identifiers:

```text
user:<id>
group:<id>
```

Not:

```text
user:alice      ← wrong
group:engineering ← wrong
```

The `users.id` and `groups.id` columns serve as the source of truth for the physical foreign keys. The vector DB projects `user:123`, `group:17` into `acl_principals`.

---

## 10. Alembic env.py (Async)

`migrations/env.py`:

```python
import asyncio
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

from app.config import settings
from app.db.base import Base

# Import all models so autogenerate sees them
# (group.py holds Group + UserGroup; projection.py holds document_projections)
from app.models import (  # noqa: F401
    user, group, document, document_acl, projection, audit_event
)

config = context.config

# Pass the async URL to Alembic
config.set_main_option(
    "sqlalchemy.url",
    settings.supabase_db_url.replace("%", "%%"),
)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Offline mode: generate SQL without a live connection."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        compare_server_default=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    """Alembic's synchronous migration operations run here."""
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
        compare_server_default=True,
    )
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Create an async engine and run migrations via run_sync()."""
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

How it works:

- `settings.supabase_db_url` is passed to Alembic's config.
- `async_engine_from_config` creates an async engine (asyncpg).
- `connection.run_sync(do_run_migrations)` executes Alembic's synchronous migration operations.
- No psycopg2 needed.

---

## 11. alembic.ini

```ini
[alembic]
script_location = migrations
prepend_sys_path = .
version_path_separator = os

[loggers]
keys = root,sqlalchemy,alembic

[handlers]
keys = console

[formatters]
keys = generic

[logger_root]
level = WARN
handlers = console
qualname =

[logger_sqlalchemy]
level = WARN
handlers =
qualname = sqlalchemy.engine

[logger_alembic]
level = INFO
handlers =
qualname = alembic

[handler_console]
class = StreamHandler
args = (sys.stderr,)
level = NOTSET
formatter = generic

[formatter_generic]
format = %(levelname)-5.5s [%(name)s] %(message)s
datefmt = %H:%M:%S
```

The URL is set from `env.py`, not here, so there's one source of truth.

---

## 12. Async Session in FastAPI

`app/api/auth.py` (router mounted under `/api/auth`, so this is `POST /api/auth/login`):

```python
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.user import User

router = APIRouter()

@router.post("/login")
async def login(
    credentials: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User).where(User.username == credentials.username)
    )
    user = result.scalar_one_or_none()
    # verify via Supabase Auth, establish session
```

Pattern:

```python
result = await db.execute(select(User).where(...))
user = result.scalar_one_or_none()
```

Not:

```python
user = db.query(User).filter(...).first()   # ❌ sync only
```

---

## 13. Async Seed Script (Idempotent)

Users are created in Supabase Auth (dashboard or Auth API) — never with local passwords. The seed script creates only app-side data: groups, memberships, profiles, and document fixtures. It assumes the Supabase users already exist and matches them by email.

`app/db/seed.py`:

```python
import asyncio
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.models.profile import Profile
from app.models.group import Group

async def get_or_create_group(db, name: str) -> Group:
    result = await db.execute(select(Group).where(Group.name == name))
    group = result.scalar_one_or_none()
    if group:
        return group
    group = Group(name=name)
    db.add(group)
    await db.flush()
    return group

async def ensure_profile(db, user: User, supabase_user_id: str, **kwargs) -> Profile:
    """Link an existing app user to its Supabase identity (idempotent)."""
    result = await db.execute(select(Profile).where(Profile.user_id == user.id))
    profile = result.scalar_one_or_none()
    if profile:
        return profile
    profile = Profile(id=supabase_user_id, user_id=user.id, **kwargs)
    db.add(profile)
    await db.flush()
    return profile

async def seed():
    async with AsyncSessionLocal() as db:
        engineering = await get_or_create_group(db, "engineering")
        hr = await get_or_create_group(db, "hr")
        interns = await get_or_create_group(db, "interns")
        managers = await get_or_create_group(db, "managers")

        # Users below must already exist in Supabase Auth;
        # SUPABASE_USER_IDS maps app usernames to auth.users.id values.
        # (No passwords anywhere — Supabase Auth owns credentials.)
        await db.commit()
        print("Seeded successfully")

if __name__ == "__main__":
    asyncio.run(seed())
```

Idempotent: running this multiple times is safe. Rule: seed scripts never create credentials — users come from Supabase Auth, the script only links profiles, groups, and fixtures.

---

## 14. Async Tests

Initial testing (fast) — `tests/conftest.py`:

```python
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.main import app
from app.db.base import Base
from app.db.session import get_db

TEST_DATABASE_URL = "postgresql+asyncpg://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres_test"

@pytest_asyncio.fixture
async def db_session():
    engine = create_async_engine(TEST_DATABASE_URL)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session = async_sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    async with async_session() as session:
        yield session

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()

@pytest_asyncio.fixture
async def client(db_session):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()
```

`pyproject.toml` — merge with the existing pytest config (keep `pythonpath`):

```toml
[tool.pytest.ini_options]
pythonpath = ["."]
asyncio_mode = "auto"
```

Migration testing (required in CI). For CI, migrations are tested separately (run from the repo root, where `alembic.ini` lives):

```bash
dropdb test_knowledge_agent
createdb test_knowledge_agent
uv run alembic upgrade head
uv run pytest
```

Rationale: initial unit/integration testing may use `create_all()` for speed. Migration tests and CI must additionally verify `alembic upgrade head` against a clean database. Otherwise tests can pass while migrations are broken — a serious problem when migrations affect authorization data.

---

## 15. The Capstone Migration Workflow

| Step | Command (from the repo root) | When |
|---|---|---|
| 1. Add model | Edit `app/models/` | During development |
| 2. Generate migration | `uv run alembic revision --autogenerate -m "..."` | After model change |
| 3. Review migration | Open the generated file | Always |
| 4. Apply | `uv run alembic upgrade head` | Locally |
| 5. Test | `uv run pytest` | After applying |
| 6. Commit | Both model + migration | Together in the PR |
| 7. Deploy | CI runs `alembic upgrade head` | On deploy |

Rule: never commit a model change without its migration.

Also: never blindly trust autogenerate. It cannot infer column renames (it sees drop + add), data migrations, or complex constraint changes. The workflow is:

```text
autogenerate → human review → modify migration if necessary → test on clean DB → merge
```

---

## 16. Security-Critical Database Changes

Security-sensitive changes (see [`DATABASE_MODEL.md`](./DATABASE_MODEL.md) §10 and [`PULL_REQUEST_PROCESS.md`](../planning/PULL_REQUEST_PROCESS.md) §7):

- `users` / `groups` / `user_groups` structure and membership
- `document_acls` entries
- Document classification and `document_status`
- Permission-related indexes and constraints

Any migration affecting authorization data requires: migration review, relevant unit/integration tests, the security test suite, a permission-leakage test, and a clean-database migration test:

```text
ACL schema change
      ↓
Migration
      ↓
PR labeled security
      ↓
2 reviews
      ↓
security.yml
      ↓
zero leakage
```

A broken ACL migration can become a security problem.

---

## 17. Docker Compose (With Healthcheck)

`docker-compose.yml` (canonical services per [`REPOSITORY_STRUCTURE.md`](./REPOSITORY_STRUCTURE.md) §9 — no local database container; Supabase hosts Postgres):

```yaml
services:
  backend:
    build: .
    environment:
      SUPABASE_URL: ${SUPABASE_URL}
      SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY}
      SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY}
      SUPABASE_DB_URL: ${SUPABASE_DB_URL}
    ports:
      - "8000:8000"
    command: >
      sh -c "uv run alembic upgrade head &&
             uv run uvicorn app.main:app --host 0.0.0.0 --port 8000"
```

There is no `postgres` service and no `depends_on` healthcheck: Supabase is external, so the backend connects directly via `SUPABASE_DB_URL`. (The healthcheck pattern still applies in general — wait for dependencies before migrating — but here there is nothing local to wait for.)

For the capstone: one backend container running migrations before starting is fine. In production, migrations would be a separate deployment step — don't overengineer that for this project.

---

## 18. CI Migration Test

`.github/workflows/test.yml` should include (Python 3.12 to match `Dockerfile`):

```yaml
jobs:
  test:
    runs-on: ubuntu-latest

    # No postgres service container — tests run migrations against
    # Supabase via SUPABASE_DB_URL (stored as a CI secret).

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - name: Install dependencies
        run: uv sync

      - name: Run migrations on clean DB
        env:
          SUPABASE_DB_URL: ${{ secrets.SUPABASE_DB_URL }}
        run: uv run alembic upgrade head

      - name: Run tests
        env:
          SUPABASE_DB_URL: ${{ secrets.SUPABASE_DB_URL }}
        run: uv run pytest
```

Flow:

```text
Supabase (via SUPABASE_DB_URL secret)
       ↓
alembic upgrade head
       ↓
run tests
```

This catches migration failures before merge.

---

## 19. Team Reference

Rules:

1. One migration per logical change
2. Never edit a merged migration
3. Always review autogenerated migrations
4. Test on a clean database
5. Use the project naming convention (`app/db/base.py`)
6. Seed data lives in `seed.py`, not migrations
7. Merge branches before creating new migrations
8. Document irreversible migrations
9. Never blindly trust autogenerate
10. Security-related migrations require 2 PR approvals (see [`PULL_REQUEST_PROCESS.md`](../planning/PULL_REQUEST_PROCESS.md))

Workflow:

1. Edit model in `app/models/`
2. Run (from the repo root): `uv run alembic revision --autogenerate -m "description"`
3. Review the generated file in `migrations/versions/`
4. Apply: `uv run alembic upgrade head`
5. Test: `uv run pytest`
6. Commit both the model and the migration

Async notes:

- App runtime uses `AsyncSession` (asyncpg).
- Alembic uses an async engine with `connection.run_sync()`.
- One URL: `SUPABASE_DB_URL` (Supabase-provided asyncpg URL)
- Never call `db.query(...)` — always `await db.execute(select(...))`.
- Seed scripts use `asyncio.run(seed())`.

Testing migrations (from the repo root):

```bash
dropdb test_knowledge_agent
createdb test_knowledge_agent
uv run alembic upgrade head
uv run pytest
```

Rolling back (from the repo root):

```bash
uv run alembic downgrade -1     # one step back
uv run alembic downgrade base   # full reset
```

Never do this:

- Edit a migration that has been merged
- Put seed data inside a migration
- Commit a model change without a migration
- Skip reviewing autogenerated migrations
- Use `db.query(...)` in async code
- Install a second Postgres driver

---

## 20. Cheat Sheet

| Item | Value |
|------|-------|
| Driver | `asyncpg` |
| URL | `postgresql+asyncpg://...` |
| Env variable | `SUPABASE_DB_URL` |
| Base class | `app/db/base.py` (one) |
| Session | `AsyncSession` via `Depends(get_db)` |
| Query pattern | `await db.execute(select(...))` |
| Migration command (from the repo root) | `uv run alembic revision --autogenerate -m "..."` |
| Apply command (from the repo root) | `uv run alembic upgrade head` |
| Test on clean DB | `dropdb`, `createdb`, `uv run alembic upgrade head` |

---

## 21. Common Mistakes

| Mistake | Fix |
|---------|-----|
| Using `db.query(User)` | Use `await db.execute(select(User))` |
| Forgetting `await db.commit()` | Always `await db.commit()` |
| Sharing a session across requests | Use `Depends(get_db)` |
| Using sync `create_engine` | Use `create_async_engine` |
| Manually pinning `greenlet` | Use `sqlalchemy[asyncio]` and let it resolve |
| Installing `psycopg2-binary` | Not needed — asyncpg handles everything |
| Adding `DATABASE_URL_SYNC` | Not needed — one URL |
| Creating two Bases | One Base: `app/db/base.py` |
| Trusting autogenerate blindly | Always review migrations |
| Testing only against `create_all()` | Also test `alembic upgrade head` on clean DB |
| Using `depends_on: postgres` without healthcheck | Add `condition: service_healthy` |

---

## 22. Summary

> Use SQLAlchemy 2.0 async with the app's asyncpg engine, `SUPABASE_DB_URL`,
> one shared Base, and Alembic configured with `async_engine_from_config` and
> `connection.run_sync()`. Review autogenerated migrations and test them before
> merging. `pyproject.toml` also declares psycopg, but it is not used by these
> current paths.
