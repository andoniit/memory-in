"use client";

import dynamic from "next/dynamic";
import { GlobeSkeleton } from "@/components/globe/GlobeSkeleton";

const Globe = dynamic(() => import("@/components/globe/Globe"), {
  ssr: false,
  loading: () => <GlobeSkeleton />,
});

// Decorative pins so the landing globe feels alive.
const demo = [
  { id: "1", lat: 48.8566, lng: 2.3522, title: "Paris", city: "Paris", emoji: "📍" },
  { id: "2", lat: 40.7128, lng: -74.006, title: "New York", city: "New York", emoji: "📍" },
  { id: "3", lat: 35.6762, lng: 139.6503, title: "Tokyo", city: "Tokyo", emoji: "📍" },
  { id: "4", lat: -33.8688, lng: 151.2093, title: "Sydney", city: "Sydney", emoji: "📍" },
  { id: "5", lat: -22.9068, lng: -43.1729, title: "Rio", city: "Rio", emoji: "📍" },
];

export function LandingGlobe() {
  return <Globe pins={demo} />;
}
