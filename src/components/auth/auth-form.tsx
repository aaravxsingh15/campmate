"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Badge } from "@/components/ui";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/env";
import { StartDemoButton } from "@/components/marketing/start-demo-button";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isSignup = mode === "signup";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setError("Accounts aren't configured on this deployment yet. Try the demo below.");
      return;
    }
    setBusy(true);
    try {
      // Drop any leftover demo session so the real account takes over cleanly.
      await fetch("/api/auth/demo", { method: "DELETE" }).catch(() => {});

      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
        // Email confirmation disabled → session is returned, go straight in.
        if (data.session) {
          router.push("/onboarding");
          router.refresh();
          return;
        }
        setNotice("Account created. Check your email to confirm, then sign in.");
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push("/onboarding");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold">
          {isSignup ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-1 text-sm text-muted-2">
          {isSignup ? "Start organising your semester." : "Sign in to your workspace."}
        </p>
      </div>

      {!isSupabaseConfigured && (
        <Badge tone="warning">Auth not configured — demo mode available</Badge>
      )}

      <form onSubmit={submit} className="space-y-3">
        {isSignup && (
          <input
            required
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputCls}
          />
        )}
        <input
          required
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputCls}
        />
        <input
          required
          type="password"
          placeholder="Password"
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputCls}
        />
        {error && <p className="text-xs text-danger">{error}</p>}
        {notice && <p className="text-xs text-success">{notice}</p>}
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Please wait…" : isSignup ? "Create account" : "Sign in"}
        </Button>
      </form>

      <div className="flex items-center gap-3 text-xs text-muted-2">
        <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
      </div>
      <StartDemoButton label="Explore the demo instead" />

      <p className="text-center text-xs text-muted-2">
        {isSignup ? (
          <>Already have an account? <Link href="/login" className="text-accent">Sign in</Link></>
        ) : (
          <>New to Camp Mate? <Link href="/signup" className="text-accent">Create an account</Link></>
        )}
      </p>
    </div>
  );
}

const inputCls =
  "h-10 w-full rounded-md border border-border bg-surface-2 px-3 text-sm outline-none focus:border-accent";
