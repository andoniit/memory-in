import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCircle } from "@/lib/auth";
import { BottomNav } from "@/components/layout/BottomNav";
import { DashboardGlobe, type DashPin } from "@/components/dashboard/DashboardGlobe";
import { iconBtnGhost } from "@/lib/ui";
import type { Memory, Pin } from "@/types/index";

export const dynamic = "force-dynamic";

/** Stable pseudo lat/lng for pins without a real location (objects). */
function pseudoPos(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const lat = (h % 120) - 60; // -60..59
  const lng = ((h >> 3) % 360) - 180; // -180..179
  return { lat, lng };
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.display_name) redirect("/onboarding");

  const circle = await getCircle(user.id);
  if (!circle) redirect("/login");

  const { data: pins } = await supabase
    .from("pins")
    .select("*")
    .eq("circle_id", circle.id)
    .order("visit_date", { ascending: false, nullsFirst: false });

  const pinList: Pin[] = pins ?? [];

  // Cover image + memory count per pin.
  const byPin = new Map<string, Memory[]>();
  if (pinList.length > 0) {
    const { data: memories } = await supabase
      .from("memories")
      .select("*")
      .in(
        "pin_id",
        pinList.map((p) => p.id),
      )
      .order("sort_order", { ascending: true });
    for (const m of memories ?? []) {
      const arr = byPin.get(m.pin_id) ?? [];
      arr.push(m);
      byPin.set(m.pin_id, arr);
    }
  }

  const dashPins: DashPin[] = pinList.map((p) => {
    const mems = byPin.get(p.id) ?? [];
    const placed =
      p.lat != null && p.lng != null && !(p.lat === 0 && p.lng === 0);
    const pos = placed ? { lat: p.lat!, lng: p.lng! } : pseudoPos(p.id);
    return {
      id: p.id,
      lat: pos.lat,
      lng: pos.lng,
      emoji: p.emoji,
      title: p.title,
      city: p.city,
      thumb_url: mems.find((m) => m.type !== "note")?.thumb_url ?? null,
      memory_count: mems.length,
    };
  });

  return (
    <main className="relative h-dvh overflow-hidden">
      {/* Top bar */}
      <header className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-page py-4">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-accent" />
          <span className="font-mono text-micro uppercase tracking-[0.2em]">
            MemoryPin
          </span>
        </div>
        <Link href="/settings" aria-label="Settings" className={iconBtnGhost}>
          <Settings className="h-5 w-5" strokeWidth={1.75} />
        </Link>
      </header>

      {/* Interactive globe of memories */}
      <Suspense fallback={null}>
        <DashboardGlobe pins={dashPins} />
      </Suspense>

      {/* Empty / hint state */}
      {dashPins.length === 0 ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-28 z-10 px-page text-center">
          <p className="text-body">No memories yet.</p>
          <p className="mx-auto mt-1 max-w-xs text-caption text-muted">
            Tap <span className="text-accent">+</span> to create your first pin —
            it&apos;ll appear here on the globe.
          </p>
        </div>
      ) : (
        <div className="pointer-events-none absolute inset-x-0 bottom-28 z-10 text-center">
          <span className="label">
            Tap a point to open it · drag to spin
          </span>
        </div>
      )}

      <BottomNav />
    </main>
  );
}
