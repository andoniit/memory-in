import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { postLoginPath } from "@/lib/auth";

/**
 * Handles the magic-link / OAuth redirect: exchanges the `code` for a session,
 * then routes the user onward. `redirect` (when present) wins; otherwise we send
 * them to the dashboard (a personal circle is auto-created at signup).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirect = searchParams.get("redirect");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const dest =
        redirect && redirect.startsWith("/")
          ? redirect
          : user
            ? await postLoginPath()
            : "/dashboard";
      return NextResponse.redirect(`${origin}${dest}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
