import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

function admin() {
  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { persistSession: false },
  });
}

function guessType(name: string): "SYLLABUS" | "LECTURE_NOTES" | "ASSIGNMENT" | "QUESTION_PAPER" | "LAB" | "TIMETABLE" | "OTHER" {
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
 * Uploads files to Supabase Storage and records a Document row per file with
 * status PENDING. Text extraction / chunking / embedding is picked up
 * asynchronously by the processing worker.
 */
export async function uploadDocuments(userId: string, files: File[]) {
  const sb = admin();
  const created: { id: string; filename: string }[] = [];

  for (const file of files) {
    const path = `${userId}/${Date.now()}-${file.name}`;
    const bytes = new Uint8Array(await file.arrayBuffer());

    const { error } = await sb.storage
      .from(env.supabaseBucket)
      .upload(path, bytes, { contentType: file.type || "application/octet-stream", upsert: false });
    if (error) throw new Error(`Storage upload failed: ${error.message}`);

    const doc = await prisma.document.create({
      data: {
        userId,
        filename: file.name,
        storagePath: path,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
        type: guessType(file.name),
        status: "PENDING",
      },
    });
    created.push({ id: doc.id, filename: doc.filename });
  }

  return created;
}
