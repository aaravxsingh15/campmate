import { NextResponse } from "next/server";
import { z } from "zod";
import { getWorkspace } from "@/lib/data/workspace";
import { retrieve } from "@/lib/rag/retrieve";
import { chat, isAIConfigured } from "@/lib/ai/provider";

const schema = z.object({ question: z.string().min(2).max(1000) });

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid question." }, { status: 400 });
  }
  const { question } = parsed.data;

  const ws = await getWorkspace();
  if (!ws) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const hits = retrieve(ws, question, 3);
  const grounded = hits.length > 0;
  const sources = hits.map((h) => ({ filename: h.filename, page: h.page }));

  if (isAIConfigured) {
    try {
      const context = hits.map((h, i) => `[${i + 1}] ${h.text}`).join("\n");
      const answer = await chat([
        {
          role: "system",
          content:
            "You are Camp Mate, a study assistant. Answer concisely for a college student. " +
            "Use ONLY the provided context when it is relevant and say when you are giving a general explanation instead. " +
            "Never claim something appears in a document unless it is in the context.",
        },
        {
          role: "user",
          content: context
            ? `Context from the student's material:\n${context}\n\nQuestion: ${question}`
            : `The student has no matching material. Give a clear general explanation.\n\nQuestion: ${question}`,
        },
      ]);
      return NextResponse.json({ answer, grounded, sources });
    } catch {
      // fall through to templated answer
    }
  }

  const answer = grounded
    ? `Your material covers this under:\n${hits
        .map((h) => `• ${h.text}`)
        .join("\n")}\n\nConnect an AI provider (AI_API_KEY, AI_MODEL) for a full explanation grounded in these sources.`
    : `Nothing in your uploaded material matches "${question}" yet. Upload the relevant notes or syllabus, or connect an AI provider for a general explanation.`;

  return NextResponse.json({ answer, grounded, sources });
}
