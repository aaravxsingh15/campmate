import { getWorkspace, courseById, workloadClusters } from "@/lib/data/workspace";
import { daysUntil, dueLabel } from "@/lib/utils";
import { Card, CardHeader, Badge, PageHeader, EmptyState, ButtonLink } from "@/components/ui";
import { AlertTriangle } from "lucide-react";
import { AddTask, TaskCheckbox, DeleteTask } from "@/components/app/task-crud";

export const metadata = { title: "Planner" };

const TYPE_TONE = {
  ASSIGNMENT: "accent",
  PROJECT: "accent",
  EXAM: "danger",
  LAB: "warning",
  STUDY_SESSION: "muted",
  CUSTOM: "muted",
} as const;

export default async function PlannerPage() {
  const ws = await getWorkspace();
  if (!ws) return <EmptyState title="Nothing planned" description="Set up your semester to start planning." action={<ButtonLink href="/onboarding">Start setup</ButtonLink>} />;

  const cluster = workloadClusters(ws);
  const open = ws.tasks.filter((t) => t.status !== "DONE");
  const done = ws.tasks.filter((t) => t.status === "DONE");

  const groups: { key: string; label: string; test: (d: number) => boolean }[] = [
    { key: "overdue", label: "Overdue", test: (d) => d < 0 },
    { key: "today", label: "Today & tomorrow", test: (d) => d >= 0 && d <= 1 },
    { key: "week", label: "This week", test: (d) => d >= 2 && d <= 7 },
    { key: "later", label: "Later", test: (d) => d > 7 },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Planner"
        description="Assignments, projects, exams, labs and study sessions on one timeline."
      />

      {!ws.isDemo && (
        <AddTask courses={ws.courses.map((c) => ({ id: c.id, name: c.name }))} />
      )}

      {cluster.highWorkload && (
        <Card className="border-warning/40 bg-warning/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
            <p className="text-sm text-muted">
              <span className="font-semibold text-warning">Deadline cluster: </span>
              {cluster.major.length} major tasks within 4 days. Consider starting{" "}
              <span className="text-foreground">&ldquo;{cluster.major[0]?.title}&rdquo;</span> now.
            </p>
          </div>
        </Card>
      )}

      {groups.map((g) => {
        const items = open
          .filter((t) => t.dueDate && g.test(daysUntil(t.dueDate)))
          .sort((a, b) => +new Date(a.dueDate!) - +new Date(b.dueDate!));
        if (!items.length) return null;
        return (
          <Card key={g.key}>
            <CardHeader title={g.label} />
            <ul className="space-y-2">
              {items.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center gap-3 rounded-md border border-border bg-surface-2 px-3 py-2.5 text-sm"
                >
                  {!ws.isDemo && <TaskCheckbox id={t.id} done={false} />}
                  <Badge tone={TYPE_TONE[t.type]}>{t.type.replace("_", " ").toLowerCase()}</Badge>
                  <span className="flex-1">{t.title}</span>
                  {!ws.isDemo && <DeleteTask id={t.id} />}
                  <span className="hidden text-xs text-muted-2 sm:inline">
                    {courseById(ws, t.courseId)?.code ?? ""}
                  </span>
                  {t.estimateMins && (
                    <span className="hidden font-mono text-xs text-muted-2 md:inline">
                      {Math.round(t.estimateMins / 60) || 1}h
                    </span>
                  )}
                  <Badge tone={daysUntil(t.dueDate!) <= 1 ? "danger" : "muted"}>
                    {dueLabel(t.dueDate!)}
                  </Badge>
                </li>
              ))}
            </ul>
          </Card>
        );
      })}

      {done.length > 0 && (
        <Card>
          <CardHeader title={`Completed (${done.length})`} />
          <ul className="space-y-1.5 text-sm text-muted-2">
            {done.map((t) => (
              <li key={t.id} className="line-through">{t.title}</li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
