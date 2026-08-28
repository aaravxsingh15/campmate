import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Sparkles } from "lucide-react";
import { getWorkspace, courseProgress, quizAccuracy } from "@/lib/data/workspace";
import { Card, CardHeader, Progress, Badge, ButtonLink } from "@/components/ui";

const STATUS_TONE = {
  COMPLETED: "success",
  IN_PROGRESS: "accent",
  WEAK: "warning",
  NOT_STARTED: "muted",
} as const;

const STATUS_LABEL = {
  COMPLETED: "Completed",
  IN_PROGRESS: "In progress",
  WEAK: "Weak",
  NOT_STARTED: "Not started",
} as const;

export default async function CoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const ws = await getWorkspace();
  const course = ws?.courses.find((c) => c.id === courseId);
  if (!ws || !course) notFound();

  const units = [...new Set(course.topics.map((t) => t.unit))];
  const docs = ws.documents.filter((d) => d.courseId === course.id);
  const tasks = ws.tasks.filter((t) => t.courseId === course.id);
  const quizzes = ws.quizzes.filter((q) => q.courseId === course.id);

  return (
    <div className="space-y-6">
      <Link href="/semester" className="inline-flex items-center gap-1 text-sm text-muted-2 hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> My Semester
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ background: course.color }} />
            <h1 className="text-2xl font-semibold tracking-tight">{course.name}</h1>
            <Badge tone="muted">{course.code}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-2">
            {courseProgress(course)}% syllabus · {quizAccuracy(ws, course.id)}% practice accuracy
          </p>
        </div>
        <ButtonLink href={`/practice?course=${course.id}`} size="sm">
          <Sparkles className="h-4 w-4" /> Practice this course
        </ButtonLink>
      </div>

      <Progress value={courseProgress(course)} className="h-2.5" />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader title="Syllabus" hint="Edit status as you study — progress updates automatically" />
            <div className="space-y-4">
              {units.map((u) => (
                <div key={u}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-2">{u}</p>
                  <ul className="space-y-1.5">
                    {course.topics
                      .filter((t) => t.unit === u)
                      .map((t) => (
                        <li
                          key={t.id}
                          className="flex items-center justify-between rounded-md border border-border bg-surface-2 px-3 py-2 text-sm"
                        >
                          <span>{t.title}</span>
                          <span className="flex items-center gap-2">
                            {t.confidence > 0 && (
                              <span className="font-mono text-xs text-muted-2">{t.confidence}%</span>
                            )}
                            <Badge tone={STATUS_TONE[t.status]}>{STATUS_LABEL[t.status]}</Badge>
                          </span>
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Documents" />
            {docs.length ? (
              <ul className="space-y-1.5 text-sm">
                {docs.map((d) => (
                  <li key={d.id} className="truncate text-muted">{d.filename}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-2">No documents linked.</p>
            )}
          </Card>
          <Card>
            <CardHeader title="Assignments & tasks" />
            {tasks.length ? (
              <ul className="space-y-1.5 text-sm">
                {tasks.map((t) => (
                  <li key={t.id} className="flex justify-between gap-2">
                    <span className="truncate text-muted">{t.title}</span>
                    <Badge tone={t.status === "DONE" ? "success" : "muted"}>{t.status.toLowerCase()}</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-2">Nothing scheduled.</p>
            )}
          </Card>
          <Card>
            <CardHeader title="Quiz history" />
            {quizzes.length ? (
              <ul className="space-y-1.5 text-sm">
                {quizzes.map((q) => (
                  <li key={q.id} className="flex justify-between gap-2">
                    <span className="truncate text-muted">{q.label}</span>
                    <span className="font-mono text-xs">{q.scorePct}%</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-2">No attempts yet.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
