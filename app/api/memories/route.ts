import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createMemorySchema } from "@/lib/validation";
import { thumbUrl, fullUrl, videoThumbUrl, videoUrl } from "@/lib/cloudinary";

/**
 * POST /api/memories — attach a memory to a pin.
 * RLS ensures the caller is a member of the pin's couple.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createMemorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 422 },
    );
  }
  const m = parsed.data;

  if (m.type !== "note" && !m.cloudinary_id) {
    return NextResponse.json(
      { error: "cloudinary_id is required for photo/video memories." },
      { status: 422 },
    );
  }

  // Derive display URLs from the Cloudinary public_id.
  let url: string | null = null;
  let thumb: string | null = null;
  if (m.cloudinary_id) {
    if (m.type === "video") {
      url = videoUrl(m.cloudinary_id);
      thumb = videoThumbUrl(m.cloudinary_id);
    } else if (m.type === "photo") {
      url = fullUrl(m.cloudinary_id);
      thumb = thumbUrl(m.cloudinary_id);
    }
  }

  const { data, error } = await supabase
    .from("memories")
    .insert({
      pin_id: m.pin_id,
      uploaded_by: user.id,
      type: m.type,
      cloudinary_id: m.cloudinary_id ?? null,
      url,
      thumb_url: thumb,
      caption: m.caption ?? null,
      taken_at: m.taken_at ?? null,
      width: m.width ?? null,
      height: m.height ?? null,
      duration_secs: m.duration_secs ?? null,
    })
    .select()
    .single();

  if (error) {
    // RLS denial surfaces here for non-members.
    return NextResponse.json({ error: error.message }, { status: 403 });
  }

  return NextResponse.json({ memory: data }, { status: 201 });
}
