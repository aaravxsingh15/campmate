"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud } from "lucide-react";
import { Card, Button } from "@/components/ui";

export function DocumentUpload({ isDemo }: { isDemo: boolean }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    if (isDemo) {
      setMsg(
        `Demo mode: ${files.length} file(s) selected. Sign in with a real account to upload.`,
      );
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const form = new FormData();
      Array.from(files).forEach((f) => form.append("files", f));
      const res = await fetch("/api/documents/upload", { method: "POST", body: form });
      const json = await res.json();
      if (res.ok) {
        setMsg(`Added ${json.count} file(s).`);
        router.refresh();
      } else {
        setMsg(json.error ?? "Upload failed");
      }
    } catch {
      setMsg("Upload failed — please retry.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <Card
      className="border-dashed"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        void onFiles(e.dataTransfer.files);
      }}
    >
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <UploadCloud className="h-8 w-8 text-muted-2" />
        <div>
          <p className="text-sm font-medium">Drop files or browse</p>
          <p className="text-xs text-muted-2">PDF, DOCX, TXT, CSV · up to 15 MB each</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.txt,.csv,.md"
          className="hidden"
          onChange={(e) => void onFiles(e.target.files)}
        />
        <Button size="sm" onClick={() => inputRef.current?.click()} disabled={busy}>
          {busy ? "Uploading…" : "Select files"}
        </Button>
        {msg && <p className="max-w-md text-xs text-accent">{msg}</p>}
      </div>
    </Card>
  );
}
