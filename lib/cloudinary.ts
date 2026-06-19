const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

const base = (resource: "image" | "video") =>
  `https://res.cloudinary.com/${CLOUD_NAME}/${resource}/upload`;

/** 400x400 square thumbnail, auto format + quality. */
export const thumbUrl = (id: string) =>
  `${base("image")}/f_auto,q_auto,w_400,h_400,c_fill/${id}`;

/** 800px-wide hero image. */
export const heroUrl = (id: string) =>
  `${base("image")}/f_auto,q_auto,w_800/${id}`;

/** Full-resolution image (auto format + quality). */
export const fullUrl = (id: string) => `${base("image")}/f_auto,q_auto/${id}`;

/** Square poster frame for a video, snapshot at 2s. */
export const videoThumbUrl = (id: string) =>
  `${base("video")}/f_auto,q_auto,so_2,w_400,h_400,c_fill/${id}.jpg`;

/** Streamable video URL (auto format + quality). */
export const videoUrl = (id: string) =>
  `${base("video")}/f_auto,q_auto/${id}`;
