import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { isLiveMode } from "@/lib/env";

const MAX_BYTES = 15 * 1024 * 1024;
const ALLOWED_EXT = /\.(pdf|docx|txt|csv|md)$/i;

export async function POST(req: Request) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  if (user.isDemo || !isLiveMode) {
    return NextResponse.json(
      { error: "Uploads require Supabase + database configuration. Running in demo mode." },
      { status: 501 },
    );
  }

  const form = await req.formData();
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (!files.length) {
    return NextResponse.json({ error: "No files provided." }, { status: 400 });
  }
  for (const f of files) {
    if (f.size > MAX_BYTES) {
      return NextResponse.json({ error: `${f.name} exceeds 15 MB.` }, { status: 413 });
    }
    if (!ALLOWED_EXT.test(f.name)) {
      return NextResponse.json(
        { error: `${f.name}: use PDF, DOCX, TXT, CSV or MD.` },
        { status: 415 },
      );
    }
  }

  const { uploadDocuments } = await import("@/lib/documents/pipeline");
  const created = await uploadDocuments(user.id, files);

  return NextResponse.json({ count: created.length, documents: created });
}
