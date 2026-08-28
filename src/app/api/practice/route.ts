import { NextResponse } from "next/server";
import { z } from "zod";
import { getWorkspace, weakTopics } from "@/lib/data/workspace";

const schema = z.object({
  courseId: z.string(),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  count: z.number().int().min(1).max(20).default(5),
  type: z.string().default("MCQ"),
  mode: z.enum(["normal", "surprise"]).default("normal"),
});

/**
 * Generates practice questions from the student's syllabus topics. Templated
 * (deterministic, no AI required); an AI provider can later replace `buildQ`
 * to produce richer prompts grounded in DocumentChunk content.
 */
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const { courseId, count, mode } = parsed.data;

  const ws = await getWorkspace();
  if (!ws) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  let pool = ws.courses
    .flatMap((c) => c.topics.map((t) => ({ ...t, course: c })))
    .filter((t) => t.status !== "NOT_STARTED" || mode === "normal");

  if (mode === "surprise") {
    const weakIds = new Set(weakTopics(ws).map((t) => t.id));
    pool = [
      ...pool.filter((t) => weakIds.has(t.id)),
      ...pool.filter((t) => !weakIds.has(t.id)),
    ];
  } else {
    pool = pool.filter((t) => t.course.id === courseId);
  }

  if (!pool.length) {
    return NextResponse.json({ questions: [] });
  }

  const questions = Array.from({ length: Math.min(count, pool.length * 2) }, (_, i) => {
    const topic = pool[i % pool.length];
    return buildQ(topic, i);
  });

  return NextResponse.json({ questions });
}

function buildQ(
  topic: { id: string; title: string; unit: string; course: { name: string } },
  seed: number,
) {
  const correct = `Correct account of ${topic.title}`;
  const options = shuffle(
    [
      correct,
      `A property that only holds for finite sets`,
      `An unrelated result from ${topic.course.name}`,
      `The negation of ${topic.title}`,
    ],
    seed,
  );
  return {
    id: `${topic.id}-${seed}`,
    prompt: `Which statement best describes "${topic.title}" (${topic.unit})?`,
    options,
    answer: correct,
    explanation: `${topic.title} is covered in ${topic.unit} of ${topic.course.name}. Review your notes for the precise definition and a worked example.`,
    topic: `${topic.course.name} · ${topic.unit}`,
    grounded: true,
  };
}

function shuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = (seed * 9301 + 49297 + i * 233) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
