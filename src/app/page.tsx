import Link from "next/link";
import {
  ArrowRight,
  FileText,
  Sparkles,
  Dumbbell,
  CalendarDays,
  BarChart3,
  GraduationCap,
} from "lucide-react";
import { ButtonLink } from "@/components/ui";
import { StartDemoButton } from "@/components/marketing/start-demo-button";

const FEATURES = [
  { icon: FileText, title: "Syllabus → semester", body: "Upload PDFs, notes and past papers. Camp Mate extracts courses, units, topics, deadlines and exams — you review and correct before it commits." },
  { icon: Sparkles, title: "Ask Camp Mate", body: "An assistant that answers from your own material first, with the source file and page. Clearly separates your notes from general explanation." },
  { icon: Dumbbell, title: "Practice & quizzes", body: "Generate MCQs and conceptual questions from your syllabus. Surprise Me builds a personalised set from your weak topics and upcoming exams." },
  { icon: CalendarDays, title: "Planner with intelligence", body: "Assignments, labs, projects and study sessions on one timeline — with deadline-cluster warnings when a hard week is coming." },
  { icon: BarChart3, title: "Exam readiness", body: "Syllabus coverage x practice accuracy gives a readiness score per exam, plus a prioritised list of what to revise next." },
  { icon: GraduationCap, title: "One workspace", body: "Every course, topic, document and score in one place, scoped to you. Nothing shared, nothing leaked." },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-accent font-mono text-sm font-bold text-black">C</span>
          <span className="text-sm font-semibold tracking-tight">Camp Mate</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-muted hover:text-foreground">Sign in</Link>
          <ButtonLink href="/signup" size="sm">Get started</ButtonLink>
        </div>
      </header>

      <section className="mx-auto w-full max-w-6xl flex-1 px-6 pt-16 pb-24">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
          Personal academic operating system
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-[1.1] tracking-tight sm:text-6xl">
          Upload your semester.{" "}
          <span className="text-accent">Camp Mate organizes it.</span>
        </h1>
        <p className="mt-5 max-w-xl text-base text-muted">
          One upload turns your syllabus and notes into an organised semester — courses, topics,
          deadlines, study plans, practice and AI help grounded in your own material.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <ButtonLink href="/signup" size="lg">
            Start your semester <ArrowRight className="h-4 w-4" />
          </ButtonLink>
          <StartDemoButton />
        </div>

        <div className="mt-20 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-xl border border-border bg-surface p-5">
              <f.icon className="h-5 w-5 text-accent" />
              <h3 className="mt-3 text-sm font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-2">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto w-full max-w-6xl px-6 py-6 text-xs text-muted-2">
          Camp Mate · built for college students · demo data is clearly labelled
        </div>
      </footer>
    </div>
  );
}
