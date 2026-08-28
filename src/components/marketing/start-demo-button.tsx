"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui";

export function StartDemoButton({ label = "Explore the demo" }: { label?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function start() {
    setBusy(true);
    await fetch("/api/auth/demo", { method: "POST" });
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Button variant="outline" size="lg" onClick={start} disabled={busy}>
      {busy ? "Loading…" : label}
    </Button>
  );
}
