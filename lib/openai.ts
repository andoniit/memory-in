import OpenAI from "openai";

export type PolishMode = "rephrase" | "poetic";

interface PolishInput {
  draft: string;
  title: string;
  city: string | null;
  mode: PolishMode;
}

/**
 * Rewrite the user's own memory note — either a clean rephrase or a warmer,
 * poetic version — faithful to what they wrote (no invented facts).
 */
export async function polishStory({
  draft,
  title,
  city,
  mode,
}: PolishInput): Promise<string> {
  const about = city ? `${title} (${city})` : title;

  const style =
    mode === "poetic"
      ? "into a warm, evocative, lightly poetic version that reads beautifully"
      : "into clearer, well-phrased prose — fix grammar and flow, keep it natural and plain";

  const prompt = `Rewrite the following personal memory note about "${about}" ${style}.

Rules:
- Keep it first person and faithful to what's written — do NOT invent facts, names, places, dates, or events.
- Preserve the original meaning and tone.
- 2-3 sentences, no more than 80 words.
- Do not use the words "unforgettable" or "magical".
- Return only the rewritten text — no preamble, no quotation marks.

Note:
${draft}`;

  const client = new OpenAI();
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 300,
    messages: [{ role: "user", content: prompt }],
  });

  return response.choices[0]?.message?.content?.trim() ?? "";
}
