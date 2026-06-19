import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCouple } from "@/lib/auth";
import { pinId } from "@/lib/nanoid";
import { createPinSchema } from "@/lib/validation";

/** GET /api/pins — all pins for the authenticated couple (dashboard/globe). */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const couple = await getCouple(user.id);
  if (!couple) return NextResponse.json({ pins: [] });

  const { data, error } = await supabase
    .from("pins")
    .select("*")
    .eq("couple_id", couple.id)
    .order("visit_date", { ascending: false, nullsFirst: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ pins: data });
}

/** POST /api/pins — create a pin for the caller's couple. */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const couple = await getCouple(user.id);
  if (!couple) {
    return NextResponse.json(
      { error: "Create a couple before adding pins." },
      { status: 400 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = createPinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 422 },
    );
  }
  const input = parsed.data;

  const id = pinId();
  const { error } = await supabase.from("pins").insert({
    id,
    couple_id: couple.id,
    created_by: user.id,
    title: input.title,
    city: input.city || null,
    lat: input.lat,
    lng: input.lng,
    emoji: input.emoji,
    visit_date: input.visit_date || null,
    is_public: input.is_public,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return NextResponse.json(
    { id, url: `${appUrl}/p/${id}` },
    { status: 201 },
  );
}
