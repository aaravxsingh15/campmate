import Link from "next/link";
import { AlertTriangle, ArrowRight, CalendarClock, Clock } from "lucide-react";
import { getWorkspace } from "@/lib/data/workspace";
import {
  courseProgress,
  examReadiness,
  nextExam,
  recommendedActions,
  semesterProgress,
  upcomingDeadlines,
  weakTopics,
  workloadClusters,
} from "@/lib/data/workspace";
import { greeting, dueLabel, daysUntil } from "@/lib/utils";
import {
  Card,
  CardHeader,
  Badge,
  Progress,
  ButtonLink,
  EmptyState,
} from "@/components/ui";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const ws = await getWorkspace();
  if (!ws) {
    return (
      <EmptyState
        title="Your semester starts here"
        description="Upload your syllabus and academic material and Camp Mate will build your workspace."
        action={<ButtonLink href="/onboarding">Start setup</ButtonLink>}
      />
    );
  }

  const semPct = semesterProgress(ws);
  const deadlines = upcomingDeadlines(ws);
  const weak = weakTopics(ws);
  const exam = nextExam(ws);
  const actions = recommendedActions(ws);
  const cluster = workloadClusters(ws);
  const today = new Date();
  const todaysTasks = ws.tasks.filter(
    (t) => t.status !== "DONE" && t.dueDate && daysUntil(t.dueDate) <= 1,
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          {greeting()}, {ws.profile.name.split(" ")[0]}.
        </h1>
        <p className="mt-1 text-sm text-muted-2">
          {today.toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}{" "}
          · {ws.semester.label}
        </p>
      </header>

      {cluster.highWorkload && (
        <Card className="border-warning/40 bg-warning/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
            <div>
              <p className="text-sm font-semibold text-warning">High workload ahead</p>
              <p className="mt-1 text-sm text-muted">
                {cluster.major.length} major academic tasks fall within the next 4 days.
                Start{" "}
                <span className="text-foreground">
                  &ldquo;{cluster.major[0]?.title}&rdquo;
                </span>{" "}
                today to spread the load.
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: progress + courses */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Semester progress" />
            <div className="flex items-end justify-between">
              <span className="font-mono text-4xl font-semibold">{semPct}%</span>
              <span className="text-xs text-muted-2">
                {ws.courses.length} courses ·{" "}
                {ws.courses.reduce((a, c) => a + c.topics.length, 0)} topics
              </span>
            </div>
            <Progress value={semPct} className="mt-3 h-2.5" />
          </Card>

          <Card>
            <CardHeader
              title="Course progress"
              action={
                <Link
                  href="/semester"
                  className="text-xs text-accent hover:underline"
                >
                  My Semester
                </Link>
              }
            />
            <ul className="space-y-3">
              {ws.courses.map((c) => {
                const p = courseProgress(c);
                return (
                  <li key={c.id}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <Link
                        href={`/semester/${c.id}`}
                        className="hover:text-accent"
                      >
                        {c.name}
                      </Link>
                      <span className="font-mono text-muted">{p}%</span>
                    </div>
                    <Progress
                      value={p}
                      tone={p < 40 ? "warning" : "accent"}
                    />
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card>
            <CardHeader title="Recommended actions" />
            {actions.length ? (
              <ol className="space-y-2">
                {actions.map((a, i) => (
                  <li key={i}>
                    <Link
                      href={a.href}
                      className="flex items-center gap-3 rounded-md border border-border bg-surface-2 px-3 py-2.5 text-sm hover:border-border-strong"
                    >
                      <span className="font-mono text-xs text-muted-2">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="flex-1">{a.label}</span>
                      <ArrowRight className="h-4 w-4 text-muted-2" />
                    </Link>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-muted-2">You&rsquo;re all caught up.</p>
            )}
          </Card>
        </div>

        {/* Right: today, deadlines, exam, weak */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="Today" />
            {todaysTasks.length ? (
              <ul className="space-y-2">
                {todaysTasks.map((t) => (
                  <li key={t.id} className="flex items-center gap-2 text-sm">
                    <Clock className="h-3.5 w-3.5 text-accent" />
                    <span className="flex-1">{t.title}</span>
                    <Badge tone={daysUntil(t.dueDate!) <= 0 ? "danger" : "warning"}>
                      {dueLabel(t.dueDate!)}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-2">Nothing due today. Good time to get ahead.</p>
            )}
          </Card>

          {exam && (
            <Card className="border-accent/30">
              <CardHeader title="Next exam" />
              {(() => {
                const r = examReadiness(ws, exam);
                return (
                  <>
                    <p className="text-sm font-medium">{r.course?.name ?? exam.title}</p>
                    <p className="mt-2 font-mono text-3xl font-semibold text-accent">
                      {daysUntil(exam.date)} days
                    </p>
                    <dl className="mt-3 space-y-1.5 text-xs">
                      <Row k="Syllabus" v={`${r.syllabus}%`} />
                      <Row k="Practice accuracy" v={`${r.accuracy}%`} />
                      <Row k="Readiness" v={`${r.readiness}%`} accent />
                    </dl>
                    <ButtonLink
                      href="/analytics"
                      variant="outline"
                      size="sm"
                      className="mt-4 w-full"
                    >
                      Exam prep
                    </ButtonLink>
                  </>
                );
              })()}
            </Card>
          )}

          <Card>
            <CardHeader title="Upcoming deadlines" />
            {deadlines.length ? (
              <ul className="space-y-2.5">
                {deadlines.map((t) => {
                  const d = daysUntil(t.dueDate!);
                  return (
                    <li key={t.id} className="flex items-center gap-2 text-sm">
                      <CalendarClock className="h-3.5 w-3.5 text-muted-2" />
                      <span className="flex-1 truncate">{t.title}</span>
                      <Badge tone={d <= 1 ? "danger" : d <= 4 ? "warning" : "muted"}>
                        {dueLabel(t.dueDate!)}
                      </Badge>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-muted-2">No deadlines logged.</p>
            )}
          </Card>

          <Card>
            <CardHeader title="Weak topics" />
            {weak.length ? (
              <ul className="space-y-2">
                {weak.map((w) => (
                  <li key={w.id} className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                    <span className="flex-1">{w.title}</span>
                    <span className="font-mono text-xs text-muted-2">{w.confidence}%</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-2">No weak topics flagged yet.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-2">{k}</dt>
      <dd className={accent ? "font-mono text-accent" : "font-mono text-muted"}>{v}</dd>
    </div>
  );
}
