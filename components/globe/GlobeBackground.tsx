"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

// One rotating light globe for the whole app. It lives in the root layout, so a
// single instance stays mounted and keeps spinning as you move between pages
// (landing → login → app). Skipped on the public NFC page to keep it fast.
const LandingGlobeImpl = dynamic(
  () => import("@/components/globe/LandingGlobeImpl"),
  { ssr: false },
);

export function GlobeBackground() {
  const pathname = usePathname();
  if (pathname?.startsWith("/p/")) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-background"
    >
      <div className="absolute left-1/2 top-0 h-[min(110vw,560px)] w-[min(110vw,560px)] -translate-x-1/2 md:h-[820px] md:w-[820px]">
        <LandingGlobeImpl />
      </div>
    </div>
  );
}
