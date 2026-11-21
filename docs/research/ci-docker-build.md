# CI Docker-Build Gate — Permission-Aware Knowledge Agent

**Story:** US-57 · **Tasks:** T-58 (workflow), T-59 (breakage proof), T-61 (this note)

## What it guards

`.github/workflows/docker-build.yml` builds the backend image on every PR
and push to `main`. It catches what the test and security workflows cannot:

- a `Dockerfile` that no longer builds (`COPY` paths, base image, commands)
- dependency changes (`pyproject.toml`, `uv.lock`) that break the image install
- files the image needs but doesn't get (see `.dockerignore` interplay)

## How it works

- Triggered on `pull_request` and `push to main`, limited by **path filters**
  to Docker-affecting paths (`Dockerfile`, `docker-compose.yml`,
  `pyproject.toml`, `uv.lock`, `app/**`, `tests/**`, …).
- Docs-only changes skip the job instead of burning CI minutes or
  spuriously failing.
- It does **not** change the behavior of `test.yml` or `security.yml`.

## Proof it bites (T-59)

During US-57 the `Dockerfile` was deliberately broken (`COPY app-broken ./app`)
on a scratch commit: the gate went red as required, then the breakage was
reverted. Both runs stay in Actions history as evidence — red-then-green on
the same PR.
