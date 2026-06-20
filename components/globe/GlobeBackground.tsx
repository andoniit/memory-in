"use client";

import dynamic from "next/dynamic";

// The same rotating light globe used on the landing, as a fixed page backdrop.
// Lives in a shared layout so it persists (keeps spinning) across navigations.
const LandingGlobeImpl = dynamic(
  () => import("@/components/globe/LandingGlobeImpl"),
  { ssr: false },
);

export function GlobeBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 bg-background"
    >
      <div className="absolute left-1/2 top-0 h-[min(92vw,460px)] w-[min(92vw,460px)] -translate-x-1/2 md:h-[640px] md:w-[640px]">
        <LandingGlobeImpl />
      </div>
    </div>
  );
}
