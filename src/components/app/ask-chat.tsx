"use client";

import { useState } from "react";
import { Send, FileText } from "lucide-react";
import { Button, Badge } from "@/components/ui";

type Source = { filename: string; page?: number };
type Msg = {
  role: "user" | "assistant";
  content: string;
  grounded?: boolean;
  sources?: Source[];
};

const SUGGESTIONS = [
  "Explain equivalence relations",
  "What is included in OOP Unit 3?",
  "Explain polymorphism for my exam",
  "What does my syllabus say about templates?",
];

export function AskChat({ aiConfigured }: { aiConfigured: boolean }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    setMessages((m) => [...m, { role: "user", content: q }]);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const json = await res.json();
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: json.answer ?? json.error ?? "Something went wrong.",
          grounded: json.grounded,
          sources: json.sources,
        },
      ]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Request failed — please retry." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-border bg-surface">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {!messages.length && (
          <div className="space-y-4 py-6">
            {!aiConfigured && (
              <Badge tone="warning">
                AI provider not configured — set AI_API_KEY & AI_MODEL for live answers
              </Badge>
            )}
            <p className="text-sm text-muted-2">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-border bg-surface-2 px-3 py-1.5 text-xs text-muted hover:border-border-strong hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
            <div
              className={
                m.role === "user"
                  ? "max-w-[85%] rounded-lg bg-accent px-3 py-2 text-sm text-black"
                  : "max-w-[90%] space-y-2"
              }
            >
              {m.role === "assistant" && m.grounded !== undefined && (
                <Badge tone={m.grounded ? "success" : "muted"}>
                  {m.grounded ? "Based on your material" : "General explanation"}
                </Badge>
              )}
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.content}</p>
              {m.sources && m.sources.length > 0 && (
                <div className="space-y-1 rounded-md border border-border bg-surface-2 p-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-2">Source</p>
                  {m.sources.map((s, j) => (
                    <p key={j} className="flex items-center gap-1.5 text-xs text-muted">
                      <FileText className="h-3 w-3" />
                      {s.filename}
                      {s.page ? ` · Page ${s.page}` : ""}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {busy && <p className="text-sm text-muted-2">Camp Mate is thinking…</p>}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
        className="flex gap-2 border-t border-border p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your courses, syllabus or notes…"
          className="h-10 flex-1 rounded-md border border-border bg-surface-2 px-3 text-sm outline-none focus:border-accent"
        />
        <Button type="submit" disabled={busy || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
