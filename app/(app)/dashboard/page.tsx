import { redirect } from "next/navigation";
import Link from "next/link";
import { Settings, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCouple } from "@/lib/auth";
import { BottomNav } from "@/components/layout/BottomNav";
import { PinCard } from "@/components/pin/PinCard";
import { GlobePanel, type GlobePinFull } from "@/components/dashboard/GlobePanel";
import { iconBtnGhost } from "@/lib/ui";
import type { Memory, Pin, PinWithMemories } from "@/types/index";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const couple = await getCouple(user.id);
  if (!couple) redirect("/settings");

  const { data: pins } = await supabase
    .from("pins")
    .select("*")
    .eq("couple_id", couple.id)
    .order("visit_date", { ascending: false, nullsFirst: false });

  const pinList: Pin[] = pins ?? [];

  let byPin = new Map<string, Memory[]>();
  if (pinList.length > 0) {
    const { data: memories } = await supabase
      .from("memories")
      .select("*")
      .in(
        "pin_id",
        pinList.map((p) => p.id),
      )
      .order("sort_order", { ascending: true });
    byPin = (memories ?? []).reduce((map, m) => {
      const arr = map.get(m.pin_id) ?? [];
      arr.push(m);
      map.set(m.pin_id, arr);
      return map;
    }, new Map<string, Memory[]>());
  }

  const enriched: PinWithMemories[] = pinList.map((p) => {
    const mems = byPin.get(p.id) ?? [];
    return {
      ...p,
      memories: mems,
      cover: mems.find((m) => m.type !== "note"),
      memory_count: mems.length,
    };
  });

  const globePins: GlobePinFull[] = enriched.map((p) => ({
    id: p.id,
    lat: p.lat,
    lng: p.lng,
    title: p.title,
    city: p.city,
    emoji: p.emoji,
    thumb_url: p.cover?.thumb_url ?? null,
    memory_count: p.memory_count,
  }));

  return (
    <main className="min-h-dvh pb-28">
      {/* Top bar */}
      <header className="flex items-center justify-between px-page py-4">
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

      {/* Globe */}
      <GlobePanel pins={globePins} />

      {/* Pin list */}
      <div className="flex items-center justify-between border-t border-border px-page pb-3 pt-6">
        <span className="label">Your memories</span>
        <span className="font-mono text-micro tabular-nums text-muted">
          {String(enriched.length).padStart(2, "0")}
        </span>
      </div>

      {enriched.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 px-page">
          {enriched.map((pin) => (
            <PinCard key={pin.id} pin={pin} />
          ))}
        </div>
      ) : (
        <div className="px-page py-12 text-center">
          <p className="text-body">No pins yet.</p>
          <p className="mx-auto mt-1 max-w-xs text-body text-muted">
            Create your first memory pin, then program an NFC sticker with its
            link.
          </p>
          <Link
            href="/pin/new"
            className="mt-6 inline-flex min-h-[48px] items-center gap-2 rounded-ctl bg-accent px-5 text-body font-medium text-white transition-colors hover:bg-accent-strong"
          >
            <Plus className="h-5 w-5" /> New pin
          </Link>
        </div>
      )}

      <BottomNav />
    </main>
  );
}
