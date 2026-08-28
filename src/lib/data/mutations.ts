import { prisma } from "@/lib/prisma";
import { ensureLiveUser } from "@/lib/data/live-user";

/* Every function here re-checks ownership through the semester → user chain,
   so a crafted id can never touch another student's data. */

async function activeSemester(userId: string) {
  const s = await prisma.semester.findFirst({
    where: { userId, isActive: true },
    select: { id: true },
  });
  if (!s) throw new Error("NO_SEMESTER");
  return s;
}

const PALETTE = ["#ff6a1f", "#4aa3ff", "#c98bff", "#3fd6a8", "#f0a92c", "#8b95a5"];

/* ---------- semester + profile ---------- */

export async function createSemester(input: {
  label: string;
  courses: { name: string; code?: string }[];
  profile: {
    name: string;
    college?: string;
    program?: string;
    year?: number;
    careerGoal?: string;
    studyHours?: number;
  };
}) {
  const user = await ensureLiveUser();

  await prisma.user.update({
    where: { id: user.id },
    data: { ...input.profile, onboardedAt: new Date() },
  });

  await prisma.semester.updateMany({
    where: { userId: user.id, isActive: true },
    data: { isActive: false },
  });

  const semester = await prisma.semester.create({
    data: {
      userId: user.id,
      label: input.label,
      isActive: true,
      courses: {
        create: input.courses
          .filter((c) => c.name.trim())
          .map((c, i) => ({
            name: c.name.trim(),
            code: c.code?.trim() || null,
            color: PALETTE[i % PALETTE.length],
          })),
      },
    },
    select: { id: true },
  });

  return semester.id;
}

export async function saveProfile(data: {
  name: string;
  college?: string;
  program?: string;
  year?: number;
  careerGoal?: string;
  studyHours?: number;
}) {
  const user = await ensureLiveUser();
  await prisma.user.update({ where: { id: user.id }, data });
}

/* ---------- courses ---------- */

export async function addCourse(data: { name: string; code?: string }) {
  const user = await ensureLiveUser();
  const sem = await activeSemester(user.id);
  const count = await prisma.course.count({ where: { semesterId: sem.id } });
  return prisma.course.create({
    data: {
      semesterId: sem.id,
      name: data.name.trim(),
      code: data.code?.trim() || null,
      color: PALETTE[count % PALETTE.length],
    },
  });
}

export async function updateCourse(
  id: string,
  data: { name?: string; code?: string | null; color?: string },
) {
  const user = await ensureLiveUser();
  const owned = await prisma.course.findFirst({
    where: { id, semester: { userId: user.id } },
    select: { id: true },
  });
  if (!owned) throw new Error("NOT_FOUND");
  return prisma.course.update({ where: { id }, data });
}

export async function deleteCourse(id: string) {
  const user = await ensureLiveUser();
  const owned = await prisma.course.findFirst({
    where: { id, semester: { userId: user.id } },
    select: { id: true },
  });
  if (!owned) throw new Error("NOT_FOUND");
  await prisma.course.delete({ where: { id } });
}

/* ---------- topics ---------- */

export async function addTopic(data: { courseId: string; unit?: string; title: string }) {
  const user = await ensureLiveUser();
  const course = await prisma.course.findFirst({
    where: { id: data.courseId, semester: { userId: user.id } },
    select: { id: true, _count: { select: { topics: true } } },
  });
  if (!course) throw new Error("NOT_FOUND");
  return prisma.topic.create({
    data: {
      courseId: course.id,
      unit: data.unit?.trim() || null,
      title: data.title.trim(),
      order: course._count.topics,
    },
  });
}

export async function updateTopic(
  id: string,
  data: {
    title?: string;
    unit?: string | null;
    status?: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "WEAK";
    confidence?: number;
  },
) {
  const user = await ensureLiveUser();
  const owned = await prisma.topic.findFirst({
    where: { id, course: { semester: { userId: user.id } } },
    select: { id: true },
  });
  if (!owned) throw new Error("NOT_FOUND");
  return prisma.topic.update({ where: { id }, data });
}

export async function deleteTopic(id: string) {
  const user = await ensureLiveUser();
  const owned = await prisma.topic.findFirst({
    where: { id, course: { semester: { userId: user.id } } },
    select: { id: true },
  });
  if (!owned) throw new Error("NOT_FOUND");
  await prisma.topic.delete({ where: { id } });
}

