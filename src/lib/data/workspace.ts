import { getSessionUser } from "@/lib/auth";
import { isLiveMode } from "@/lib/env";
import { clampPct, daysUntil } from "@/lib/utils";
import {
  demoCourses,
  demoDocuments,
  demoExams,
  demoProfile,
  demoQuizzes,
  demoSemester,
  demoTasks,
  type DemoCourse,
  type DemoDocument,
  type DemoExam,
  type DemoQuiz,
  type DemoTask,
} from "@/lib/demo/data";

export type Workspace = {
  isDemo: boolean;
  profile: typeof demoProfile;
  semester: typeof demoSemester;
  courses: DemoCourse[];
  tasks: DemoTask[];
  exams: DemoExam[];
  documents: DemoDocument[];
  quizzes: DemoQuiz[];
};

const STATUS_WEIGHT: Record<string, number> = {
  COMPLETED: 1,
  IN_PROGRESS: 0.5,
  WEAK: 0.35,
  NOT_STARTED: 0,
};

/**
 * The single entry point every page uses. Live mode reads Prisma; otherwise
 * (and always for the demo user) it serves the labelled demo workspace.
 */
export async function getWorkspace(): Promise<Workspace | null> {
  const user = await getSessionUser();
  if (!user) return null;

  if (user.isDemo || !isLiveMode) {
    return {
      isDemo: true,
      profile: demoProfile,
      semester: demoSemester,
      courses: demoCourses,
      tasks: demoTasks,
      exams: demoExams,
      documents: demoDocuments,
      quizzes: demoQuizzes,
    };
  }

  // Live mode — lazy import so demo deployments never load Prisma.
  const { prisma } = await import("@/lib/prisma");
  const { ensureLiveUser } = await import("@/lib/data/live-user");
  await ensureLiveUser(); // mirror the Supabase user into our DB on first hit
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  const semester = await prisma.semester.findFirst({
    where: { userId: user.id, isActive: true },
    include: {
      courses: { include: { topics: { orderBy: { order: "asc" } } } },
      exams: true,
      tasks: true,
    },
  });

  if (!semester) return null;

  const documents = await prisma.document.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  const quizzes = await prisma.quizAttempt.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return {
    isDemo: false,
    profile: {
      name: dbUser?.name ?? user.name,
      college: dbUser?.college ?? "",
      program: dbUser?.program ?? "",
      year: dbUser?.year ?? 0,
      careerGoal: dbUser?.careerGoal ?? "",
      studyHours: dbUser?.studyHours ?? 0,
    },
    semester: {
      id: semester.id,
      label: semester.label,
      startDate: (semester.startDate ?? new Date()).toISOString(),
      endDate: (semester.endDate ?? new Date()).toISOString(),
    },
    courses: semester.courses.map((c) => ({
      id: c.id,
      name: c.name,
      code: c.code ?? "",
      color: c.color ?? "#ff6a1f",
      topics: c.topics.map((tp) => ({
        id: tp.id,
        unit: tp.unit ?? "",
        title: tp.title,
        status: tp.status,
        confidence: tp.confidence,
      })),
    })),
    tasks: semester.tasks.map((tk) => ({
      id: tk.id,
      title: tk.title,
      courseId: tk.courseId,
      type: tk.type,
      status: tk.status,
      priority: tk.priority,
      dueDate: tk.dueDate?.toISOString() ?? null,
      estimateMins: tk.estimateMins,
    })),
    exams: semester.exams.map((ex) => ({
      id: ex.id,
      title: ex.title,
      courseId: ex.courseId ?? "",
      date: ex.date.toISOString(),
      location: ex.location ?? "",
    })),
    documents: documents.map((d) => ({
      id: d.id,
      filename: d.filename,
      courseId: d.courseId,
      type: d.type,
      status: d.status,
      sizeBytes: d.sizeBytes,
      pageCount: d.pageCount ?? 0,
      createdAt: d.createdAt.toISOString(),
    })),
    quizzes: quizzes.map((q) => ({
      id: q.id,
      label: q.label,
      courseId: q.courseId ?? "",
      scorePct: q.scorePct,
      correctCount: q.correctCount,
      totalCount: q.totalCount,
      createdAt: q.createdAt.toISOString(),
    })),
  };
}

/* ---------- derived selectors (pure) ---------- */

export function courseProgress(course: DemoCourse) {
  if (!course.topics.length) return 0;
  const sum = course.topics.reduce(
    (acc, t) => acc + (STATUS_WEIGHT[t.status] ?? 0),
    0,
  );
  return clampPct((sum / course.topics.length) * 100);
}

export function semesterProgress(ws: Workspace) {
  if (!ws.courses.length) return 0;
  return clampPct(
    ws.courses.reduce((acc, c) => acc + courseProgress(c), 0) / ws.courses.length,
  );
}

export function weakTopics(ws: Workspace) {
  return ws.courses
    .flatMap((c) => c.topics.map((t) => ({ ...t, course: c })))
    .filter((t) => t.status === "WEAK" || (t.confidence > 0 && t.confidence < 45))
    .sort((a, b) => a.confidence - b.confidence)
    .slice(0, 6);
}

export function upcomingDeadlines(ws: Workspace, limit = 5) {
  return ws.tasks
    .filter((t) => t.status !== "DONE" && t.dueDate)
    .sort((a, b) => +new Date(a.dueDate!) - +new Date(b.dueDate!))
    .slice(0, limit);
}

export function nextExam(ws: Workspace) {
  return [...ws.exams]
    .filter((e) => daysUntil(e.date) >= 0)
    .sort((a, b) => +new Date(a.date) - +new Date(b.date))[0];
}

export function courseById(ws: Workspace, id: string | null) {
  return ws.courses.find((c) => c.id === id) ?? null;
}

export function quizAccuracy(ws: Workspace, courseId?: string) {
  const qs = courseId
    ? ws.quizzes.filter((q) => q.courseId === courseId)
    : ws.quizzes;
  if (!qs.length) return 0;
  const c = qs.reduce((a, q) => a + q.correctCount, 0);
  const total = qs.reduce((a, q) => a + q.totalCount, 0);
  return total ? clampPct((c / total) * 100) : 0;
}

export function examReadiness(ws: Workspace, exam: DemoExam) {
  const course = courseById(ws, exam.courseId);
  const syllabus = course ? courseProgress(course) : 0;
  const accuracy = quizAccuracy(ws, exam.courseId);
  const readiness = clampPct(syllabus * 0.55 + accuracy * 0.45);
  return { syllabus, accuracy, readiness, course };
}

export function recommendedActions(ws: Workspace) {
  const out: { label: string; href: string }[] = [];
  const dl = upcomingDeadlines(ws, 1)[0];
  if (dl) out.push({ label: `Finish "${dl.title}"`, href: "/planner" });
  for (const w of weakTopics(ws).slice(0, 2)) {
    out.push({ label: `Revise ${w.title} (${w.course.name})`, href: "/practice" });
  }
  const exam = nextExam(ws);
  if (exam) out.push({ label: `Prep for ${exam.title}`, href: "/analytics" });
  return out.slice(0, 4);
}

export function workloadClusters(ws: Workspace) {
  const soon = ws.tasks.filter((t) => {
    if (t.status === "DONE" || !t.dueDate) return false;
    const d = daysUntil(t.dueDate);
    return d >= 0 && d <= 4;
  });
  const major = soon.filter((t) => t.priority === "HIGH" || t.type === "PROJECT" || t.type === "EXAM");
  return { soon, major, highWorkload: major.length >= 3 };
}
