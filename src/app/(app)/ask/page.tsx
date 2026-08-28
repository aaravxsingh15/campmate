import { PageHeader } from "@/components/ui";
import { AskChat } from "@/components/app/ask-chat";
import { isAIConfigured } from "@/lib/env";

export const metadata = { title: "Ask Camp Mate" };

export default function AskPage() {
  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <PageHeader
        title="Ask Camp Mate"
        description="Answers grounded in your uploaded material, with sources. Falls back to general explanation when your notes don't cover it."
      />
      <AskChat aiConfigured={isAIConfigured} />
    </div>
  );
}
