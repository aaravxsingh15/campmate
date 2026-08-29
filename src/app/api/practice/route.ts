import { NextResponse } from "next/server";
import { z } from "zod";
import { getWorkspace, weakTopics } from "@/lib/data/workspace";
import { isLiveMode } from "@/lib/env";
import { generateQuestions } from "@/lib/practice/engine";

const schema = z.object({
  courseId: z.string(),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  count: z.number().int().min(1).max(20).default(5),
  type: z.string().default("MCQ"),
  mode: z.enum(["normal", "surprise"]).default("normal"),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const { courseId, count, difficulty, mode } = parsed.data;

  const ws = await getWorkspace();
  if (!ws) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  let pool = ws.courses.flatMap((c) =>
    c.topics.map((t) => ({ id: t.id, title: t.title, unit: t.unit, courseName: c.name, courseId: c.id })),
  );
  if (mode === "surprise") {
    const weak = new Set(weakTopics(ws).map((t) => t.id));
    pool = [...pool.filter((t) => weak.has(t.id)), ...pool.filter((t) => !weak.has(t.id))];
  } else {
    pool = pool.filter((t) => t.courseId === courseId);
  }
  if (!pool.length) return NextResponse.json({ questions: [] });

  const generated = await generateQuestions(pool, count, difficulty);

  // Persist as Question rows in live mode so results can be scored + saved.
  if (isLiveMode && !ws.isDemo) {
    const { prisma } = await import("@/lib/prisma");
    const rows = await Promise.all(
      generated.map((q) =>
        prisma.question.create({
          data: {
            courseId: mode === "surprise" ? (pool.find((p) => p.id === q.topicId)?.courseId ?? courseId) : courseId,
            topicId: q.topicId,
            type: "MCQ",
            difficulty: difficulty === "hard" ? "HIGH" : difficulty === "easy" ? "LOW" : "MEDIUM",
            prompt: q.prompt,
            options: q.options,
            answer: q.answer,
            explanation: q.explanation,
          },
          select: { id: true },
        }),
      ),
    );
    return NextResponse.json({
      questions: generated.map((q, i) => ({ ...q, id: rows[i].id, topic: q.topicLabel })),
    });
  }

  return NextResponse.json({
    questions: generated.map((q, i) => ({ ...q, id: `demo-${i}`, topic: q.topicLabel })),
  });
}
