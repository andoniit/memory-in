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
 * Generate a short, warm memory for a personal scrapbook. The pin can be a
 * place or any object (a book, a wall, a painting, a fridge magnet), so the
 * prompt stays object-agnostic. Uses Claude Opus 4.8 (current default model).
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

  const subject = city ? `${title} (${city})` : title;

  const prompt = `You are writing a short, warm memory for someone's digital scrapbook. The memory is attached to a real thing — it might be a place, but it could just as easily be an object like a book, a wall, a painting, or a fridge magnet.

Subject: ${subject}
Date: ${dateLabel}
Memory captions:
${captionBlock}

Write a 2-3 sentence story in a warm, personal first-person voice that captures the feeling of this memory. Be specific, warm, and poetic. Do not assume travel unless the captions imply it. No more than 80 words. Do not use the words "unforgettable" or "magical". Return only the story text, with no preamble.`;

  const response = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 400,
    messages: [{ role: "user", content: prompt }],
  });

  const block = response.content.find((b) => b.type === "text");
  return block && block.type === "text" ? block.text.trim() : "";
}
