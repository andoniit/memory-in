import { z } from "zod";

export const createPinSchema = z.object({
  title: z.string().min(1, "Title is required").max(120),
  city: z.string().max(160).optional().default(""),
  // Optional in Phase 1 (no geocoding yet); the globe in Phase 2 needs them.
  lat: z.number().min(-90).max(90).optional().default(0),
  lng: z.number().min(-180).max(180).optional().default(0),
  emoji: z.string().max(8).default("📍"),
  visit_date: z.string().optional(), // ISO date
  is_public: z.boolean().default(true),
});

export const createMemorySchema = z.object({
  pin_id: z.string().min(1),
  type: z.enum(["photo", "video", "note"]),
  cloudinary_id: z.string().optional(),
  caption: z.string().max(2000).optional(),
  taken_at: z.string().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  duration_secs: z.number().int().nonnegative().optional(),
});

export type CreatePinSchema = z.infer<typeof createPinSchema>;
export type CreateMemorySchema = z.infer<typeof createMemorySchema>;
