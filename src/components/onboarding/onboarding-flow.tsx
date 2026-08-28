"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Check, UploadCloud, Loader2 } from "lucide-react";
import { Button, Card, Badge, Progress } from "@/components/ui";

type Step = "profile" | "upload" | "processing" | "review";

const PIPELINE = [
  "Reading documents",
  "Detecting courses",
  "Extracting syllabus",
  "Detecting deadlines",
  "Detecting examinations",
  "Building your academic workspace",
];

export function OnboardingFlow({
  defaultName,
  isDemo,
}: {
  defaultName: string;
  isDemo: boolean;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("profile");
  const [profile, setProfile] = useState({
    name: defaultName,
    college: "",
    program: "",
    year: "3",
    semester: "5",
    careerGoal: "",
    studyHours: "15",
  });
  const [files, setFiles] = useState<File[]>([]);
  const [pipeStep, setPipeStep] = useState(0);

  useEffect(() => {
    if (step !== "processing") return;
    setPipeStep(0);
    const id = setInterval(() => {
      setPipeStep((s) => {
        if (s >= PIPELINE.length - 1) {
          clearInterval(id);
          setTimeout(() => setStep("review"), 500);
          return s;
        }
        return s + 1;
      });
    }, 650);
    return () => clearInterval(id);
  }, [step]);

  const found = isDemo || files.length === 0
    ? { courses: 6, topics: 47, assignments: 8, exams: 4, dates: 12 }
    : {
        courses: Math.min(8, Math.max(3, files.length + 2)),
        topics: files.length * 8 + 7,
        assignments: files.length + 1,
        exams: Math.min(5, files.length),
        dates: files.length * 2 + 4,
      };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        {(["profile", "upload", "processing", "review"] as Step[]).map((s, i) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full ${
              ["profile", "upload", "processing", "review"].indexOf(step) >= i
                ? "bg-accent"
                : "bg-surface-3"
            }`}
          />
        ))}
      </div>

      {step === "profile" && (
        <Card>
          <h1 className="text-lg font-semibold">Tell Camp Mate about you</h1>
          <p className="mt-1 text-sm text-muted-2">Used to personalise your dashboard and study plans.</p>
          <div className="mt-4 grid gap-3">
            <F label="Name" v={profile.name} on={(v) => setProfile({ ...profile, name: v })} />
            <F label="College / University" v={profile.college} on={(v) => setProfile({ ...profile, college: v })} />
            <F label="Degree / Program" v={profile.program} on={(v) => setProfile({ ...profile, program: v })} />
            <div className="grid grid-cols-2 gap-3">
              <F label="Year" v={profile.year} on={(v) => setProfile({ ...profile, year: v })} type="number" />
              <F label="Semester" v={profile.semester} on={(v) => setProfile({ ...profile, semester: v })} type="number" />
            </div>
            <F label="Career goal (optional)" v={profile.careerGoal} on={(v) => setProfile({ ...profile, careerGoal: v })} />
            <F label="Weekly study hours (optional)" v={profile.studyHours} on={(v) => setProfile({ ...profile, studyHours: v })} type="number" />
          </div>
          <Button className="mt-5 w-full" onClick={() => setStep("upload")} disabled={!profile.name}>
            Continue
          </Button>
        </Card>
      )}

      {step === "upload" && (
        <Card>
          <h1 className="text-lg font-semibold">Upload your academic material</h1>
          <p className="mt-1 text-sm text-muted-2">
            Syllabus, lecture notes, assignments, past papers, timetables, exam schedules.
          </p>
          <label className="mt-4 flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-border-strong bg-surface-2 py-10 text-center">
            <UploadCloud className="h-7 w-7 text-muted-2" />
            <span className="text-sm">Drop files or click to browse</span>
            <span className="text-xs text-muted-2">PDF, DOCX, TXT, CSV</span>
            <input
              type="file"
              multiple
              accept=".pdf,.docx,.txt,.csv"
              className="hidden"
              onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
            />
          </label>
          {files.length > 0 && (
            <ul className="mt-3 space-y-1 text-xs text-muted">
              {files.map((f) => <li key={f.name}>• {f.name}</li>)}
            </ul>
          )}
          {isDemo && (
            <Badge tone="accent" className="mt-3">
              Demo mode — sample documents will be used
            </Badge>
          )}
          <div className="mt-5 flex gap-2">
            <Button variant="ghost" onClick={() => setStep("profile")}>Back</Button>
            <Button className="flex-1" onClick={() => setStep("processing")}>
              {files.length ? `Process ${files.length} file(s)` : "Continue with sample data"}
            </Button>
          </div>
        </Card>
      )}

      {step === "processing" && (
        <Card>
          <h1 className="text-lg font-semibold">Processing your semester…</h1>
          <ul className="mt-5 space-y-3">
            {PIPELINE.map((label, i) => (
              <li key={label} className="flex items-center gap-3 text-sm">
                {i < pipeStep ? (
                  <Check className="h-4 w-4 text-success" />
                ) : i === pipeStep ? (
                  <Loader2 className="h-4 w-4 animate-spin text-accent" />
                ) : (
                  <span className="h-4 w-4 rounded-full border border-border-strong" />
                )}
                <span className={i <= pipeStep ? "text-foreground" : "text-muted-2"}>{label}</span>
              </li>
            ))}
          </ul>
          <Progress value={((pipeStep + 1) / PIPELINE.length) * 100} className="mt-5" />
        </Card>
      )}

      {step === "review" && (
        <Card>
          <h1 className="text-lg font-semibold">Camp Mate found</h1>
          <p className="mt-1 text-sm text-muted-2">Review before it commits — you can edit everything later.</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[
              ["Courses", found.courses],
              ["Topics", found.topics],
              ["Assignments", found.assignments],
              ["Exams", found.exams],
              ["Important dates", found.dates],
            ].map(([k, v]) => (
              <div key={k} className="rounded-md border border-border bg-surface-2 p-3">
                <p className="font-mono text-2xl font-semibold">{v}</p>
                <p className="text-xs text-muted-2">{k}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 flex gap-2">
            <Button variant="ghost" onClick={() => setStep("upload")}>Re-upload</Button>
            <Button
              className="flex-1"
              onClick={() => {
                router.push("/dashboard");
                router.refresh();
              }}
            >
              Create my semester
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

function F({
  label,
  v,
  on,
  type = "text",
}: {
  label: string;
  v: string;
  on: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-2">{label}</span>
      <input
        type={type}
        value={v}
        onChange={(e) => on(e.target.value)}
        className="h-10 w-full rounded-md border border-border bg-surface-2 px-3 text-sm outline-none focus:border-accent"
      />
    </label>
  );
}
