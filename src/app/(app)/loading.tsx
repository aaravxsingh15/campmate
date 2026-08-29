export default function Loading() {
  return (
    <div className="space-y-6 animate-in">
      <div className="h-8 w-56 rounded-md bg-surface-2" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 rounded-xl border border-border bg-surface" />
        ))}
      </div>
      <div className="h-64 rounded-xl border border-border bg-surface" />
    </div>
  );
}
