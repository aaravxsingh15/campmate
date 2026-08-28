"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    await getSupabaseBrowser()?.auth.signOut();
    await fetch("/api/auth/demo", { method: "DELETE" });
    router.push("/");
    router.refresh();
  }

  return (
    <Button variant="outline" onClick={signOut} disabled={busy}>
      {busy ? "Signing out…" : "Sign out"}
    </Button>
  );
}
