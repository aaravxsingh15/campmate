import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { isLiveMode } from "@/lib/env";

const schema = z.object({
  label: z.string().min(1).max(120),
  courseId: z.string().nullable().optional(),
  answers: z
    .array(z.object({ questionId: z.string(), given: z.string() }))
    .min(1)
    .max(40),
});

export async function POST(req: Request) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }
  if (user.isDemo || !isLiveMode) {
    return NextResponse.json({ ok: false, saved: false });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid submission." }, { status: 400 });
  const { label, answers } = parsed.data;

  const { prisma } = await import("@/lib/prisma");

  // Load only this user's questions.
  const questions = await prisma.question.findMany({
    where: {
      id: { in: answers.map((a) => a.questionId) },
      course: { semester: { userId: user.id } },
    },
    select: { id: true, answer: true, topicId: true, courseId: true },
  });
  if (!questions.length) return NextResponse.json({ error: "Questions not found." }, { status: 404 });

  const qById = new Map(questions.map((q) => [q.id, q]));
  let correct = 0;
  const graded = answers
    .filter((a) => qById.has(a.questionId))
    .map((a) => {
      const q = qById.get(a.questionId)!;
      const ok = a.given === q.answer;
      if (ok) correct++;
      return { questionId: a.questionId, given: a.given, correct: ok, topicId: q.topicId };
    });

  const total = graded.length;
  const scorePct = Math.round((correct / total) * 100);
  const courseId = questions[0].courseId;

  const attempt = await prisma.quizAttempt.create({
    data: {
      userId: user.id,
      courseId,
      label,
      scorePct,
      totalCount: total,
      correctCount: correct,
      answers: {
        create: graded.map((g) => ({ questionId: g.questionId, given: g.given, correct: g.correct })),
      },
    },
    select: { id: true },
  });

  // Roll up per-topic performance and nudge topic confidence / weak status.
  const byTopic = new Map<string, { c: number; n: number }>();
  for (const g of graded) {
    if (!g.topicId) continue;
    const cur = byTopic.get(g.topicId) ?? { c: 0, n: 0 };
    cur.n++;
    if (g.correct) cur.c++;
    byTopic.set(g.topicId, cur);
  }

  await Promise.all(
    [...byTopic.entries()].map(async ([topicId, { c, n }]) => {
      const perf = await prisma.topicPerformance.upsert({
        where: { topicId },
        create: {
          topicId,
          attempts: n,
          correct: c,
          accuracyPct: Math.round((c / n) * 100),
          lastPracticed: new Date(),
        },
        update: {
          attempts: { increment: n },
          correct: { increment: c },
          lastPracticed: new Date(),
        },
      });
      const acc =
        perf.attempts > 0 ? Math.round((perf.correct / perf.attempts) * 100) : Math.round((c / n) * 100);
      await prisma.topicPerformance.update({ where: { topicId }, data: { accuracyPct: acc } });

      const topic = await prisma.topic.findUnique({ where: { id: topicId }, select: { status: true, confidence: true } });
      if (topic) {
        const confidence = Math.round(topic.confidence * 0.5 + acc * 0.5);
        const status =
          topic.status === "COMPLETED"
            ? "COMPLETED"
            : acc < 45
              ? "WEAK"
              : acc >= 80
                ? "COMPLETED"
                : "IN_PROGRESS";
        await prisma.topic.update({ where: { id: topicId }, data: { confidence, status } });
      }
    }),
  );

  return NextResponse.json({ ok: true, saved: true, attemptId: attempt.id, scorePct, correct, total });
}
