# Project 14 - Knowledge Platform Frontend

**SER401 - Software Engineering Project**

A web-based knowledge platform designed to organize, manage, search, and retrieve knowledge. The project will eventually incorporate AI-powered retrieval and permission-aware access control.

The Next.js frontend application for the knowledge platform project. Built with Next.js App Router, TypeScript, and Tailwind CSS, this repository serves as the user interface connecting to the FastAPI backend.

## Technology Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) (v4 with CSS-first configuration via `globals.css`)
- **UI Components:** `shadcn/ui` (Base UI library, Vega preset)
- **Deployment:** [Vercel](https://vercel.com/)
- **Authentication & Backend Integration:** Integrated via Supabase with the FastAPI backend boundary (`SecureRetriever`).

## Two Repositories

- **Frontend:** [`this repository`](https://github.com/eldavi20/project-14-knowledge-platform-frontend) - Built with Next.js, TypeScript, Tailwind CSS v4, and shadcn/ui integration; hosted on Vercel
- **Backend:** [`project-14-knowledge-platform`](https://github.com/lanaghanim/project-14-knowledge-platform) - Built with FastAPI, Supabase, and Pinecone; Docker container

Team chat lives on **Discord**. Content sources are **Google Drive and Discord**.

## Project Structure

```text
project-14-knowledge-platform-frontend/   ← frontend repo (this repo)
│
├── app/                  ← Next.js App Router (pages, layouts, and routing)
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
│
├── components/           ← Reusable UI components (shadcn/ui integration)
│   └── ui/
│       └── button.tsx
│
├── lib/                  ← Utility functions and API client wrappers
│   └── utils.ts
│
├── public/               ← Static assets (images, icons)
│
├── .env.example
├── .env.local
├── .gitignore
├── next.config.ts
├── package.json
├── tsconfig.json
└── README.md
```

## System Architecture & Integration Flow

The system is split into two independent repositories that communicate using REST APIs and shared authentication.

The backend lives in the separate [`project-14-knowledge-platform`](https://github.com/lanaghanim/project-14-knowledge-platform) repository.

1. **Authentication:**
   - Handled directly via Supabase Auth.
   - The frontend authenticates users directly; requests passed to the backend include Supabase session tokens for server-side validation and group membership lookup.
2. **API Communication:**
   - HTTP requests are sent from the Next.js frontend (running locally or deployed on Vercel) to the FastAPI backend.
   - The frontend must be configured with the appropriate backend URL environment variable, and the backend must allow requests via CORS, due to separate hosting.
3. **Security:**
   - The system enforces retrieval-time filtering through the `SecureRetriever` component.
   - Authorized queries pass through the `SecureRetriever` component to enforce permissions before querying Pinecone or interactions with the LLM.

## Requirements

Make sure the following are installed on your local machine:

- **Node.js** (Version `>=20.9.0` recommended)
   - Managed via `nvm`
- **Package Manager:** `npm`

---

## Environment Variables

This project requires a `.env` file in the root directory based on the provided `.env.example` template. 

Copy the template file:

```bash
cp .env.example .env
```

Populate the required fields:
- `NEXT_PUBLIC_SUPABASE_URL`: The Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: The Supabase public anonymous API key.

## Local Setup Instructions

Clone the repository and navigate to the frontend directory:

```bash
git clone https://github.com/eldavi20/project-14-knowledge-platform-frontend.git
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

Install required project packages using `npm`:

```bash
npm install
```

Run the local development server:

```bash
npm run dev
```

Open `http://localhost:3000` in your browser to view the application.

Any changes made in your `app/` or `components/` directories will reload automatically.

### Adding UI Components

This project uses `shadcn/ui` for UI components.

To add new components to the library:

```bash
npx shadcn@latest add [component-name] # e.g., card, button, dialog, etc.
```

### Deployment

This repository is continuously deployed to Vercel on every push to the `main` branch.

- **Live Deployment URL:** [project-14-knowledge-platform-front.vercel.app](https://project-14-knowledge-platform-front.vercel.app)

The project is intentionally kept minimal at this stage. Additional components will be added as development progresses.
