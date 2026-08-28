import Link from "next/link";
import * as React from "react";
import { cn } from "@/lib/utils";

/* ---------- Button ---------- */
type ButtonVariant = "primary" | "outline" | "ghost" | "danger";
type CommonProps = {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  className?: string;
  children: React.ReactNode;
};

const btn = (variant: ButtonVariant = "primary", size: "sm" | "md" | "lg" = "md") =>
  cn(
    "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]",
    "disabled:opacity-50 disabled:pointer-events-none",
    size === "sm" && "h-8 px-3 text-xs",
    size === "md" && "h-10 px-4 text-sm",
    size === "lg" && "h-11 px-5 text-sm",
    variant === "primary" && "bg-accent text-black hover:bg-accent-hover active:bg-accent-press",
    variant === "outline" && "border border-border-strong text-foreground hover:bg-surface-2",
    variant === "ghost" && "text-muted hover:text-foreground hover:bg-surface-2",
    variant === "danger" && "bg-danger/15 text-danger hover:bg-danger/25",
  );

export function Button({
  variant,
  size,
  className,
  children,
  ...props
}: CommonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={cn(btn(variant, size), className)} {...props}>
      {children}
    </button>
  );
}

export function ButtonLink({
  variant,
  size,
  className,
  children,
  href,
  ...props
}: CommonProps & { href: string } & Omit<React.ComponentProps<typeof Link>, "href">) {
  return (
    <Link href={href} className={cn(btn(variant, size), className)} {...props}>
      {children}
    </Link>
  );
}

/* ---------- Card ---------- */
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface p-5 shadow-[0_1px_0_0_rgba(255,255,255,0.02)_inset]",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  action,
  hint,
}: {
  title: string;
  action?: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-2">
          {title}
        </h3>
        {hint && <p className="mt-0.5 text-xs text-muted-2">{hint}</p>}
      </div>
      {action}
    </div>
  );
}

/* ---------- Badge ---------- */
export function Badge({
  children,
  tone = "default",
  className,
}: {
  children: React.ReactNode;
  tone?: "default" | "accent" | "success" | "warning" | "danger" | "muted";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
        tone === "default" && "bg-surface-3 text-muted",
        tone === "accent" && "bg-accent-soft text-accent",
        tone === "success" && "bg-success/15 text-success",
        tone === "warning" && "bg-warning/15 text-warning",
        tone === "danger" && "bg-danger/15 text-danger",
        tone === "muted" && "bg-surface-2 text-muted-2",
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ---------- Progress ---------- */
export function Progress({
  value,
  className,
  tone = "accent",
}: {
  value: number;
  className?: string;
  tone?: "accent" | "success" | "warning";
}) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-surface-3", className)}>
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-500",
          tone === "accent" && "bg-accent",
          tone === "success" && "bg-success",
          tone === "warning" && "bg-warning",
        )}
        style={{ width: `${v}%` }}
      />
    </div>
  );
}

/* ---------- Empty state ---------- */
export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border-strong bg-surface/50 px-6 py-14 text-center">
      {icon && <div className="mb-4 text-muted-2">{icon}</div>}
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-2">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ---------- Page header ---------- */
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-2">{description}</p>}
      </div>
      {action}
    </div>
  );
}

/* ---------- Stat ---------- */
export function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
}) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-2">{label}</p>
      <p className="mt-1 font-mono text-2xl font-semibold text-foreground">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-2">{sub}</p>}
    </Card>
  );
}
