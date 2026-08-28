import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { isLiveMode } from "@/lib/env";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";

export const metadata = { title: "Set up your semester" };

export default async function OnboardingPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-4 py-12">
      <OnboardingFlow
        defaultName={user.name}
        isDemo={user.isDemo}
        canPersist={isLiveMode && !user.isDemo}
      />
    </div>
  );
}
