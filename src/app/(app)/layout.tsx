import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getWorkspace } from "@/lib/data/workspace";
import { isLiveMode } from "@/lib/env";
import { AppShell } from "@/components/app/shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const ws = await getWorkspace();

  // Live account with no semester yet → send them through onboarding.
  if (!ws && isLiveMode && !user.isDemo) redirect("/onboarding");

  return (
    <AppShell
      user={{ name: user.name, email: user.email }}
      semesterLabel={ws?.semester.label ?? "No active semester"}
      isDemo={user.isDemo || Boolean(ws?.isDemo)}
    >
      {children}
    </AppShell>
  );
}
