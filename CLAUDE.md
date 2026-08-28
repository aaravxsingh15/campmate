# Camp Mate — notes for Claude

Personal academic OS for students. Next.js 16 (App Router) · TS · Tailwind v4 ·
Prisma 6 · Supabase · deployed on Vercel.

## Principles
- **Never fabricate.** Demo data is labelled "Demo data". Derived numbers are
  computed, not hard-coded. Ask Camp Mate never cites a document that doesn't exist.
- App must boot with zero env vars (demo mode). Features unlock via env:
  `isSupabaseConfigured`, `isDatabaseConfigured`, `isAIConfigured`, `isLiveMode`
  in `src/lib/env.ts`.

## Layout
- `src/lib/data/workspace.ts` — the ONLY data entry point. `getWorkspace()` returns
  demo data or Prisma reads; pure derived selectors live here too.
- `src/lib/demo/data.ts` — sample semester (dates relative to now).
- `src/lib/auth.ts` — `getSessionUser()` (Supabase session → demo cookie → null).
- `src/proxy.ts` — route guard (Next 16 renamed middleware → proxy).
- `src/app/(app)/*` — authed screens inside `AppShell`.
- `src/app/(auth)/*`, `src/app/onboarding` — outside the shell.
- `src/lib/ai/provider.ts` — OpenAI-compatible chat/embeddings, throws when unset.
- `src/lib/rag/retrieve.ts` — retrieval (keyword now, pgvector later).
- `src/lib/documents/pipeline.ts` — Supabase Storage upload + Document rows.

## Commands
`npm run dev` · `npm run build` · `npm run typecheck` · `npm run db:push`

## Design
Black + orange. Tokens in `src/app/globals.css` (`--background`, `--surface*`,
`--accent`…). Primitives in `src/components/ui.tsx`. Orange = actions, progress,
warnings, selected nav only.
