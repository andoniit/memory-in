"use client";

import dynamic from "next/dynamic";
import { OrbitMark } from "@/components/OrbitMark";

// Rotating (non-interactive) light globe. Code-split + browser-only; the static
// SVG shows while the Three.js chunk loads.
const LandingGlobeImpl = dynamic(
  () => import("@/components/globe/LandingGlobeImpl"),
  { ssr: false, loading: () => <OrbitMark className="h-full w-full" /> },
);

export function LandingGlobe() {
  return <LandingGlobeImpl />;
}
