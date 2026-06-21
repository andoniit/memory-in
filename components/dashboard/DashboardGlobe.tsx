"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Drawer } from "vaul";
import { ArrowUpRight, X } from "lucide-react";
import { GlobeSkeleton } from "@/components/globe/GlobeSkeleton";
import type { GlobePin } from "@/components/globe/InteractiveGlobe";

export interface DashPin extends GlobePin {
  title: string;
  city: string | null;
  thumb_url: string | null;
  memory_count: number;
}

const InteractiveGlobe = dynamic(
  () => import("@/components/globe/InteractiveGlobe"),
  { ssr: false, loading: () => <GlobeSkeleton /> },
);

export function DashboardGlobe({ pins }: { pins: DashPin[] }) {
  const params = useSearchParams();
  const [selected, setSelected] = useState<DashPin | null>(null);
  const [highlight, setHighlight] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  // Open the panel when arriving via the Memories nav link (?view=memories).
  useEffect(() => {
    if (params.get("view") === "memories") setPanelOpen(true);
  }, [params]);

  return (
    <div className="absolute inset-0">
      <InteractiveGlobe
        pins={pins}
        highlightId={highlight}
        onPinTap={(id) => setSelected(pins.find((p) => p.id === id) ?? null)}
      />

      {/* Tap-a-point preview */}
      <Drawer.Root
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-30 bg-black/30" />
          <Drawer.Content className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md rounded-t-2xl border border-border bg-surface pb-safe outline-none">
            <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-border" />
            {selected && (
              <div className="p-page">
                <Drawer.Title className="sr-only">{selected.title}</Drawer.Title>
                <div className="flex items-center gap-4">
                  <Thumb pin={selected} className="h-16 w-16" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-heading">{selected.title}</p>
                    <p className="label mt-1">{metaLine(selected)}</p>
                  </div>
                </div>
                <Link
                  href={`/p/${selected.id}`}
                  className="mt-5 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-ctl bg-accent text-body font-medium text-white transition-colors hover:bg-accent-strong"
                >
                  Open <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* Memories — sliding glass side panel */}
      {panelOpen && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setPanelOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 right-0 z-40 flex w-full max-w-sm flex-col border-l border-white/50 bg-white/65 shadow-2xl backdrop-blur-xl transition-transform duration-300 ${
          panelOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!panelOpen}
      >
        <div className="flex items-center justify-between px-page pb-3 pt-safe">
          <div className="pt-4">
            <span className="index-num">MEMORIES</span>
            <p className="text-heading">
              {pins.length} {pins.length === 1 ? "pin" : "pins"}
            </p>
          </div>
          <button
            onClick={() => setPanelOpen(false)}
            aria-label="Close"
            className="mt-4 flex h-10 w-10 items-center justify-center rounded-full text-muted hover:bg-black/5 hover:text-ink"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-safe">
          {pins.length === 0 ? (
            <p className="px-2 py-6 text-caption text-muted">
              No memories yet. Tap + to create your first pin.
            </p>
          ) : (
            <ul className="space-y-1">
              {pins.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/p/${p.id}`}
                    onMouseEnter={() => setHighlight(p.id)}
                    onMouseLeave={() => setHighlight(null)}
                    onFocus={() => setHighlight(p.id)}
                    onBlur={() => setHighlight(null)}
                    className="flex items-center gap-3 rounded-ctl p-2 transition-colors hover:bg-white/70"
                  >
                    <Thumb pin={p} className="h-12 w-12" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-body font-medium">{p.title}</p>
                      <p className="label mt-0.5 truncate">{metaLine(p)}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}

function metaLine(p: DashPin) {
  const count = `${p.memory_count} ${p.memory_count === 1 ? "memory" : "memories"}`;
  return p.city ? `${p.city} · ${count}` : count;
}

function Thumb({ pin, className }: { pin: DashPin; className: string }) {
  return (
    <div
      className={`shrink-0 overflow-hidden rounded-card border border-border bg-surface-2 ${className}`}
    >
      {pin.thumb_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={pin.thumb_url} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-xl opacity-40">
          {pin.emoji}
        </span>
      )}
    </div>
  );
}
