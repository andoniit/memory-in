import Anthropic from "@anthropic-ai/sdk";

// Reads ANTHROPIC_API_KEY from the environment.
const client = new Anthropic();

interface StoryInput {
  city: string | null;
  title: string;
  visitDate: string | null;
  captions: string[];
}

/**
 * Generate a short, warm travel memory for a couple's scrapbook.
 * Uses Claude Opus 4.8 (current default model).
 */
export async function generateTravelStory({
  city,
  title,
  visitDate,
  captions,
}: StoryInput): Promise<string> {
  const dateLabel = visitDate
    ? new Date(visitDate).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "an unspecified time";

  const captionBlock = captions.length
    ? captions.join("\n")
    : "(no captions provided)";

  const prompt = `You are writing a short, warm travel memory for a couple's digital scrapbook.

Location: ${city ?? title}
Date: ${dateLabel}
Memory captions:
${captionBlock}

Write a 2-3 sentence travel story in first person plural ("we") that captures the feeling of this trip. Be specific, warm, and poetic. No more than 80 words. Do not use the words "unforgettable" or "magical". Return only the story text, with no preamble.`;

  const response = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 400,
    messages: [{ role: "user", content: prompt }],
  });

  const block = response.content.find((b) => b.type === "text");
  return block && block.type === "text" ? block.text.trim() : "";
}
