import OpenAI from "openai";

interface StoryInput {
  city: string | null;
  title: string;
  visitDate: string | null;
  captions: string[];
}

/**
 * Generate a short, warm memory for a personal scrapbook. The pin can be a
 * place or any object (a book, a wall, a painting, a fridge magnet), so the
 * prompt stays object-agnostic. Uses the OpenAI API.
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

  // Construct lazily (the SDK throws at construction without a key) so importing
  // this module during build never requires OPENAI_API_KEY.
  const client = new OpenAI();

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 300,
    messages: [{ role: "user", content: prompt }],
  });

  return response.choices[0]?.message?.content?.trim() ?? "";
}
