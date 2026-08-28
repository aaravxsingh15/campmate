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

  const res = await fetch(`${env.aiBaseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.aiApiKey}`,
    },
    body: JSON.stringify({
      model: env.aiModel,
      messages,
      temperature: opts.temperature ?? 0.3,
      max_tokens: opts.maxTokens ?? 900,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`AI_REQUEST_FAILED ${res.status} ${detail.slice(0, 200)}`);
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
