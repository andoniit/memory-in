import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCircle } from "@/lib/auth";
import { polishStory } from "@/lib/openai";

/**
 * POST /api/ai/story  { pin_id, draft }
 * Rewrites the user's own draft into a warmer, poetic version and returns it.
 * Does NOT save — the user reviews/edits, then saves via PATCH /api/pins/[id].
 * Circle members only.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "AI help is not configured (missing OPENAI_API_KEY)." },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => null);
  const pinId = body?.pin_id as string | undefined;
  const draft = (body?.draft as string | undefined)?.trim();
  const mode = body?.mode === "rephrase" ? "rephrase" : "poetic";
  if (!pinId) {
    return NextResponse.json({ error: "pin_id is required" }, { status: 422 });
  }
  if (!draft) {
    return NextResponse.json(
      { error: "Write a few words first, then let AI polish them." },
      { status: 422 },
    );
  }

  const { data: pin } = await supabase
    .from("pins")
    .select("id, title, city, circle_id")
    .eq("id", pinId)
    .maybeSingle();
  if (!pin) {
    return NextResponse.json({ error: "Pin not found" }, { status: 404 });
  }

  const circle = await getCircle(user.id);
  if (!circle || circle.id !== pin.circle_id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const story = await polishStory({
      draft,
      title: pin.title,
      city: pin.city,
      mode,
    });
    if (!story) {
      return NextResponse.json({ error: "Empty result" }, { status: 502 });
    }
    return NextResponse.json({ story });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "AI request failed" },
      { status: 502 },
    );
  }
}
