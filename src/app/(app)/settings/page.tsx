import { getWorkspace } from "@/lib/data/workspace";
import { isAIConfigured, isLiveMode, isSupabaseConfigured } from "@/lib/env";
import { Card, CardHeader, PageHeader, Badge } from "@/components/ui";
import { SettingsForm } from "@/components/app/settings-form";
import { SignOutButton } from "@/components/app/sign-out-button";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const ws = await getWorkspace();

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Profile, semester and system status." />

      <Card>
        <CardHeader title="Profile" />
        <SettingsForm
          initial={ws?.profile ?? { name: "", college: "", program: "", year: 0, careerGoal: "", studyHours: 0 }}
          isDemo={Boolean(ws?.isDemo)}
        />
      </Card>

      <Card>
        <CardHeader title="System status" />
        <ul className="space-y-2 text-sm">
          <StatusRow label="Supabase (auth + storage)" ok={isSupabaseConfigured} />
          <StatusRow label="Database (Postgres)" ok={isLiveMode} />
          <StatusRow label="AI provider" ok={isAIConfigured} />
        </ul>
        <p className="mt-3 text-xs text-muted-2">
          Set the matching environment variables in Vercel to enable each capability. Camp Mate runs
          in demo mode until Supabase and the database are configured.
        </p>
      </Card>

      <Card>
        <CardHeader title="Session" />
        <SignOutButton />
      </Card>
    </div>
  );
}

function StatusRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <li className="flex items-center justify-between">
      <span>{label}</span>
      <Badge tone={ok ? "success" : "muted"}>{ok ? "Connected" : "Not configured"}</Badge>
    </li>
  );
}
