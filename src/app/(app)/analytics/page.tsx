import {
  getWorkspace,
  courseProgress,
  quizAccuracy,
  semesterProgress,
  weakTopics,
} from "@/lib/data/workspace";
import { Card, CardHeader, PageHeader, Stat, EmptyState, ButtonLink, Progress } from "@/components/ui";
import { AnalyticsCharts } from "@/components/app/analytics-charts";

export const metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  const ws = await getWorkspace();
  if (!ws) return <EmptyState title="No analytics yet" description="Build your semester and take a quiz to see analytics." action={<ButtonLink href="/onboarding">Start setup</ButtonLink>} />;

  const courseData = ws.courses.map((c) => ({
    name: c.code || c.name.slice(0, 10),
    syllabus: courseProgress(c),
    accuracy: quizAccuracy(ws, c.id),
  }));

  const quizTrend = [...ws.quizzes]
    .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt))
    .map((q) => ({ name: q.label.split("—")[1]?.trim() ?? q.label, score: q.scorePct }));

  const topicsByStatus = ["COMPLETED", "IN_PROGRESS", "WEAK", "NOT_STARTED"].map((s) => ({
    name: s.replace("_", " ").toLowerCase(),
    value: ws.courses.flatMap((c) => c.topics).filter((t) => t.status === s).length,
  }));

  const strongest = ws.courses
    .flatMap((c) => c.topics.map((t) => ({ ...t, course: c.name })))
    .filter((t) => t.confidence >= 75)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" description="Where you stand across the semester." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Semester" value={`${semesterProgress(ws)}%`} sub="syllabus complete" />
        <Stat label="Practice accuracy" value={`${quizAccuracy(ws)}%`} sub={`${ws.quizzes.length} quizzes`} />
        <Stat
          label="Topics done"
          value={`${ws.courses.flatMap((c) => c.topics).filter((t) => t.status === "COMPLETED").length}`}
          sub={`of ${ws.courses.flatMap((c) => c.topics).length}`}
        />
        <Stat label="Weak topics" value={`${weakTopics(ws).length}`} sub="need attention" />
      </div>

      <AnalyticsCharts courseData={courseData} quizTrend={quizTrend} topicsByStatus={topicsByStatus} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Strongest topics" />
          {strongest.length ? (
            <ul className="space-y-2">
              {strongest.map((t) => (
                <li key={t.id}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{t.title}</span>
                    <span className="font-mono text-xs text-muted-2">{t.confidence}%</span>
                  </div>
                  <Progress value={t.confidence} tone="success" />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-2">Keep practicing to build strong topics.</p>
          )}
        </Card>
        <Card>
          <CardHeader title="Weakest topics" />
          <ul className="space-y-2">
            {weakTopics(ws).map((t) => (
              <li key={t.id}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{t.title} <span className="text-muted-2">· {t.course.name}</span></span>
                  <span className="font-mono text-xs text-muted-2">{t.confidence}%</span>
                </div>
                <Progress value={t.confidence} tone="warning" />
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
