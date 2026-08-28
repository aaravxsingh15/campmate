"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import * as m from "@/lib/data/mutations";

export type ActionResult = { ok: true } | { ok: false; error: string };

const FRIENDLY: Record<string, string> = {
  DEMO_READ_ONLY: "Demo mode is read-only. Create an account to save changes.",
  LIVE_MODE_DISABLED: "The database isn't configured on this deployment yet.",
  NO_SEMESTER: "Create your semester first.",
  NOT_FOUND: "That item doesn't exist or isn't yours.",
  UNAUTHENTICATED: "Please sign in.",
};

async function run(fn: () => Promise<unknown>, ...paths: string[]): Promise<ActionResult> {
  try {
    await fn();
    for (const p of paths) revalidatePath(p);
    return { ok: true };
  } catch (e) {
    const key = e instanceof Error ? e.message : "";
    return { ok: false, error: FRIENDLY[key] ?? "Something went wrong. Please retry." };
  }
}

/* ---------- onboarding / semester ---------- */

const semesterSchema = z.object({
  label: z.string().min(2).max(80),
  courses: z
    .array(z.object({ name: z.string().max(120), code: z.string().max(24).optional() }))
    .max(20),
  profile: z.object({
    name: z.string().min(1).max(120),
    college: z.string().max(160).optional(),
    program: z.string().max(160).optional(),
    year: z.number().int().min(1).max(8).optional(),
    careerGoal: z.string().max(200).optional(),
    studyHours: z.number().int().min(0).max(120).optional(),
  }),
});

export async function createSemesterAction(input: unknown): Promise<ActionResult> {
  const parsed = semesterSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the form." };
  return run(
    () => m.createSemester(parsed.data),
    "/dashboard",
    "/semester",
    "/planner",
    "/analytics",
    "/settings",
  );
}

const profileSchema = semesterSchema.shape.profile;

export async function saveProfileAction(input: unknown): Promise<ActionResult> {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the form." };
  return run(() => m.saveProfile(parsed.data), "/settings", "/dashboard");
}

/* ---------- courses ---------- */

export async function addCourseAction(input: unknown): Promise<ActionResult> {
  const parsed = z
    .object({ name: z.string().min(1).max(120), code: z.string().max(24).optional() })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "Course name is required." };
  return run(() => m.addCourse(parsed.data), "/semester", "/dashboard");
}

export async function updateCourseAction(id: string, input: unknown): Promise<ActionResult> {
  const parsed = z
    .object({
      name: z.string().min(1).max(120).optional(),
      code: z.string().max(24).nullable().optional(),
      color: z.string().max(9).optional(),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid course." };
  return run(() => m.updateCourse(id, parsed.data), "/semester", `/semester/${id}`, "/dashboard");
}

export async function deleteCourseAction(id: string): Promise<ActionResult> {
  return run(() => m.deleteCourse(id), "/semester", "/dashboard", "/analytics");
}

/* ---------- topics ---------- */

export async function addTopicAction(input: unknown): Promise<ActionResult> {
  const parsed = z
    .object({
      courseId: z.string(),
      unit: z.string().max(40).optional(),
      title: z.string().min(1).max(160),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "Topic title is required." };
  return run(
    () => m.addTopic(parsed.data),
    `/semester/${(parsed.data as { courseId: string }).courseId}`,
    "/semester",
    "/dashboard",
    "/analytics",
  );
}

export async function updateTopicAction(id: string, input: unknown): Promise<ActionResult> {
  const parsed = z
    .object({
      title: z.string().min(1).max(160).optional(),
      unit: z.string().max(40).nullable().optional(),
      status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "WEAK"]).optional(),
      confidence: z.number().int().min(0).max(100).optional(),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid topic." };
  return run(() => m.updateTopic(id, parsed.data), "/semester", "/dashboard", "/analytics");
}

export async function deleteTopicAction(id: string): Promise<ActionResult> {
  return run(() => m.deleteTopic(id), "/semester", "/dashboard", "/analytics");
}

/* ---------- tasks ---------- */

const taskSchema = z.object({
  title: z.string().min(1).max(200),
  courseId: z.string().nullable().optional(),
  type: z.enum(["ASSIGNMENT", "PROJECT", "EXAM", "LAB", "STUDY_SESSION", "CUSTOM"]).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  dueDate: z.string().nullable().optional(),
  estimateMins: z.number().int().min(0).max(6000).nullable().optional(),
});

export async function addTaskAction(input: unknown): Promise<ActionResult> {
  const parsed = taskSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Task title is required." };
  return run(() => m.addTask(parsed.data), "/planner", "/dashboard");
}

export async function updateTaskAction(id: string, input: unknown): Promise<ActionResult> {
  const parsed = taskSchema.partial({ title: true }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid task." };
  return run(() => m.updateTask(id, parsed.data as z.infer<typeof taskSchema>), "/planner", "/dashboard");
}

export async function deleteTaskAction(id: string): Promise<ActionResult> {
  return run(() => m.deleteTask(id), "/planner", "/dashboard");
}

/* ---------- exams ---------- */

const examSchema = z.object({
  title: z.string().min(1).max(160),
  courseId: z.string().nullable().optional(),
  date: z.string(),
  location: z.string().max(120).optional(),
});

export async function addExamAction(input: unknown): Promise<ActionResult> {
  const parsed = examSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Exam title and date are required." };
  return run(() => m.addExam(parsed.data), "/semester", "/dashboard", "/analytics");
}

export async function updateExamAction(id: string, input: unknown): Promise<ActionResult> {
  const parsed = examSchema.partial().safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid exam." };
  return run(() => m.updateExam(id, parsed.data), "/semester", "/dashboard", "/analytics");
}

export async function deleteExamAction(id: string): Promise<ActionResult> {
  return run(() => m.deleteExam(id), "/semester", "/dashboard", "/analytics");
}
