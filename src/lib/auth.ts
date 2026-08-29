import { cache } from "react";
import { cookies } from "next/headers";
import { getSupabaseServer } from "@/lib/supabase/server";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  isDemo: boolean;
};

const DEMO_USER: SessionUser = {
  id: "demo-user",
  email: "demo@campmate.app",
  name: "Aarav Sharma",
  isDemo: true,
};

/**
 * Resolve the current viewer. `cache()` dedupes this within a single request,
 * so the layout + page + data layer only do ONE auth check between them.
 *  1. Demo cookie -> demo user (no network).
 *  2. Real Supabase session.
 *  3. null (signed out).
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies();
  if (store.get("cm_demo")?.value === "1") return DEMO_USER;

  const supabase = await getSupabaseServer();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  return {
    id: user.id,
    email: user.email ?? "",
    name:
      (user.user_metadata?.name as string) ||
      user.email?.split("@")[0] ||
      "Student",
    isDemo: false,
  };
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}
