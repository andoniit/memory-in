import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { createClient } from "@/lib/supabase/server";
import { getCircle } from "@/lib/auth";

/**
 * GET /api/upload-url
 * Returns signed parameters so the phone can upload directly to Cloudinary
 * (the API secret never leaves the server). Use `resource_type: 'auto'` on the
 * client so a single preset accepts both photos and videos.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const circle = await getCircle(user.id);
  if (!circle) {
    return NextResponse.json(
      { error: "No circle found for this account." },
      { status: 400 },
    );
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

  const timestamp = Math.round(Date.now() / 1000);
  const folder = `memorypin/${circle.id}`;

  // Sign exactly the params the client will send (besides file/api_key).
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    apiSecret,
  );

  return NextResponse.json({
    upload_url: `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
    api_key: apiKey,
    timestamp,
    signature,
    folder,
  });
}
