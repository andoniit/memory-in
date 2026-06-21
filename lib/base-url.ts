import { headers } from "next/headers";

/**
 * The site's base URL, derived from the incoming request host so generated
 * links (pin URLs, invite links) always match the domain the user is on —
 * memorypin.xyz in production, localhost in dev — without depending on an env
 * var being set. NEXT_PUBLIC_APP_URL is only a last-resort fallback.
 */
export async function getBaseUrl(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (host) {
    const proto =
      h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
    return `${proto}://${host}`;
  }
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}
