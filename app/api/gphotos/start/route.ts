import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/gphotos/start  { accessToken }
 * Creates a Google Photos Picker session and returns the picker URL the user
 * opens to choose photos. The access token (photospicker scope) is obtained on
 * the client via Google Identity Services.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { accessToken } = (await request.json().catch(() => ({}))) as {
    accessToken?: string;
  };
  if (!accessToken) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const res = await fetch("https://photospicker.googleapis.com/v1/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: "{}",
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: "Could not start a Google Photos session." },
      { status: 502 },
    );
  }

  const s = await res.json();
  return NextResponse.json({ id: s.id, pickerUri: s.pickerUri });
}
