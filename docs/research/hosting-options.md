# Hosting Options — Permission-Aware Knowledge Agent

**Project:** SER 401 – Project 14: Permission-Aware Knowledge Agent
**Date:** October 2026
**Purpose:** Compare Docker-capable backend hosting options under a ~$20 API/hosting budget and record the recommendation. Referenced by `BUILD_PLAN.md` (Phase 0/1 Docker setup).

> Prices and free tiers change often — re-check the linked pricing pages before committing. Facts below were verified October 2026.

---

## 1. Shortlist

| Platform | Why shortlisted |
|---|---|
| Railway | Docker-native, simplest deploy from repo, usage-based pricing |
| Google Cloud Run | Serverless containers, generous request-based free tier |
| Render | Simple Docker deploys, free tier for experiments |
| Koyeb | Global edge containers, Docker support, simple setup |
| Fly.io | Containers close to users, straightforward `fly deploy` |

Out of scope: Vercel (frontend only — the Next.js app already lives there) and Supabase (database + auth, already decided).

---

## 2. Comparison

| Criteria | Railway | Google Cloud Run | Render | Koyeb | Fly.io |
|---|---|---|---|---|---|
| Free tier | Trial credit, then pay-per-use (~$5 minimum spend pattern) | 2M requests/month + 360k GB-seconds free, then pay-per-use | Free web services (750 hrs/month, spin down when idle) | Free tier instances (sleep when idle) | Small free resource allowances; paid beyond that |
| Idle behavior | Always-on unless stopped (billed for uptime) | Scales to zero (cold starts possible) | Free tier sleeps after inactivity (cold starts) | Free tier sleeps when idle | Machines stop when idle on free allowances (cold starts) |
| Docker support | First-class (Dockerfile or Nixpacks) | Native (any OCI container) | Dockerfile / Docker Compose blueprints | Native container deploys | Native (`fly launch` from Dockerfile) |
| Setup effort | Lowest — connect repo, set env vars, deploy | Medium — GCP project, IAM, `gcloud run deploy` | Low — connect repo, Dockerfile path, env vars | Low — connect repo or registry, env vars | Low-medium — CLI-driven, `fly.toml` config |
| Fit for capstone | Best fit | Strong alternative | Fallback | Viable | Viable |

Notes:

- "Free tier" rows describe the cheapest way to run a small always-available-or-not API; paid usage on any of these fits the ~$20 budget.
- Cold starts (scale-to-zero/sleep) only affect the first request after idle — acceptable for a demo, worth noting in the final report.
- Alembic migrations run in the container start command (`alembic upgrade head && uvicorn ...`), so any option must allow a release/start command — all five do.

---

## 3. Recommendation

1. **Railway (primary).** Simplest Docker deploy, no Kubernetes/IAM overhead, usage-based billing fits the budget, and the team can redeploy from the backend repo in minutes.
2. **Google Cloud Run (alternative).** Pick this if the team wants scale-to-zero cost savings and is comfortable with GCP setup; cold starts are the trade-off.
3. **Render (fallback).** If Railway or Cloud Run is blocked (account, quota, or region issues), Render's Docker support gets the same container running with minimal changes.

---

## 4. Sources

- Railway pricing: https://railway.app/pricing
- Cloud Run pricing: https://cloud.google.com/run/pricing
- Render pricing: https://render.com/pricing
- Koyeb pricing: https://www.koyeb.com/pricing
- Fly.io pricing: https://fly.io/pricing
