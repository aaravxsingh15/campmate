import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <Link href="/" className="mb-8 flex items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-md bg-accent font-mono text-base font-bold text-black">
          C
        </span>
        <span className="text-base font-semibold tracking-tight">Camp Mate</span>
      </Link>
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-6">
        {children}
      </div>
    </div>
  );
}
