import { requireUser, type SessionUser } from "@/lib/auth";
import { isLiveMode } from "@/lib/env";

/**
 * Resolve the current user AND make sure a matching row exists in our database.
 * Supabase owns authentication; the first time a confirmed user hits the app we
 * mirror them into `User` so foreign keys work.
 *
 * Throws `DEMO_READ_ONLY` for the demo user and `LIVE_MODE_DISABLED` when the
 * database isn't configured — callers turn these into friendly messages.
 */
export async function ensureLiveUser(): Promise<{
  id: string;
  email: string;
  name: string;
}> {
  const session: SessionUser = await requireUser();
  if (session.isDemo) throw new Error("DEMO_READ_ONLY");
  if (!isLiveMode) throw new Error("LIVE_MODE_DISABLED");

  const { prisma } = await import("@/lib/prisma");
  const user = await prisma.user.upsert({
    where: { id: session.id },
    update: { email: session.email },
    create: { id: session.id, email: session.email, name: session.name },
    select: { id: true, email: true, name: true },
  });
  return user;
}
