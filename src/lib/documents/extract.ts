/**
 * Best-effort plain-text extraction from an uploaded file buffer.
 * Returns "" when the format isn't extractable (still stored, just not indexed).
 */
export async function extractText(
  buf: ArrayBuffer,
  filename: string,
  mimeType: string,
): Promise<string> {
  const name = filename.toLowerCase();

  try {
    if (mimeType.startsWith("text/") || /\.(txt|csv|md)$/.test(name)) {
      return new TextDecoder().decode(buf);
    }

    if (mimeType === "application/pdf" || name.endsWith(".pdf")) {
      const { getDocumentProxy, extractText: extractPdf } = await import("unpdf");
      const pdf = await getDocumentProxy(new Uint8Array(buf));
      const { text } = await extractPdf(pdf, { mergePages: true });
      return Array.isArray(text) ? text.join("\n") : String(text);
    }

    if (name.endsWith(".docx")) {
      const mammoth = (await import("mammoth")).default;
      const { value } = await mammoth.extractRawText({
        buffer: Buffer.from(buf),
      });
      return value;
    }
  } catch {
    return "";
  }

  return "";
}

export function chunkText(text: string, size = 1100): string[] {
  const clean = text
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (!clean) return [];
  const out: string[] = [];
  // break on paragraphs, pack up to ~size chars per chunk
  let cur = "";
  for (const para of clean.split(/\n\n+/)) {
    if ((cur + "\n\n" + para).length > size && cur) {
      out.push(cur.trim());
      cur = para;
    } else {
      cur = cur ? `${cur}\n\n${para}` : para;
    }
    if (out.length >= 120) break;
  }
  if (cur.trim()) out.push(cur.trim());
  return out.slice(0, 120);
}
