"use client";

import { useState } from "react";
import { addTopicAction, deleteTopicAction, updateTopicAction } from "@/app/(app)/actions";
import { Badge } from "@/components/ui";
import {
  Collapsible,
  DeleteButton,
  FormRow,
  SubmitButton,
  fieldCls,
  useAction,
} from "@/components/app/action-ui";

type Status = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "WEAK";

const CYCLE: Record<Status, Status> = {
  NOT_STARTED: "IN_PROGRESS",
  IN_PROGRESS: "COMPLETED",
  COMPLETED: "WEAK",
  WEAK: "NOT_STARTED",
};
const TONE: Record<Status, "success" | "accent" | "warning" | "muted"> = {
  COMPLETED: "success",
  IN_PROGRESS: "accent",
  WEAK: "warning",
  NOT_STARTED: "muted",
};
const LABEL: Record<Status, string> = {
  COMPLETED: "Completed",
  IN_PROGRESS: "In progress",
  WEAK: "Weak",
  NOT_STARTED: "Not started",
};

export function TopicRow({
  id,
  title,
  status,
  confidence,
}: {
  id: string;
  title: string;
  status: Status;
  confidence: number;
}) {
  const { invoke, pending } = useAction();
  return (
    <li className="flex items-center justify-between rounded-md border border-border bg-surface-2 px-3 py-2 text-sm">
      <span>{title}</span>
      <span className="flex items-center gap-2">
        {confidence > 0 && <span className="font-mono text-xs text-muted-2">{confidence}%</span>}
        <button
          onClick={() => invoke(() => updateTopicAction(id, { status: CYCLE[status] }))}
          disabled={pending}
          title="Click to change status"
        >
          <Badge tone={TONE[status]}>{LABEL[status]}</Badge>
        </button>
        <DeleteButton what="topic" onDelete={() => deleteTopicAction(id)} />
      </span>
    </li>
  );
}

export function AddTopic({ courseId, units }: { courseId: string; units: string[] }) {
  const { invoke, pending, error } = useAction();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [unit, setUnit] = useState(units[0] ?? "");

  return (
    <Collapsible label="Add topic" open={open} onOpenChange={setOpen}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          invoke(
            () => addTopicAction({ courseId, title, unit: unit.trim() || undefined }),
            () => {
              setTitle("");
              setOpen(false);
            },
          );
        }}
      >
        <FormRow>
          <input
            placeholder="Unit (e.g. Unit 3)"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            list="cm-units"
            className={`${fieldCls} w-40`}
          />
          <datalist id="cm-units">
            {units.map((u) => (
              <option key={u} value={u} />
            ))}
          </datalist>
          <div className="flex-1">
            <input
              autoFocus
              placeholder="Topic title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={fieldCls}
            />
          </div>
          <SubmitButton pending={pending} disabled={!title.trim()}>
            Add
          </SubmitButton>
        </FormRow>
        {error && <p className="mt-2 text-xs text-danger">{error}</p>}
      </form>
    </Collapsible>
  );
}
