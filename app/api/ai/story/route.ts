import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCircle } from "@/lib/auth";
import { generateTravelStory } from "@/lib/claude";

/**
 * POST /api/ai/story  { pin_id }
 * Generates a travel story from the pin's details + memory captions, saves it
 * to pins.story, and returns it. Circle members only.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "AI stories are not configured (missing ANTHROPIC_API_KEY)." },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => null);
  const pinId = body?.pin_id as string | undefined;
  if (!pinId) {
    return NextResponse.json({ error: "pin_id is required" }, { status: 422 });
  }

  const { data: pin } = await supabase
    .from("pins")
    .select("id, title, city, visit_date, circle_id")
    .eq("id", pinId)
    .maybeSingle();
  if (!pin) {
    return NextResponse.json({ error: "Pin not found" }, { status: 404 });
  }

  const circle = await getCircle(user.id);
  if (!circle || circle.id !== pin.circle_id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: memories } = await supabase
    .from("memories")
    .select("caption")
    .eq("pin_id", pinId)
    .not("caption", "is", null)
    .limit(20);

  const captions = (memories ?? [])
    .map((m) => m.caption)
    .filter((c): c is string => !!c && c.trim().length > 0);

  let story: string;
  try {
    story = await generateTravelStory({
      city: pin.city,
      title: pin.title,
      visitDate: pin.visit_date,
      captions,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Story generation failed" },
      { status: 502 },
    );
  }

  if (!story) {
    return NextResponse.json({ error: "Empty story" }, { status: 502 });
  }

  const { error } = await supabase
    .from("pins")
    .update({ story })
    .eq("id", pinId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ story });
}
