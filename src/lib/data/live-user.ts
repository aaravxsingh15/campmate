import { cache } from "react";
import { requireUser, type SessionUser } from "@/lib/auth";
import { isLiveMode } from "@/lib/env";

/**
 * Resolve the current user AND make sure a matching row exists in our database.
 * Supabase owns authentication; the first time a confirmed user hits the app we
 * mirror them into `User` so foreign keys work.
 *
 * `cache()` dedupes within a request. Most requests just read (1 query); the
 * insert only runs on a brand-new user.
 *
 * Throws `DEMO_READ_ONLY` for the demo user and `LIVE_MODE_DISABLED` when the
 * database isn't configured — callers turn these into friendly messages.
 */
export const ensureLiveUser = cache(async () => {
  const session: SessionUser = await requireUser();
  if (session.isDemo) throw new Error("DEMO_READ_ONLY");
  if (!isLiveMode) throw new Error("LIVE_MODE_DISABLED");

  const { prisma } = await import("@/lib/prisma");

  const existing = await prisma.user.findUnique({ where: { id: session.id } });
  if (existing) return existing;

  return prisma.user.create({
    data: { id: session.id, email: session.email, name: session.name },
  });
});
