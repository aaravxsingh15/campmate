import Link from "next/link";
import { getWorkspace } from "@/lib/data/workspace";
import { Card, CardHeader, PageHeader, EmptyState } from "@/components/ui";

export const metadata = { title: "Search" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const ws = await getWorkspace();
  const query = q.trim().toLowerCase();

  const results = ws && query
    ? {
        courses: ws.courses.filter((c) => `${c.name} ${c.code}`.toLowerCase().includes(query)),
        topics: ws.courses.flatMap((c) =>
          c.topics.filter((t) => t.title.toLowerCase().includes(query)).map((t) => ({ ...t, course: c })),
        ),
        documents: ws.documents.filter((d) => d.filename.toLowerCase().includes(query)),
        tasks: ws.tasks.filter((t) => t.title.toLowerCase().includes(query)),
        exams: ws.exams.filter((e) => e.title.toLowerCase().includes(query)),
      }
    : null;

  return (
    <div className="space-y-6">
      <PageHeader title="Search" description="Courses, topics, documents, assignments and exams." />

      <form className="flex gap-2">
        <input
          name="q"
          defaultValue={q}
          autoFocus
          placeholder="Search your semester…"
          className="h-11 flex-1 rounded-md border border-border bg-surface px-4 text-sm outline-none focus:border-accent"
        />
      </form>

      {!query && (
        <EmptyState title="Start typing" description="Search across everything in your semester." />
      )}

      {results && (
        <div className="space-y-5">
          <Section title={`Courses (${results.courses.length})`}>
            {results.courses.map((c) => (
              <Link key={c.id} href={`/semester/${c.id}`} className={rowCls}>
                {c.name} <span className="text-muted-2">· {c.code}</span>
              </Link>
            ))}
          </Section>
          <Section title={`Topics (${results.topics.length})`}>
            {results.topics.map((t) => (
              <Link key={t.id} href={`/semester/${t.course.id}`} className={rowCls}>
                {t.title} <span className="text-muted-2">· {t.course.name}</span>
              </Link>
            ))}
          </Section>
          <Section title={`Documents (${results.documents.length})`}>
            {results.documents.map((d) => (
              <Link key={d.id} href="/documents" className={rowCls}>{d.filename}</Link>
            ))}
          </Section>
          <Section title={`Tasks (${results.tasks.length})`}>
            {results.tasks.map((t) => (
              <Link key={t.id} href="/planner" className={rowCls}>{t.title}</Link>
            ))}
          </Section>
          <Section title={`Exams (${results.exams.length})`}>
            {results.exams.map((e) => (
              <span key={e.id} className={rowCls}>{e.title}</span>
            ))}
          </Section>
        </div>
      )}
    </div>
  );
}

const rowCls = "block rounded-md border border-border bg-surface-2 px-3 py-2 text-sm hover:border-border-strong";

function Section({ title, children }: { title: string; children: React.ReactNode[] }) {
  if (!children || children.length === 0) return null;
  return (
    <Card>
      <CardHeader title={title} />
      <div className="space-y-1.5">{children}</div>
    </Card>
  );
}
