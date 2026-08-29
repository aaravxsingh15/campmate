"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Check, X } from "lucide-react";
import { Card, CardHeader, Button, Badge, Progress } from "@/components/ui";

type Course = {
  id: string;
  name: string;
  units: string[];
  topics: { id: string; title: string; unit: string }[];
};

type Question = {
  id: string;
  prompt: string;
  options: string[];
  answer: string;
  explanation: string;
  topic: string;
  grounded: boolean;
};

type Phase = "config" | "quiz" | "result";

export function PracticeStudio({
  courses,
  weakTopics,
}: {
  courses: Course[];
  weakTopics: { id: string; title: string }[];
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("config");
  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
  const [difficulty, setDifficulty] = useState("medium");
  const [count, setCount] = useState(5);
  const [type, setType] = useState("MCQ");
  const [busy, setBusy] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [label, setLabel] = useState("Practice session");
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const course = courses.find((c) => c.id === courseId);

  async function submit() {
    setPhase("result");
    setSaveMsg(null);
    const payload = {
      label,
      courseId: courseId || null,
      answers: questions
        .filter((q) => answers[q.id] != null && !q.id.startsWith("demo-"))
        .map((q) => ({ questionId: q.id, given: answers[q.id] })),
    };
    if (!payload.answers.length) return;
    try {
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.saved) {
        setSaveMsg("Saved to your history — weak topics and analytics updated.");
        router.refresh();
      }
    } catch {
      /* non-blocking */
    }
  }

  async function generate(mode: "normal" | "surprise") {
    setBusy(true);
    try {
      const res = await fetch("/api/practice", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ courseId, difficulty, count, type, mode }),
      });
      const json = await res.json();
      setQuestions(json.questions ?? []);
      setLabel(
        `${course?.name ?? "Practice"} — ${new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" })}`,
      );
      setAnswers({});
      setIdx(0);
      setPhase("quiz");
    } finally {
      setBusy(false);
    }
  }

  if (phase === "config") {
    return (
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Build a session" />
          <div className="space-y-4">
            <Field label="Course">
              <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className={selectCls}>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Difficulty">
                <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className={selectCls}>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </Field>
              <Field label="Questions">
                <select value={count} onChange={(e) => setCount(Number(e.target.value))} className={selectCls}>
                  {[5, 10, 15, 20].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </Field>
              <Field label="Type">
                <select value={type} onChange={(e) => setType(e.target.value)} className={selectCls}>
                  <option value="MCQ">MCQ</option>
                  <option value="TRUE_FALSE">True / False</option>
                  <option value="CONCEPTUAL">Conceptual</option>
                </select>
              </Field>
            </div>
            <p className="text-xs text-muted-2">
              {course?.topics.length ?? 0} topics available in {course?.name}.
            </p>
            <Button onClick={() => generate("normal")} disabled={busy}>
              {busy ? "Generating…" : "Generate practice"}
            </Button>
          </div>
        </Card>

        <Card className="border-accent/30">
          <CardHeader title="Surprise me" />
          <p className="text-sm text-muted-2">
            A mixed set weighted toward your weak topics, upcoming exams and incomplete syllabus.
          </p>
          {weakTopics.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {weakTopics.slice(0, 4).map((t) => (
                <Badge key={t.id} tone="warning">{t.title}</Badge>
              ))}
            </div>
          )}
          <Button className="mt-4 w-full" onClick={() => generate("surprise")} disabled={busy}>
            <Sparkles className="h-4 w-4" /> Surprise me
          </Button>
        </Card>
      </div>
    );
  }

  if (phase === "quiz") {
    const q = questions[idx];
    if (!q) return <p className="text-sm text-muted-2">No questions generated.</p>;
    return (
      <Card className="mx-auto max-w-2xl">
        <div className="mb-4 flex items-center justify-between">
          <Badge tone="muted">Question {idx + 1} / {questions.length}</Badge>
          <Badge tone={q.grounded ? "success" : "muted"}>
            {q.grounded ? "From your material" : "General"}
          </Badge>
        </div>
        <Progress value={((idx) / questions.length) * 100} className="mb-5" />
        <p className="text-base font-medium">{q.prompt}</p>
        <p className="mt-1 text-xs text-muted-2">{q.topic}</p>
        <div className="mt-4 space-y-2">
          {q.options.map((o) => {
            const picked = answers[q.id] === o;
            return (
              <button
                key={o}
                onClick={() => setAnswers((a) => ({ ...a, [q.id]: o }))}
                className={`flex w-full items-center gap-3 rounded-md border px-3 py-2.5 text-left text-sm transition-colors ${
                  picked ? "border-accent bg-accent-soft text-foreground" : "border-border bg-surface-2 hover:border-border-strong"
                }`}
              >
                <span className={`grid h-4 w-4 place-items-center rounded-full border ${picked ? "border-accent bg-accent" : "border-border-strong"}`}>
                  {picked && <span className="h-1.5 w-1.5 rounded-full bg-black" />}
                </span>
                {o}
              </button>
            );
          })}
        </div>
        <div className="mt-6 flex justify-between">
          <Button variant="ghost" disabled={idx === 0} onClick={() => setIdx((i) => i - 1)}>
            Back
          </Button>
          {idx < questions.length - 1 ? (
            <Button onClick={() => setIdx((i) => i + 1)}>Next</Button>
          ) : (
            <Button onClick={submit}>Submit</Button>
          )}
        </div>
      </Card>
    );
  }

  // result
  const correct = questions.filter((q) => answers[q.id] === q.answer).length;
  const pct = Math.round((correct / questions.length) * 100);
  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader title="Quiz result" />
      <div className="flex items-end gap-3">
        <span className="font-mono text-4xl font-semibold">{correct}/{questions.length}</span>
        <span className="pb-1 text-sm text-muted-2">{pct}% accuracy</span>
      </div>
      <Progress value={pct} className="mt-3" tone={pct >= 70 ? "success" : "warning"} />
      {saveMsg && <p className="mt-2 text-xs text-success">{saveMsg}</p>}

      <div className="mt-6 space-y-3">
        {questions.map((q) => {
          const given = answers[q.id];
          const ok = given === q.answer;
          return (
            <div key={q.id} className="rounded-md border border-border bg-surface-2 p-3 text-sm">
              <div className="flex items-start gap-2">
                {ok ? <Check className="mt-0.5 h-4 w-4 text-success" /> : <X className="mt-0.5 h-4 w-4 text-danger" />}
                <div>
                  <p className="font-medium">{q.prompt}</p>
                  {!ok && (
                    <p className="mt-1 text-xs text-muted-2">
                      Your answer: <span className="text-danger">{given ?? "—"}</span> · Correct:{" "}
                      <span className="text-success">{q.answer}</span>
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-2">{q.explanation}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Button className="mt-6" variant="outline" onClick={() => setPhase("config")}>
        New session
      </Button>
    </Card>
  );
}

const selectCls =
  "h-10 w-full rounded-md border border-border bg-surface-2 px-3 text-sm outline-none focus:border-accent";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-2">{label}</span>
      {children}
    </label>
  );
}
