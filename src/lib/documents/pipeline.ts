import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

function admin() {
  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { persistSession: false },
  });
}

function guessType(
  name: string,
): "SYLLABUS" | "LECTURE_NOTES" | "ASSIGNMENT" | "QUESTION_PAPER" | "LAB" | "TIMETABLE" | "OTHER" {
  const n = name.toLowerCase();
  if (n.includes("syllabus") || n.includes("curriculum")) return "SYLLABUS";
  if (n.includes("assignment") || n.includes("homework")) return "ASSIGNMENT";
  if (n.includes("paper") || n.includes("pyq") || n.includes("exam")) return "QUESTION_PAPER";
  if (n.includes("lab")) return "LAB";
  if (n.includes("timetable") || n.includes("schedule")) return "TIMETABLE";
  if (n.includes("note") || n.includes("lecture") || n.includes("unit")) return "LECTURE_NOTES";
  return "OTHER";
}

function chunk(text: string, size = 1200): string[] {
  const clean = text.replace(/\s+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!clean) return [];
  const out: string[] = [];
  for (let i = 0; i < clean.length; i += size) out.push(clean.slice(i, i + size));
  return out.slice(0, 60);
}

/**
 * Uploads files to Supabase Storage and records a Document row per file.
 * Plain-text formats (.txt/.csv) are extracted + chunked inline (instant).
 * PDF/DOCX are stored and marked READY; rich extraction is a follow-up.
 * All files are processed in parallel.
 */
export async function uploadDocuments(userId: string, files: File[]) {
  const sb = admin();
  const stamp = Date.now();

  const results = await Promise.all(
    files.map(async (file) => {
      const path = `${userId}/${stamp}-${file.name}`;
      const buf = await file.arrayBuffer();

      const { error } = await sb.storage
        .from(env.supabaseBucket)
        .upload(path, new Uint8Array(buf), {
          contentType: file.type || "application/octet-stream",
          upsert: false,
        });
      if (error) throw new Error(`Storage upload failed for ${file.name}: ${error.message}`);

      const isText =
        file.type.startsWith("text/") || /\.(txt|csv|md)$/i.test(file.name);
      const chunks = isText ? chunk(new TextDecoder().decode(buf)) : [];

      const doc = await prisma.document.create({
        data: {
          userId,
          filename: file.name,
          storagePath: path,
          mimeType: file.type || "application/octet-stream",
          sizeBytes: file.size,
          type: guessType(file.name),
          status: "READY",
          chunks: chunks.length
            ? { create: chunks.map((content, index) => ({ index, content })) }
            : undefined,
        },
        select: { id: true, filename: true },
      });
      return doc;
    }),
  );

  return results;
}
