"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Drawer } from "vaul";
import { ArrowUpRight } from "lucide-react";
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
  const [selected, setSelected] = useState<DashPin | null>(null);

  return (
    <div className="absolute inset-0">
      <InteractiveGlobe
        pins={pins}
        onPinTap={(id) => setSelected(pins.find((p) => p.id === id) ?? null)}
      />

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
                      {selected.title}
                    </p>
                    <p className="label mt-1">
                      {selected.city ? `${selected.city} · ` : ""}
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
    </div>
  );
}
