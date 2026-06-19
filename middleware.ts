import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static assets and API routes.
     * The public NFC page `/p/[id]` is matched (so the session refreshes)
     * but not in PROTECTED, so it stays open.
     */
    "/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|api).*)",
  ],
};
