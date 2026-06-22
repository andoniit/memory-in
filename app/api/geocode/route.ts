import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";

export interface GeocodeResult {
  name: string;
  lat: number;
  lng: number;
}

/**
 * GET /api/geocode?q=Paris
 * Uses Mapbox geocoding when NEXT_PUBLIC_MAPBOX_TOKEN is set; otherwise falls
 * back to OpenStreetMap Nominatim. Server-side + cached for a day.
 */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) return NextResponse.json({ results: [] });

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  try {
    const results = token ? await mapbox(q, token) : await nominatim(q);
    return NextResponse.json({ results });
  } catch {
    // If Mapbox fails for any reason, try the free fallback.
    try {
      return NextResponse.json({ results: await nominatim(q) });
    } catch {
      return NextResponse.json({ error: "Geocoding failed" }, { status: 502 });
    }
  }
}

async function mapbox(q: string, token: string): Promise<GeocodeResult[]> {
  const url = new URL("https://api.mapbox.com/search/geocode/v6/forward");
  url.searchParams.set("q", q);
  url.searchParams.set("limit", "5");
  url.searchParams.set("access_token", token);

  const res = await fetch(url, { next: { revalidate: 60 * 60 * 24 } });
  if (!res.ok) throw new Error("mapbox failed");

  const data = (await res.json()) as {
    features?: Array<{
      properties?: { full_address?: string; name?: string };
      geometry?: { coordinates?: [number, number] };
    }>;
  };

  return (data.features ?? [])
    .filter((f) => f.geometry?.coordinates)
    .map((f) => ({
      name: f.properties?.full_address ?? f.properties?.name ?? q,
      lng: f.geometry!.coordinates![0],
      lat: f.geometry!.coordinates![1],
    }));
}

async function nominatim(q: string): Promise<GeocodeResult[]> {
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
  if (!res.ok) throw new Error("nominatim failed");

  const raw = (await res.json()) as Array<{
    display_name: string;
    lat: string;
    lon: string;
  }>;
  return raw.map((r) => ({
    name: r.display_name,
    lat: parseFloat(r.lat),
    lng: parseFloat(r.lon),
  }));
}
