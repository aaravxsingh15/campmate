import { NextResponse } from "next/server";
import { z } from "zod";
import { getWorkspace } from "@/lib/data/workspace";
import { retrieve } from "@/lib/rag/retrieve";
import { chat, isAIConfigured } from "@/lib/ai/provider";
import { isLiveMode } from "@/lib/env";

const schema = z.object({ question: z.string().min(2).max(1000) });

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid question." }, { status: 400 });
  }
  const { question } = parsed.data;

  const ws = await getWorkspace();
  if (!ws) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  // Real document-chunk search in live mode, plus syllabus-topic matches.
  type Passage = { text: string; filename: string; page: number | null };
  let passages: Passage[] = [];

  if (isLiveMode && !ws.isDemo) {
    const { getSessionUser } = await import("@/lib/auth");
    const { searchChunks } = await import("@/lib/rag/search");
    const user = await getSessionUser();
    if (user) {
      const chunks = await searchChunks(user.id, question, 4);
      passages = chunks.map((c) => ({ text: c.content, filename: c.filename, page: c.page }));
    }
  }

  if (!passages.length) {
    passages = retrieve(ws, question, 3).map((h) => ({
      text: h.text,
      filename: h.filename,
      page: h.page ?? null,
    }));
  }

  const grounded = passages.length > 0;
  const sources = passages.map((p) => ({ filename: p.filename, page: p.page ?? undefined }));

  if (isAIConfigured) {
    try {
      const context = passages.map((p, i) => `[${i + 1}] (${p.filename}${p.page ? ` p.${p.page}` : ""})\n${p.text}`).join("\n\n");
      const answer = await chat([
        {
          role: "system",
          content:
            "You are Camp Mate, a study assistant for a college student. Answer clearly and concisely. " +
            "When the provided context is relevant, ground your answer in it and refer to the source. " +
            "If the context does not cover the question, give a general explanation and say so. " +
            "Never claim something appears in a document unless it is in the context.",
        },
        {
          role: "user",
          content: context
            ? `Context from my uploaded material:\n\n${context}\n\nQuestion: ${question}`
            : `I have no matching uploaded material. Give a clear general explanation.\n\nQuestion: ${question}`,
        },
      ]);
      return NextResponse.json({ answer, grounded, sources });
    } catch {
      // fall through
    }
  }

  const answer = grounded
    ? `Found this in your material:\n\n${passages
        .map((p) => `• ${p.filename}${p.page ? ` (p.${p.page})` : ""}: ${p.text.slice(0, 240)}…`)
        .join("\n\n")}\n\nAdd an AI key (AI_API_KEY, AI_MODEL) for a full explanation built from these sources.`
    : `Nothing in your uploaded material matches "${question}" yet. Upload the relevant notes, or add an AI key for a general explanation.`;

  return NextResponse.json({ answer, grounded, sources });
}
