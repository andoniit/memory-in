import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";

export interface GeocodeResult {
  name: string;
  lat: number;
  lng: number;
}

/**
 * GET /api/geocode?q=Paris
 * Proxies OpenStreetMap Nominatim (free, no key). Server-side so we can set a
 * proper User-Agent and keep within usage policy. Cached for a day.
 */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) return NextResponse.json({ results: [] });

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("q", q);
  url.searchParams.set("limit", "5");
  url.searchParams.set("addressdetails", "0");

  const res = await fetch(url, {
    headers: {
      "User-Agent": "MemoryPin/1.0 (memory-map app)",
      "Accept-Language": "en",
    },
    next: { revalidate: 60 * 60 * 24 },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Geocoding failed" }, { status: 502 });
  }

  const raw = (await res.json()) as Array<{
    display_name: string;
    lat: string;
    lon: string;
  }>;

  const results: GeocodeResult[] = raw.map((r) => ({
    name: r.display_name,
    lat: parseFloat(r.lat),
    lng: parseFloat(r.lon),
  }));

  return NextResponse.json({ results });
}
