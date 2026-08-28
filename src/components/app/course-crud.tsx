"use client";

import { useState } from "react";
import {
  addCourseAction,
  addExamAction,
  deleteCourseAction,
} from "@/app/(app)/actions";
import {
  Collapsible,
  DeleteButton,
  FormRow,
  SubmitButton,
  fieldCls,
  useAction,
} from "@/components/app/action-ui";

export function AddCourse() {
  const { invoke, pending, error } = useAction();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  return (
    <Collapsible label="Add course" open={open} onOpenChange={setOpen}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          invoke(() => addCourseAction({ name, code: code || undefined }), () => {
            setName("");
            setCode("");
            setOpen(false);
          });
        }}
      >
        <FormRow>
          <div className="flex-1">
            <input
              autoFocus
              placeholder="Course name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={fieldCls}
            />
          </div>
          <input
            placeholder="Code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className={`${fieldCls} w-28`}
          />
          <SubmitButton pending={pending} disabled={!name.trim()}>
            Add
          </SubmitButton>
        </FormRow>
        {error && <p className="mt-2 text-xs text-danger">{error}</p>}
      </form>
    </Collapsible>
  );
}

export function DeleteCourse({ id }: { id: string }) {
  return <DeleteButton what="course" onDelete={() => deleteCourseAction(id)} />;
}

export function AddExam({ courses }: { courses: { id: string; name: string }[] }) {
  const { invoke, pending, error } = useAction();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [courseId, setCourseId] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");

  return (
    <Collapsible label="Add exam" open={open} onOpenChange={setOpen}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          invoke(
            () =>
              addExamAction({
                title,
                courseId: courseId || null,
                date,
                location: location || undefined,
              }),
            () => {
              setTitle("");
              setDate("");
              setLocation("");
              setOpen(false);
            },
          );
        }}
        className="space-y-2"
      >
        <input
          autoFocus
          placeholder="Exam title"
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
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={`${fieldCls} w-40`}
          />
        </FormRow>
        <FormRow>
          <input
            placeholder="Location (optional)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className={`${fieldCls} flex-1`}
          />
          <SubmitButton pending={pending} disabled={!title.trim() || !date}>
            Add exam
          </SubmitButton>
        </FormRow>
        {error && <p className="text-xs text-danger">{error}</p>}
      </form>
    </Collapsible>
  );
}

export { DeleteButton as GenericDelete };
