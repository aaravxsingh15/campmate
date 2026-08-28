import Link from "next/link";
import { getWorkspace, courseProgress, courseById } from "@/lib/data/workspace";
import { daysUntil } from "@/lib/utils";
import { Card, CardHeader, Progress, Badge, PageHeader, EmptyState, ButtonLink } from "@/components/ui";

export const metadata = { title: "My Semester" };

export default async function SemesterPage() {
  const ws = await getWorkspace();
  if (!ws || !ws.courses.length) {
    return (
      <EmptyState
        title="No semester yet"
        description="Run onboarding to upload your syllabus and build courses, topics and exams."
        action={<ButtonLink href="/onboarding">Start setup</ButtonLink>}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Semester"
        description={ws.semester.label}
        action={<ButtonLink href="/onboarding" variant="outline" size="sm">Add material</ButtonLink>}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {ws.courses.map((c) => {
          const p = courseProgress(c);
          const done = c.topics.filter((t) => t.status === "COMPLETED").length;
          return (
            <Link key={c.id} href={`/semester/${c.id}`}>
              <Card className="h-full transition-colors hover:border-border-strong">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                    <h3 className="font-medium">{c.name}</h3>
                  </div>
                  <Badge tone="muted">{c.code}</Badge>
                </div>
                <Progress value={p} className="mt-3" tone={p < 40 ? "warning" : "accent"} />
                <p className="mt-2 text-xs text-muted-2">
                  {p}% · {done}/{c.topics.length} topics complete
                </p>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Exams" />
          <ul className="space-y-2.5">
            {ws.exams.map((e) => {
              const d = daysUntil(e.date);
              return (
                <li key={e.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p>{courseById(ws, e.courseId)?.name ?? e.title}</p>
                    <p className="text-xs text-muted-2">
                      {new Date(e.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      {e.location ? ` · ${e.location}` : ""}
                    </p>
                  </div>
                  <Badge tone={d <= 7 ? "danger" : d <= 14 ? "warning" : "muted"}>
                    {d >= 0 ? `${d}d` : "done"}
                  </Badge>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Academic calendar" />
          <ul className="space-y-2.5 text-sm">
            {[...ws.tasks]
              .filter((t) => t.dueDate)
              .sort((a, b) => +new Date(a.dueDate!) - +new Date(b.dueDate!))
              .slice(0, 8)
              .map((t) => (
                <li key={t.id} className="flex items-center justify-between">
                  <span className="truncate">{t.title}</span>
                  <span className="ml-3 shrink-0 font-mono text-xs text-muted-2">
                    {new Date(t.dueDate!).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </span>
                </li>
              ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
