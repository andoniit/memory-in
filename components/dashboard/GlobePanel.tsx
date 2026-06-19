"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Drawer } from "vaul";
import { ArrowUpRight } from "lucide-react";
import { GlobeSkeleton } from "@/components/globe/GlobeSkeleton";
import type { GlobePin } from "@/components/globe/Globe";

export interface GlobePinFull extends GlobePin {
  thumb_url: string | null;
  memory_count: number;
}

// Three.js only on the client — keeps it out of the pin page bundle.
const Globe = dynamic(() => import("@/components/globe/Globe"), {
  ssr: false,
  loading: () => <GlobeSkeleton />,
});

export function GlobePanel({ pins }: { pins: GlobePinFull[] }) {
  const [selected, setSelected] = useState<GlobePinFull | null>(null);
  const placed = pins.filter(
    (p) => p.lat != null && p.lng != null && !(p.lat === 0 && p.lng === 0),
  );

  return (
    <>
      <div id="globe" className="relative h-[44vh] w-full">
        <Globe
          pins={placed}
          onPinTap={(p) =>
            setSelected(pins.find((x) => x.id === p.id) ?? null)
          }
        />
        <span className="pointer-events-none absolute left-page top-3 label">
          {String(placed.length).padStart(2, "0")} / {String(pins.length).padStart(2, "0")} placed
        </span>
      </div>

      <Drawer.Root
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-30 bg-black/30" />
          <Drawer.Content className="fixed inset-x-0 bottom-0 z-40 rounded-t-2xl border-t border-border bg-surface pb-safe outline-none">
            <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-border" />
            {selected && (
              <div className="p-page">
                <Drawer.Title className="sr-only">
                  {selected.title}
                </Drawer.Title>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-card border border-border bg-surface-2">
                    {selected.thumb_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={selected.thumb_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-2xl opacity-40">
                        {selected.emoji}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-heading">
                      {selected.city ?? selected.title}
                    </p>
                    <p className="label mt-1">
                      {selected.memory_count}{" "}
                      {selected.memory_count === 1 ? "memory" : "memories"}
                    </p>
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
    </>
  );
}
