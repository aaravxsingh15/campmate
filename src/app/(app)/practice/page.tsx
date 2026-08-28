import { getWorkspace, weakTopics } from "@/lib/data/workspace";
import { PageHeader, EmptyState, ButtonLink } from "@/components/ui";
import { PracticeStudio } from "@/components/app/practice-studio";

export const metadata = { title: "Practice" };

export default async function PracticePage() {
  const ws = await getWorkspace();
  if (!ws || !ws.courses.length) {
    return (
      <EmptyState
        title="Nothing to practice yet"
        description="Add courses and syllabus topics, then generate practice questions from your own material."
        action={<ButtonLink href="/onboarding">Start setup</ButtonLink>}
      />
    );
  }

  const courses = ws.courses.map((c) => ({
    id: c.id,
    name: c.name,
    units: [...new Set(c.topics.map((t) => t.unit))],
    topics: c.topics.map((t) => ({ id: t.id, title: t.title, unit: t.unit })),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Practice"
        description="Generate questions from your syllabus and notes. Or hit Surprise Me for a personalised mixed set."
      />
      <PracticeStudio
        courses={courses}
        weakTopics={weakTopics(ws).map((t) => ({ id: t.id, title: t.title }))}
      />
    </div>
  );
}