/* ---------- tasks ---------- */

type TaskInput = {
  title: string;
  courseId?: string | null;
  type?: "ASSIGNMENT" | "PROJECT" | "EXAM" | "LAB" | "STUDY_SESSION" | "CUSTOM";
  status?: "TODO" | "IN_PROGRESS" | "DONE";
  priority?: "LOW" | "MEDIUM" | "HIGH";
  dueDate?: string | null;
  estimateMins?: number | null;
};

export async function addTask(data: TaskInput) {
  const user = await ensureLiveUser();
  const sem = await activeSemester(user.id);
  if (data.courseId) await assertCourse(user.id, data.courseId);
  return prisma.task.create({
    data: {
      semesterId: sem.id,
      title: data.title.trim(),
      courseId: data.courseId || null,
      type: data.type ?? "CUSTOM",
      priority: data.priority ?? "MEDIUM",
      status: data.status ?? "TODO",
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      estimateMins: data.estimateMins ?? null,
    },
  });
}

export async function updateTask(id: string, data: TaskInput) {
  const user = await ensureLiveUser();
  const owned = await prisma.task.findFirst({
    where: { id, semester: { userId: user.id } },
    select: { id: true },
  });
  if (!owned) throw new Error("NOT_FOUND");
  if (data.courseId) await assertCourse(user.id, data.courseId);
  return prisma.task.update({
    where: { id },
    data: {
      ...("title" in data ? { title: data.title.trim() } : {}),
      ...("courseId" in data ? { courseId: data.courseId || null } : {}),
      ...("type" in data ? { type: data.type } : {}),
      ...("status" in data ? { status: data.status } : {}),
      ...("priority" in data ? { priority: data.priority } : {}),
      ...("dueDate" in data ? { dueDate: data.dueDate ? new Date(data.dueDate) : null } : {}),
      ...("estimateMins" in data ? { estimateMins: data.estimateMins ?? null } : {}),
    },
  });
}

export async function deleteTask(id: string) {
  const user = await ensureLiveUser();
  const owned = await prisma.task.findFirst({
    where: { id, semester: { userId: user.id } },
    select: { id: true },
  });
  if (!owned) throw new Error("NOT_FOUND");
  await prisma.task.delete({ where: { id } });
}

/* ---------- exams ---------- */

export async function addExam(data: {
  title: string;
  courseId?: string | null;
  date: string;
  location?: string;
}) {
  const user = await ensureLiveUser();
  const sem = await activeSemester(user.id);
  if (data.courseId) await assertCourse(user.id, data.courseId);
  return prisma.exam.create({
    data: {
      semesterId: sem.id,
      title: data.title.trim(),
      courseId: data.courseId || null,
      date: new Date(data.date),
      location: data.location?.trim() || null,
    },
  });
}

export async function updateExam(
  id: string,
  data: { title?: string; courseId?: string | null; date?: string; location?: string | null },
) {
  const user = await ensureLiveUser();
  const owned = await prisma.exam.findFirst({
    where: { id, semester: { userId: user.id } },
    select: { id: true },
  });
  if (!owned) throw new Error("NOT_FOUND");
  return prisma.exam.update({
    where: { id },
    data: {
      ...("title" in data ? { title: data.title?.trim() } : {}),
      ...("courseId" in data ? { courseId: data.courseId || null } : {}),
      ...("date" in data && data.date ? { date: new Date(data.date) } : {}),
      ...("location" in data ? { location: data.location?.trim() || null } : {}),
    },
  });
}

export async function deleteExam(id: string) {
  const user = await ensureLiveUser();
  const owned = await prisma.exam.findFirst({
    where: { id, semester: { userId: user.id } },
    select: { id: true },
  });
  if (!owned) throw new Error("NOT_FOUND");
  await prisma.exam.delete({ where: { id } });
}

/* ---------- helpers ---------- */

async function assertCourse(userId: string, courseId: string) {
  const c = await prisma.course.findFirst({
    where: { id: courseId, semester: { userId } },
    select: { id: true },
  });
  if (!c) throw new Error("NOT_FOUND");
}
