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
 * Resolve the current viewer. `cache()` dedupes this within a request, so the
 * layout + page + data layer only do ONE auth check between them.
 *
 * A real Supabase session always wins over a leftover demo cookie. We only make
 * the Supabase network call when a Supabase auth cookie is actually present, so
 * demo + signed-out navigation stays instant.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies();

  const hasSupabaseCookie = store
    .getAll()
    .some((c) => c.name.startsWith("sb-") && c.name.includes("auth-token"));

  if (hasSupabaseCookie) {
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
  }

  if (store.get("cm_demo")?.value === "1") return DEMO_USER;

  return null;
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}
