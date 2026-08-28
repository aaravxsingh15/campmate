"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { addTaskAction, deleteTaskAction, updateTaskAction } from "@/app/(app)/actions";
import {
  Collapsible,
  DeleteButton,
  FormRow,
  SubmitButton,
  fieldCls,
  useAction,
} from "@/components/app/action-ui";

export function TaskCheckbox({ id, done }: { id: string; done: boolean }) {
  const { invoke, pending } = useAction();
  return (
    <button
      onClick={() => invoke(() => updateTaskAction(id, { status: done ? "TODO" : "DONE" }))}
      disabled={pending}
      aria-label={done ? "Mark not done" : "Mark done"}
      className={`grid h-4 w-4 shrink-0 place-items-center rounded border ${
        done ? "border-success bg-success/20 text-success" : "border-border-strong"
      }`}
    >
      {done && <Check className="h-3 w-3" />}
    </button>
  );
}

export function DeleteTask({ id }: { id: string }) {
  return <DeleteButton what="task" onDelete={() => deleteTaskAction(id)} />;
}

export function AddTask({ courses }: { courses: { id: string; name: string }[] }) {
  const { invoke, pending, error } = useAction();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [courseId, setCourseId] = useState("");
  const [type, setType] = useState("ASSIGNMENT");
  const [priority, setPriority] = useState("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [hours, setHours] = useState("");

  return (
    <Collapsible label="Add task" open={open} onOpenChange={setOpen}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          invoke(
            () =>
              addTaskAction({
                title,
                courseId: courseId || null,
                type: type as "ASSIGNMENT",
                priority: priority as "MEDIUM",
                dueDate: dueDate || null,
                estimateMins: hours ? Math.round(Number(hours) * 60) : null,
              }),
            () => {
              setTitle("");
              setDueDate("");
              setHours("");
              setOpen(false);
            },
          );
        }}
        className="space-y-2"
      >
        <input
          autoFocus
          placeholder="Task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={fieldCls}
        />
        <FormRow>
          <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className={`${fieldCls} flex-1`}>
            <option value="">No course</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select value={type} onChange={(e) => setType(e.target.value)} className={`${fieldCls} w-36`}>
            {["ASSIGNMENT", "PROJECT", "EXAM", "LAB", "STUDY_SESSION", "CUSTOM"].map((t) => (
              <option key={t} value={t}>{t.replace("_", " ").toLowerCase()}</option>
            ))}
          </select>
        </FormRow>
        <FormRow>
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className={`${fieldCls} w-28`}>
            {["LOW", "MEDIUM", "HIGH"].map((p) => (
              <option key={p} value={p}>{p.toLowerCase()}</option>
            ))}
          </select>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={`${fieldCls} w-40`} />
          <input
            type="number"
            step="0.5"
            min="0"
            placeholder="hrs"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            className={`${fieldCls} w-20`}
          />
          <SubmitButton pending={pending} disabled={!title.trim()}>
            Add
          </SubmitButton>
        </FormRow>
        {error && <p className="text-xs text-danger">{error}</p>}
      </form>
    </Collapsible>
  );
}
