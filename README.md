# Project 14 — Knowledge Platform Frontend

**SER401 — Software Engineering Project**

A web-based knowledge platform designed to organize, manage, search, and retrieve knowledge. The project will eventually incorporate AI-powered retrieval and permission-aware access control.

The Next.js frontend application for the knowledge platform project. Built with Next.js App Router, TypeScript, and Tailwind CSS, this repository serves as the user interface connecting to the FastAPI backend.

## Technology Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Deployment:** [Vercel](https://vercel.com/)

## Two Repositories

- **Frontend: this repo** `[project-14-frontend](https://github.com/eldavi20/project-14-knowledge-platform-frontend)` — Next.js + shadcn/ui, hosted on Vercel
- **Backend:** (`[project-14-knowledge-platform](https://github.com/lanaghanim/project-14-knowledge-platform)`) — FastAPI + Supabase + Pinecone, Docker container

Team chat lives on **Discord**. Content sources are **Google Drive and Discord**.

The backend lives in the separate `[project-14-knowledge-platform](https://github.com/lanaghanim/project-14-knowledge-platform)` repo (FastAPI + Supabase + Pinecone, Docker container).

## Requirements

Make sure the following are installed on your local machine:

- **Node.js** (Version `>=20.9.0` recommended)
- **npm**

---

## Local Setup Instructions

Clone the repository:

```bash
git clone [https://github.com/eldavi20/project-14-knowledge-platform-frontend.git](https://github.com/eldavi20/project-14-knowledge-platform-frontend.git)
cd project-14-knowledge-platform-frontend
```

Ensure you are using the correct version of Node.js:

```bash
node -v
```

If you are using an older version, switch to version 20 by running:

```bash
nvm install 20 && nvm use 20
```

Install required project packages using npm:

```bash
npm install
```

Create a local environment variables file by copying the example template:

```bash
cp .env.example .env.local
```

Start the local development server:

```bash
npm run dev
```

Open `http://localhost:3000` in your browser to view the application. Any changes made in your `app/` or `components/` directories will reload automatically.

### Deployment

This repository is continuously deployed to Vercel on every push to the `main` branch.

- **Live Deployment URL:** project-14-knowledge-platform-front.vercel.app

The project is intentionally kept minimal at this stage. Additional components will be added as development progresses.
