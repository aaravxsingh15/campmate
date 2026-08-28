# Camp Mate

**Upload your semester. Camp Mate organizes it.**

Camp Mate is a personal academic operating system for college students. Upload your
syllabus and notes once, and Camp Mate turns them into an organized semester —
courses, topics, deadlines, exams, study plans, practice questions, analytics, and
an AI assistant grounded in your own material.

> **Status — v1 foundation.** This repository contains a runnable foundation:
> the full design system, database schema, auth, demo mode, and every core screen
> wired to a data layer. Document text-extraction, vector RAG, and quiz persistence
> are scaffolded with real interfaces and are being built out in follow-up work.
> See [Roadmap](#roadmap). Nothing here is faked — demo data is clearly labelled and
> derived metrics are computed from it.

---

## Features

| Area | What works today |
| --- | --- |
| **Onboarding** | Multi-step flow: profile → multi-file upload → processing animation → review extracted counts before commit |
| **Dashboard** | Greeting, semester progress, per-course progress, upcoming deadlines, next-exam countdown + readiness, weak topics, recommended actions, deadline-cluster warning — all computed from your data |
| **My Semester** | Course workspace, syllabus by unit with topic status/confidence, linked documents, assignments, quiz history, exams, academic calendar |
| **Documents** | Categorised document table with status, drag-and-drop upload (live mode) |
| **Ask Camp Mate** | Chat that retrieves matching topics/documents, labels answers *Based on your material* vs *General explanation*, shows sources. Uses your configured AI provider when set |
| **Practice** | Config a session (course / difficulty / count / type) or **Surprise Me** (weighted to weak topics). Interactive quiz with navigation, scoring, explanations, per-topic result |
| **Planner** | Tasks grouped Overdue / Today / This week / Later, with deadline-cluster intelligence |
| **Analytics** | Semester + accuracy stats, syllabus-vs-accuracy bar chart, quiz trend, topic-completion donut, strongest/weakest topics |
| **Search** | Cross-entity search over courses, topics, documents, tasks, exams |
| **Demo mode** | One click loads a full labelled sample semester — no account needed |
| **Auth** | Supabase email/password sign-up + sign-in; demo cookie fallback |

## Architecture

```
                 Camp Mate (Next.js on Vercel)
                          │
      ┌───────────────────┼───────────────────┐
      ▼                   ▼                   ▼
  Supabase Postgres   AI provider        Supabase Storage
  (Prisma ORM)        (OpenAI-compatible) (uploaded documents)
```

- **App Router**, server components read through a single `getWorkspace()` data
  layer that serves the **demo dataset** when the database isn't configured and
  **Prisma** queries when it is.
- **`src/proxy.ts`** (Next 16 middleware) guards `/dashboard`, `/semester`, … —
  redirecting to `/login` unless there's a Supabase session or a demo cookie.
- **AI** goes through `src/lib/ai/provider.ts` — any OpenAI-compatible endpoint.
  Missing credentials degrade gracefully (templated answers, no crash).
- **RAG** retrieval is `src/lib/rag/retrieve.ts` (keyword today; `pgvector` over
  `DocumentChunk` next). It never returns a source that doesn't exist.

## Tech stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · Prisma 6 · Supabase
(`@supabase/ssr`) · Recharts · Lucide · Zod

## Local setup

```bash
npm install
cp .env.example .env.local   # optional — app runs in demo mode with no config
npm run dev
```

Open http://localhost:3000 and click **Explore the demo**.

## Environment variables

All optional — the app boots in demo mode with none set. See `.env.example` for the
annotated list. Summary:

| Var | Enables |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Real accounts (auth) |
| `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET` | Document uploads |
| `DATABASE_URL`, `DIRECT_URL` | Persistence (Prisma → Supabase Postgres) |
| `AI_API_KEY`, `AI_MODEL`, `AI_BASE_URL`, `AI_EMBEDDING_MODEL` | Live AI answers + embeddings |
| `NEXT_PUBLIC_SITE_URL` | Auth redirect + metadata base |

Secrets are only read server-side. Only `NEXT_PUBLIC_*` reaches the browser.

## Database setup

1. Create a Supabase project. Copy the connection strings into `DATABASE_URL`
   (pooled) and `DIRECT_URL` (direct).
2. Push the schema: `npm run db:push`
3. Enable `pgvector` (SQL editor): `create extension if not exists vector;`
4. In **Storage**, create a private bucket named `documents`.

`npm run db:studio` opens Prisma Studio.

## AI setup

Set `AI_API_KEY` + `AI_MODEL` to any OpenAI-compatible provider (OpenAI, OpenRouter,
Groq, Together, or a local server via `AI_BASE_URL`). Without them, Ask Camp Mate
returns retrieval-only answers and Practice uses templated questions.

## Storage setup

Uploaded documents go to the Supabase Storage bucket named by
`SUPABASE_STORAGE_BUCKET` (default `documents`). Vercel's filesystem is ephemeral —
nothing is written to local disk.

## Development commands

```bash
npm run dev         # dev server
npm run build       # prisma generate + production build
npm run start       # serve the production build
npm run lint        # eslint
npm run typecheck   # tsc --noEmit
npm run db:push     # sync Prisma schema to the database
```

## Production build

```bash
npm run build && npm run start
```

## Vercel deployment

1. Push this repo to `aaravxsingh15/campmate`.
2. In **vercel.com/singhaarav1879-4684s-projects → Add New → Project**, import the repo.
3. Framework preset: **Next.js** (auto-detected). No build overrides — `postinstall`
   runs `prisma generate`.
4. Add the environment variables from `.env.example` (at minimum the Supabase +
   `DATABASE_URL` set for live mode; none required for a demo-only deploy).
5. Set `NEXT_PUBLIC_SITE_URL` to the deployment URL and add it to Supabase
   **Auth → URL Configuration → Redirect URLs**.
6. Deploy.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Everything shows "Demo data" | `DATABASE_URL` + Supabase keys not set, or the user has no semester |
| `PrismaClientInitializationError` on build | `prisma generate` didn't run — it's in `postinstall` and `build`; check the install log |
| Ask returns "connect an AI provider" | Set `AI_API_KEY` and `AI_MODEL` |
| Upload returns 501 | Live mode not configured (needs Supabase + `DATABASE_URL`) |
| Auth redirect loops | `NEXT_PUBLIC_SITE_URL` mismatch with the Supabase redirect URL |

## Demo mode

Click **Explore the demo** on the landing page. It sets a short-lived `cm_demo`
cookie and loads a full sample semester — 6 courses, 47 topics, assignments, exams,
quiz attempts, analytics — all badged **Demo data**. Sign out to clear it.

## Roadmap

- [ ] PDF/DOCX/TXT text extraction + cleaning + chunking
- [ ] `pgvector` embeddings + similarity retrieval for Ask Camp Mate
- [ ] Persisted quiz attempts → live `TopicPerformance`
- [ ] Editable extracted syllabus (inline topic CRUD)
- [ ] AI study-planner generation from remaining syllabus + study hours
- [ ] Per-exam preparation page with generated practice
