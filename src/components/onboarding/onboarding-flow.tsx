"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Loader2, Plus, X } from "lucide-react";
import { Button, Card, Badge, Progress } from "@/components/ui";
import { createSemesterAction } from "@/app/(app)/actions";

type Step = "profile" | "courses" | "saving" | "done";

const SAVE_STEPS = [
  "Saving your profile",
  "Creating your semester",
  "Adding your courses",
  "Building your workspace",
];

const STARTER = ["", "", "", ""];

export function OnboardingFlow({
  defaultName,
  isDemo,
  canPersist,
}: {
  defaultName: string;
  isDemo: boolean;
  canPersist: boolean;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("profile");
  const [error, setError] = useState<string | null>(null);
  const [saveStep, setSaveStep] = useState(0);

  const now = new Date();
  const [profile, setProfile] = useState({
    name: defaultName,
    college: "",
    program: "",
    year: "3",
    careerGoal: "",
    studyHours: "15",
  });
  const [label, setLabel] = useState(
    `Semester ${now.getMonth() < 6 ? "· Spring" : "· Autumn"} ${now.getFullYear()}`,
  );
  const [courses, setCourses] = useState<{ name: string; code: string }[]>(
    STARTER.map(() => ({ name: "", code: "" })),
  );

  const validCourses = courses.filter((c) => c.name.trim());

  async function commit() {
    setError(null);
    setStep("saving");

    if (!canPersist) {
      // Demo / no database — show the animation then drop into the demo dashboard.
      for (let i = 0; i < SAVE_STEPS.length; i++) {
        setSaveStep(i);
        await wait(500);
      }
      setStep("done");
      await wait(700);
      router.push("/dashboard");
      router.refresh();
      return;
    }

    setSaveStep(1);
    const res = await createSemesterAction({
      label: label.trim(),
      courses: validCourses.map((c) => ({ name: c.name.trim(), code: c.code.trim() || undefined })),
      profile: {
        name: profile.name.trim(),
        college: profile.college.trim() || undefined,
        program: profile.program.trim() || undefined,
        year: Number(profile.year) || undefined,
        careerGoal: profile.careerGoal.trim() || undefined,
        studyHours: Number(profile.studyHours) || undefined,
      },
    });

    if (!res.ok) {
      setError(res.error);
      setStep("courses");
      return;
    }

    setSaveStep(3);
    await wait(400);
    setStep("done");
    await wait(700);
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        {(["profile", "courses", "saving", "done"] as Step[]).map((s, i) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full ${
              ["profile", "courses", "saving", "done"].indexOf(step) >= i ? "bg-accent" : "bg-surface-3"
            }`}
          />
        ))}
      </div>

      {step === "profile" && (
        <Card>
          <h1 className="text-lg font-semibold">Tell Camp Mate about you</h1>
          <p className="mt-1 text-sm text-muted-2">Personalises your dashboard and study plans.</p>
          <div className="mt-4 grid gap-3">
            <F label="Name" v={profile.name} on={(v) => setProfile({ ...profile, name: v })} />
            <F label="College / University" v={profile.college} on={(v) => setProfile({ ...profile, college: v })} />
            <F label="Degree / Program" v={profile.program} on={(v) => setProfile({ ...profile, program: v })} />
            <div className="grid grid-cols-2 gap-3">
              <F label="Year" type="number" v={profile.year} on={(v) => setProfile({ ...profile, year: v })} />
              <F label="Weekly study hours" type="number" v={profile.studyHours} on={(v) => setProfile({ ...profile, studyHours: v })} />
            </div>
            <F label="Career goal (optional)" v={profile.careerGoal} on={(v) => setProfile({ ...profile, careerGoal: v })} />
          </div>
          <Button className="mt-5 w-full" onClick={() => setStep("courses")} disabled={!profile.name.trim()}>
            Continue
          </Button>
        </Card>
      )}

      {step === "courses" && (
        <Card>
          <h1 className="text-lg font-semibold">Add your courses</h1>
          <p className="mt-1 text-sm text-muted-2">
            You&rsquo;ll add units, topics, assignments and exams inside each course next.
          </p>

          <div className="mt-4">
            <F label="Semester name" v={label} on={setLabel} />
          </div>

          <div className="mt-4 space-y-2">
            {courses.map((c, i) => (
              <div key={i} className="flex gap-2">
                <input
                  placeholder={`Course ${i + 1}`}
                  value={c.name}
                  onChange={(e) => {
                    const next = [...courses];
                    next[i] = { ...next[i], name: e.target.value };
                    setCourses(next);
                  }}
                  className="h-10 flex-1 rounded-md border border-border bg-surface-2 px-3 text-sm outline-none focus:border-accent"
                />
                <input
                  placeholder="Code"
                  value={c.code}
                  onChange={(e) => {
                    const next = [...courses];
                    next[i] = { ...next[i], code: e.target.value };
                    setCourses(next);
                  }}
                  className="h-10 w-24 rounded-md border border-border bg-surface-2 px-3 text-sm outline-none focus:border-accent"
                />
                {courses.length > 1 && (
                  <button
                    onClick={() => setCourses(courses.filter((_, j) => j !== i))}
                    className="grid h-10 w-10 place-items-center rounded-md border border-border text-muted-2 hover:text-danger"
                    aria-label="Remove course"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={() => setCourses([...courses, { name: "", code: "" }])}
            className="mt-2 inline-flex items-center gap-1.5 text-xs text-accent hover:underline"
          >
            <Plus className="h-3.5 w-3.5" /> Add another course
          </button>

          {isDemo && (
            <Badge tone="accent" className="mt-3 block w-fit">
              Demo mode — this preview won&rsquo;t be saved
            </Badge>
          )}
          {error && <p className="mt-3 text-xs text-danger">{error}</p>}

          <div className="mt-5 flex gap-2">
            <Button variant="ghost" onClick={() => setStep("profile")}>Back</Button>
            <Button className="flex-1" onClick={commit} disabled={validCourses.length === 0}>
              Create my semester ({validCourses.length} course{validCourses.length === 1 ? "" : "s"})
            </Button>
          </div>
        </Card>
      )}

      {step === "saving" && (
        <Card>
          <h1 className="text-lg font-semibold">Building your workspace…</h1>
          <ul className="mt-5 space-y-3">
            {SAVE_STEPS.map((s, i) => (
              <li key={s} className="flex items-center gap-3 text-sm">
                {i < saveStep ? (
                  <Check className="h-4 w-4 text-success" />
                ) : i === saveStep ? (
                  <Loader2 className="h-4 w-4 animate-spin text-accent" />
                ) : (
                  <span className="h-4 w-4 rounded-full border border-border-strong" />
                )}
                <span className={i <= saveStep ? "text-foreground" : "text-muted-2"}>{s}</span>
              </li>
            ))}
          </ul>
          <Progress value={((saveStep + 1) / SAVE_STEPS.length) * 100} className="mt-5" />
        </Card>
      )}

      {step === "done" && (
        <Card>
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5 text-success" />
            <h1 className="text-lg font-semibold">Your semester is ready</h1>
          </div>
          <p className="mt-2 text-sm text-muted-2">Taking you to your dashboard…</p>
        </Card>
      )}
    </div>
  );
}

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
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
