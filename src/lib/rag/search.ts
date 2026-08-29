import { prisma } from "@/lib/prisma";

const STOP = new Set([
  "the", "a", "an", "of", "in", "for", "my", "is", "what", "explain", "does",
  "say", "about", "to", "and", "me", "how", "why", "give", "with", "on", "this",
]);

function terms(q: string) {
  return [
    ...new Set(
      q
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 2 && !STOP.has(w)),
    ),
  ].slice(0, 8);
}

export type Hit = { content: string; filename: string; page: number | null; docId: string };

/**
 * Keyword search over the user's DocumentChunk rows (ILIKE OR across terms).
 * Ranked by how many distinct terms a chunk contains. Swap for pgvector later.
 */
export async function searchChunks(userId: string, query: string, k = 4): Promise<Hit[]> {
  const words = terms(query);
  if (!words.length) return [];

  const rows = await prisma.documentChunk.findMany({
    where: {
      document: { userId },
      OR: words.map((w) => ({ content: { contains: w, mode: "insensitive" as const } })),
    },
    select: {
      content: true,
      page: true,
      index: true,
      document: { select: { id: true, filename: true } },
    },
    take: 40,
  });

  return rows
    .map((r) => {
      const lc = r.content.toLowerCase();
      const score = words.reduce((n, w) => n + (lc.includes(w) ? 1 : 0), 0);
      return {
        content: r.content.slice(0, 700),
        filename: r.document.filename,
        page: r.page ?? r.index + 1,
        docId: r.document.id,
        score,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map(({ score, ...h }) => {
      void score;
      return h;
    });
}
