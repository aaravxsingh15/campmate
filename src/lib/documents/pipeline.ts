import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { chunkText, extractText } from "@/lib/documents/extract";

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

/**
 * Upload each file to Supabase Storage, extract its text (PDF via unpdf, DOCX
 * via mammoth, plain text directly), chunk it, and store a Document + chunks.
 * Everything runs in parallel across files.
 */
export async function uploadDocuments(
  userId: string,
  files: File[],
  courseId?: string | null,
) {
  const sb = admin();
  const stamp = Date.now();

  return Promise.all(
    files.map(async (file) => {
      const path = `${userId}/${stamp}-${file.name}`;
      const buf = await file.arrayBuffer();
      const mime = file.type || "application/octet-stream";

      const [{ error }, text] = await Promise.all([
        sb.storage
          .from(env.supabaseBucket)
          .upload(path, new Uint8Array(buf), { contentType: mime, upsert: false }),
        extractText(buf, file.name, mime),
      ]);
      if (error) throw new Error(`Storage upload failed for ${file.name}: ${error.message}`);

      const chunks = chunkText(text);

      const doc = await prisma.document.create({
        data: {
          userId,
          courseId: courseId || null,
          filename: file.name,
          storagePath: path,
          mimeType: mime,
          sizeBytes: file.size,
          type: guessType(file.name),
          status: "READY",
          pageCount: chunks.length || null,
          chunks: chunks.length
            ? { create: chunks.map((content, index) => ({ index, content })) }
            : undefined,
        },
        select: { id: true, filename: true },
      });
      return doc;
    }),
  );
}
