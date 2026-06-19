import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "icons");

// A simple branded mark: navy rounded square with a pink map pin.
const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="#0a0f1e"/>
  <path d="M256 120c-66 0-120 53-120 119 0 89 120 153 120 153s120-64 120-153c0-66-54-119-120-119z"
        fill="#ff6b9d"/>
  <circle cx="256" cy="239" r="46" fill="#0a0f1e"/>
</svg>`;

await mkdir(outDir, { recursive: true });

const targets = [
  { size: 192, name: "icon-192.png" },
  { size: 512, name: "icon-512.png" },
  { size: 180, name: "apple-touch-icon.png" },
];

for (const { size, name } of targets) {
  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toFile(join(outDir, name));
  console.log("wrote", name);
}
