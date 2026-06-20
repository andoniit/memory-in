import { GlobeBackground } from "@/components/globe/GlobeBackground";

// Persistent globe backdrop for all authenticated pages. Because it lives in
// the layout, it stays mounted (and keeps spinning) as you move between pages.
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <GlobeBackground />
      <div className="relative z-10">{children}</div>
    </>
  );
}
