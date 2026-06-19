import { customAlphabet } from "nanoid";

/**
 * 8-char URL-safe pin IDs. We drop look-alike characters (0/O, 1/l/I) so the
 * ID is comfortable to read when programming an NFC sticker by hand.
 * 54 chars ^ 8 ≈ 7.2e13 combinations — plenty for millions of pins.
 */
const alphabet =
  "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

export const pinId = customAlphabet(alphabet, 8);
