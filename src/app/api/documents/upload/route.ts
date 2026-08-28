import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { isLiveMode } from "@/lib/env";

const MAX_BYTES = 15 * 1024 * 1024;
const ALLOWED = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/csv",
];

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
    if (f.type && !ALLOWED.includes(f.type)) {
      return NextResponse.json({ error: `${f.name}: unsupported type.` }, { status: 415 });
    }
  }

  // Live pipeline (Supabase Storage upload + Document row + async extraction)
  // is implemented in the document-processing milestone.
  const { uploadDocuments } = await import("@/lib/documents/pipeline");
  const created = await uploadDocuments(user.id, files);

  return NextResponse.json({ count: created.length, documents: created });
}
