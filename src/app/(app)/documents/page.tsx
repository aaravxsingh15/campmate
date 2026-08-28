import { FileText } from "lucide-react";
import { getWorkspace, courseById } from "@/lib/data/workspace";
import { Card, Badge, PageHeader, EmptyState } from "@/components/ui";
import { DocumentUpload } from "@/components/app/document-upload";

export const metadata = { title: "Documents" };

const TYPE_LABEL: Record<string, string> = {
  SYLLABUS: "Syllabus",
  LECTURE_NOTES: "Lecture notes",
  ASSIGNMENT: "Assignment",
  QUESTION_PAPER: "Question paper",
  LAB: "Lab",
  TIMETABLE: "Timetable",
  OTHER: "Other",
};

const STATUS_TONE = {
  READY: "success",
  PROCESSING: "warning",
  PENDING: "muted",
  FAILED: "danger",
} as const;

function fmtSize(b: number) {
  return b > 1_000_000 ? `${(b / 1_000_000).toFixed(1)} MB` : `${Math.round(b / 1000)} KB`;
}

export default async function DocumentsPage() {
  const ws = await getWorkspace();
  const docs = ws?.documents ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        description="Every file Camp Mate reads to build your semester and answer questions."
      />

      <DocumentUpload isDemo={Boolean(ws?.isDemo)} />

      {docs.length ? (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-2">
                <th className="px-4 py-3 font-medium">File</th>
                <th className="px-4 py-3 font-medium">Course</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Size</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => (
                <tr key={d.id} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2">
                      <FileText className="h-4 w-4 shrink-0 text-muted-2" />
                      <span className="truncate">{d.filename}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-2">
                    {courseById(ws!, d.courseId)?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-2">{TYPE_LABEL[d.type]}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-2">{fmtSize(d.sizeBytes)}</td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_TONE[d.status]}>{d.status.toLowerCase()}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <EmptyState
          title="No documents yet"
          description="Upload your syllabus, lecture notes, assignments and past papers. Camp Mate extracts courses, topics and deadlines from them."
        />
      )}
    </div>
  );
}
