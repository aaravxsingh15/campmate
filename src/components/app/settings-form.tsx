"use client";

import { useState } from "react";
import { Button, Badge } from "@/components/ui";

type Profile = {
  name: string;
  college: string;
  program: string;
  year: number;
  careerGoal: string;
  studyHours: number;
};

export function SettingsForm({ initial, isDemo }: { initial: Profile; isDemo: boolean }) {
  const [form, setForm] = useState(initial);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function set<K extends keyof Profile>(k: K, v: Profile[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (isDemo) {
      setMsg("Demo mode — sign in with a real account to save changes.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      setMsg(res.ok ? "Saved." : "Could not save.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-4">
      {isDemo && <Badge tone="accent">Demo profile</Badge>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Name" value={form.name} onChange={(v) => set("name", v)} />
        <Input label="College / University" value={form.college} onChange={(v) => set("college", v)} />
        <Input label="Degree / Program" value={form.program} onChange={(v) => set("program", v)} />
        <Input label="Year" type="number" value={String(form.year)} onChange={(v) => set("year", Number(v))} />
        <Input label="Career goal" value={form.careerGoal} onChange={(v) => set("careerGoal", v)} />
        <Input
          label="Weekly study hours"
          type="number"
          value={String(form.studyHours)}
          onChange={(v) => set("studyHours", Number(v))}
        />
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save profile"}</Button>
        {msg && <span className="text-xs text-accent">{msg}</span>}
      </div>
    </form>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-2">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-md border border-border bg-surface-2 px-3 text-sm outline-none focus:border-accent"
      />
    </label>
  );
}
