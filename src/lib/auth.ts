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
 * Resolve the current viewer. Order:
 *  1. Real Supabase session, if present.
 *  2. Demo cookie -> demo user.
 *  3. null (signed out).
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await getSupabaseServer();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      return {
        id: user.id,
        email: user.email ?? "",
        name:
          (user.user_metadata?.name as string) ||
          user.email?.split("@")[0] ||
          "Student",
        isDemo: false,
      };
    }
  }

  const store = await cookies();
  if (store.get("cm_demo")?.value === "1") return DEMO_USER;

  return null;
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}
