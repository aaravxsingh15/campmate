import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { isLiveMode } from "@/lib/env";

const schema = z.object({
  name: z.string().min(1).max(120),
  college: z.string().max(160).optional(),
  program: z.string().max(160).optional(),
  year: z.number().int().min(1).max(8).optional(),
  careerGoal: z.string().max(200).optional(),
  studyHours: z.number().int().min(0).max(120).optional(),
});

export async function POST(req: Request) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }
  if (user.isDemo || !isLiveMode) {
    return NextResponse.json({ error: "Demo mode is read-only." }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid profile." }, { status: 400 });
  }

  const { prisma } = await import("@/lib/prisma");
  await prisma.user.update({ where: { id: user.id }, data: parsed.data });
  return NextResponse.json({ ok: true });
}
