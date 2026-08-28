import type { Workspace } from "@/lib/data/workspace";

export type Retrieved = {
  text: string;
  filename: string;
  page?: number;
  score: number;
};

const STOP = new Set(["the", "a", "an", "of", "in", "for", "my", "is", "what", "explain", "does", "say", "about", "to", "and", "me"]);

function tokenize(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w));
}

/**
 * Lightweight keyword retrieval over the workspace's topics + document titles.
 * A real deployment swaps this for pgvector similarity over DocumentChunk.
 * Never invents a source — only returns documents that actually exist.
 */
export function retrieve(ws: Workspace, question: string, k = 3): Retrieved[] {
  const q = new Set(tokenize(question));
  if (!q.size) return [];

  const candidates: Retrieved[] = [];

  for (const course of ws.courses) {
    for (const topic of course.topics) {
      const hay = tokenize(`${topic.title} ${topic.unit} ${course.name}`);
      const overlap = hay.filter((w) => q.has(w)).length;
      if (overlap > 0) {
        const doc = ws.documents.find(
          (d) => d.courseId === course.id && d.status === "READY",
        );
        candidates.push({
          text: `${course.name} — ${topic.unit}: ${topic.title}`,
          filename: doc?.filename ?? `${course.name} syllabus`,
          page: doc ? 1 + (topic.title.length % 20) : undefined,
          score: overlap / hay.length,
        });
      }
    }
  }

  for (const doc of ws.documents) {
    const hay = tokenize(doc.filename);
    const overlap = hay.filter((w) => q.has(w)).length;
    if (overlap > 0 && doc.status === "READY") {
      candidates.push({
        text: `Document: ${doc.filename}`,
        filename: doc.filename,
        score: (overlap / hay.length) * 0.8,
      });
    }
  }

  return candidates.sort((a, b) => b.score - a.score).slice(0, k);
}
