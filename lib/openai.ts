import OpenAI from "openai";

interface PolishInput {
  draft: string;
  title: string;
  city: string | null;
}

/**
 * Rewrite the user's own memory note into a warmer, more poetic version —
 * faithful to what they wrote (no invented facts). Uses the OpenAI API.
 */
export async function polishStory({
  draft,
  title,
  city,
}: PolishInput): Promise<string> {
  const about = city ? `${title} (${city})` : title;

  const prompt = `Rewrite the following personal memory note about "${about}" into a warm, evocative, lightly poetic version.

Rules:
- Keep it first person and faithful to what's written — do NOT invent facts, names, places, dates, or events.
- Preserve the original meaning and tone; just make it read beautifully.
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
