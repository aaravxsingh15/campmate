"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ChevronDown, Trash2 } from "lucide-react";
import type { ActionResult } from "@/app/(app)/actions";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

/** Runs a server action, surfaces its error, refreshes the tree on success. */
export function useAction() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function invoke(fn: () => Promise<ActionResult>, onOk?: () => void) {
    setError(null);
    start(async () => {
      const res = await fn();
      if (res.ok) {
        onOk?.();
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return { invoke, pending, error, setError };
}

/** A button that expands into a form panel. */
export function Collapsible({
  label,
  children,
  open: controlledOpen,
  onOpenChange,
}: {
  label: string;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
}) {
  const [internal, setInternal] = useState(false);
  const open = controlledOpen ?? internal;
  const setOpen = onOpenChange ?? setInternal;

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
      >
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
        {label}
      </button>
      {open && <div className="mt-3 rounded-md border border-border bg-surface-2 p-3">{children}</div>}
    </div>
  );
}

export function DeleteButton({
  onDelete,
  what = "item",
}: {
  onDelete: () => Promise<ActionResult>;
  what?: string;
}) {
  const { invoke, pending } = useAction();
  const [armed, setArmed] = useState(false);

  if (!armed) {
    return (
      <button
        onClick={() => setArmed(true)}
        className="text-muted-2 hover:text-danger"
        aria-label={`Delete ${what}`}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-xs">
      <button
        onClick={() => invoke(onDelete)}
        disabled={pending}
        className="rounded bg-danger/15 px-2 py-1 font-medium text-danger hover:bg-danger/25"
      >
        {pending ? "…" : "Delete"}
      </button>
      <button onClick={() => setArmed(false)} className="px-1 text-muted-2 hover:text-foreground">
        Cancel
      </button>
    </span>
  );
}

export const fieldCls =
  "h-9 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-accent";

export function FormRow({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-end gap-2">{children}</div>;
}

export function SubmitButton({
  children,
  pending,
  disabled,
}: {
  children: React.ReactNode;
  pending: boolean;
  disabled?: boolean;
}) {
  return (
    <Button size="sm" type="submit" disabled={pending || disabled}>
      {pending ? "Saving…" : children}
    </Button>
  );
}
