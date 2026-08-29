import { env, isAIConfigured } from "@/lib/env";

export { isAIConfigured };

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

/**
 * Minimal OpenAI-compatible chat completion. Works with any provider that
 * exposes the /chat/completions shape (OpenAI, OpenRouter, Groq, local, ...).
 * Throws `AI_NOT_CONFIGURED` when no key/model is set so callers can degrade.
 */
export async function chat(
  messages: ChatMessage[],
  opts: { temperature?: number; maxTokens?: number } = {},
): Promise<string> {
  if (!isAIConfigured) throw new Error("AI_NOT_CONFIGURED");

  const body = JSON.stringify({
    model: env.aiModel,
    messages,
    temperature: opts.temperature ?? 0.3,
    max_tokens: opts.maxTokens ?? 900,
  });

  // Retry transient rate-limit / overload responses a couple of times.
  let res: Response | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    res = await fetch(`${env.aiBaseUrl}/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${env.aiApiKey}` },
      body,
    });
    if (res.ok || ![429, 500, 502, 503].includes(res.status)) break;
    await new Promise((r) => setTimeout(r, 700 * (attempt + 1)));
  }

  if (!res || !res.ok) {
    const detail = res ? await res.text().catch(() => "") : "";
    throw new Error(`AI_REQUEST_FAILED ${res?.status ?? 0} ${detail.slice(0, 200)}`);
  }

  const json = await res.json();
  return json.choices?.[0]?.message?.content?.trim() ?? "";
}

/** Embeddings for RAG indexing/retrieval. */
export async function embed(input: string[]): Promise<number[][]> {
  if (!isAIConfigured) throw new Error("AI_NOT_CONFIGURED");
  const res = await fetch(`${env.aiBaseUrl}/embeddings`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.aiApiKey}`,
    },
    body: JSON.stringify({ model: env.aiEmbeddingModel, input }),
  });
  if (!res.ok) throw new Error(`AI_EMBED_FAILED ${res.status}`);
  const json = await res.json();
  return (json.data ?? []).map((d: { embedding: number[] }) => d.embedding);
}
