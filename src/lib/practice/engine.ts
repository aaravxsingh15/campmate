import { chat, isAIConfigured } from "@/lib/ai/provider";

export type GenQuestion = {
  prompt: string;
  options: string[];
  answer: string;
  explanation: string;
  topicId: string | null;
  topicLabel: string;
  grounded: boolean;
};

type TopicSeed = {
  id: string;
  title: string;
  unit: string;
  courseName: string;
};

function shuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = (seed * 9301 + 49297 + i * 233) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function templated(topic: TopicSeed, seed: number): GenQuestion {
  const correct = `A correct account of ${topic.title}`;
  return {
    prompt: `Which statement best describes "${topic.title}"${topic.unit ? ` (${topic.unit})` : ""}?`,
    options: shuffle(
      [
        correct,
        `A property that only holds for finite cases`,
        `An unrelated result from ${topic.courseName}`,
        `The exact opposite of ${topic.title}`,
      ],
      seed,
    ),
    answer: correct,
    explanation: `${topic.title} is part of ${topic.unit || topic.courseName}. Review your notes for the precise definition and a worked example.`,
    topicId: topic.id,
    topicLabel: `${topic.courseName}${topic.unit ? ` · ${topic.unit}` : ""}`,
    grounded: false,
  };
}

/**
 * Generate MCQs for the given topics. Uses the configured AI provider when
 * available (grounded in the topic list + any context), otherwise falls back
 * to deterministic templated questions.
 */
export async function generateQuestions(
  topics: TopicSeed[],
  count: number,
  difficulty: string,
  context = "",
): Promise<GenQuestion[]> {
  const picked = Array.from({ length: count }, (_, i) => topics[i % topics.length]).filter(Boolean);

  if (isAIConfigured && picked.length) {
    try {
      const list = picked
        .map((t, i) => `${i + 1}. ${t.title} — ${t.courseName}${t.unit ? ` (${t.unit})` : ""}`)
        .join("\n");
      const raw = await chat(
        [
          {
            role: "system",
            content:
              "You write multiple-choice questions for a college student. Return ONLY a JSON array. " +
              'Each item: {"prompt": string, "options": [4 strings], "answer": string (must equal one option), "explanation": string}. ' +
              "Exactly one correct option. No markdown, no prose outside the JSON.",
          },
          {
            role: "user",
            content:
              `Difficulty: ${difficulty}. Write ${picked.length} questions, one per topic in order:\n${list}` +
              (context ? `\n\nUse this source material where relevant:\n${context.slice(0, 4000)}` : ""),
          },
        ],
        { temperature: 0.4, maxTokens: 1800 },
      );

      const json = JSON.parse(raw.replace(/^```json\s*|\s*```$/g, "").trim());
      if (Array.isArray(json)) {
        return json.slice(0, picked.length).map((q, i): GenQuestion => {
          const t = picked[i];
          const options: string[] = Array.isArray(q.options) ? q.options.map(String).slice(0, 4) : [];
          const answer = options.includes(q.answer) ? q.answer : options[0];
          return {
            prompt: String(q.prompt ?? `About ${t.title}`),
            options: options.length === 4 ? options : templated(t, i).options,
            answer: answer ?? templated(t, i).answer,
            explanation: String(q.explanation ?? ""),
            topicId: t.id,
            topicLabel: `${t.courseName}${t.unit ? ` · ${t.unit}` : ""}`,
            grounded: Boolean(context),
          };
        });
      }
    } catch {
      // fall through to templated
    }
  }

  return picked.map((t, i) => templated(t, i));
}
