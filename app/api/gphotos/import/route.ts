import { NextResponse, type NextRequest } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { createClient } from "@/lib/supabase/server";
import { getCircle } from "@/lib/auth";
import { fullUrl, thumbUrl, videoThumbUrl, videoUrl } from "@/lib/cloudinary";

export const maxDuration = 60;

/**
 * POST /api/gphotos/import  { accessToken, sessionId, pinId }
 * Polls the picker session; once the user has picked, downloads the selected
 * media from Google, uploads to Cloudinary, and saves memories to the pin.
 * Returns { done:false } while still waiting for the picker.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "Cloudinary is not configured." },
      { status: 500 },
    );
  }
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });

  const { accessToken, sessionId, pinId } = (await request
    .json()
    .catch(() => ({}))) as {
    accessToken?: string;
    sessionId?: string;
    pinId?: string;
  };
  if (!accessToken || !sessionId || !pinId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Verify the pin belongs to the caller's circle.
  const { data: pin } = await supabase
    .from("pins")
    .select("id, circle_id")
    .eq("id", pinId)
    .maybeSingle();
  if (!pin) return NextResponse.json({ error: "Pin not found" }, { status: 404 });
  const circle = await getCircle(user.id);
  if (!circle || circle.id !== pin.circle_id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const auth = { Authorization: `Bearer ${accessToken}` };

  // Is the picker done?
  const sessionRes = await fetch(
    `https://photospicker.googleapis.com/v1/sessions/${sessionId}`,
    { headers: auth },
  );
  if (!sessionRes.ok) {
    return NextResponse.json({ error: "Session expired." }, { status: 410 });
  }
  const session = await sessionRes.json();
  if (!session.mediaItemsSet) {
    return NextResponse.json({ done: false });
  }

  // List the picked items.
  const listRes = await fetch(
    `https://photospicker.googleapis.com/v1/mediaItems?sessionId=${sessionId}&pageSize=50`,
    { headers: auth },
  );
  const list = await listRes.json();
  const items: Array<{
    type?: string;
    mediaFile?: { baseUrl?: string; mimeType?: string };
  }> = list.mediaItems ?? [];

  let imported = 0;
  for (const item of items) {
    const mf = item.mediaFile;
    if (!mf?.baseUrl) continue;
    const isVideo = item.type === "VIDEO";
    const dl = await fetch(`${mf.baseUrl}=${isVideo ? "dv" : "d"}`, {
      headers: auth,
    });
    if (!dl.ok) continue;
    const buf = Buffer.from(await dl.arrayBuffer());
    const dataUri = `data:${mf.mimeType ?? "image/jpeg"};base64,${buf.toString(
      "base64",
    )}`;
    const up = await cloudinary.uploader.upload(dataUri, {
      folder: `memorypin/${circle.id}`,
      resource_type: "auto",
    });
    const type = up.resource_type === "video" ? "video" : "photo";
    await supabase.from("memories").insert({
      pin_id: pinId,
      uploaded_by: user.id,
      type,
      cloudinary_id: up.public_id,
      url: type === "video" ? videoUrl(up.public_id) : fullUrl(up.public_id),
      thumb_url:
        type === "video" ? videoThumbUrl(up.public_id) : thumbUrl(up.public_id),
      width: up.width,
      height: up.height,
    });
    imported++;
  }

  // Best-effort cleanup of the picker session.
  fetch(`https://photospicker.googleapis.com/v1/sessions/${sessionId}`, {
    method: "DELETE",
    headers: auth,
  }).catch(() => {});

  return NextResponse.json({ done: true, imported });
}
