import { redirect } from "next/navigation";
import Link from "next/link";
import { Settings, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCouple } from "@/lib/auth";
import { BottomNav } from "@/components/layout/BottomNav";
import { PinCard } from "@/components/pin/PinCard";
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

  // One query for all memories across the couple's pins, then group in JS.
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

  return (
    <main className="min-h-dvh pb-24">
      {/* Top bar */}
      <header className="flex items-center justify-between px-page pt-safe">
        <div className="py-3">
          <span className="text-heading">MemoryPin</span>
        </div>
        <Link
          href="/settings"
          aria-label="Settings"
          className="flex h-11 w-11 items-center justify-center rounded-full text-text-muted"
        >
          <Settings className="h-5 w-5" />
        </Link>
      </header>

      {/* Globe placeholder (Phase 2) */}
      <section
        id="globe"
        className="mx-page flex h-40 items-center justify-center rounded-2xl border border-border bg-surface text-caption text-text-muted"
      >
        🌍 Your globe lands in Phase 2
      </section>

      <h2 className="px-page pb-2 pt-5 text-micro uppercase tracking-wide text-text-muted">
        Your memories
      </h2>

      {enriched.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 px-page">
          {enriched.map((pin) => (
            <PinCard key={pin.id} pin={pin} />
          ))}
        </div>
      ) : (
        <div className="px-page py-10 text-center">
          <p className="text-body">No pins yet.</p>
          <p className="mt-1 text-caption text-text-muted">
            Create your first memory pin and program an NFC sticker.
          </p>
          <Link
            href="/pin/new"
            className="mt-5 inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-accent-2 px-5 text-body font-medium text-[#0a0f1e]"
          >
            <Plus className="h-5 w-5" /> New pin
          </Link>
        </div>
      )}

      <BottomNav />
    </main>
  );
}
