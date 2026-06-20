import Link from "next/link";
import { LandingGlobe } from "@/components/LandingGlobe";

const steps = [
  { n: "01", title: "Tag", text: "Stick an NFC tag on anything — a book, a wall, a painting, a fridge magnet." },
  { n: "02", title: "Attach", text: "Add photos, videos, and notes to it." },
  { n: "03", title: "Scan", text: "Tap the tag to relive the memory." },
];

export default function LandingPage() {
  return (
    <main className="min-h-dvh">
      {/* Dark hero with the live globe */}
      <section
        className="relative flex h-[90vh] flex-col overflow-hidden text-white"
        style={{
          background:
            "radial-gradient(circle at 50% 40%, #0a0e15 0%, #05070a 60%, #000000 100%)",
        }}
      >
        <header className="relative z-10 flex items-center justify-between px-page py-5">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-accent" />
            <span className="font-mono text-micro uppercase tracking-[0.2em]">
              MemoryPin
            </span>
          </div>
          <Link
            href="/login"
            className="font-mono text-micro uppercase tracking-[0.14em] text-white/60 hover:text-white"
          >
            Sign in
          </Link>
        </header>

        {/* Globe fills the hero (draggable in the open area) */}
        <div className="absolute inset-0 top-10">
          <LandingGlobe />
        </div>

        {/* Bottom scrim + copy */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black via-black/70 to-transparent px-page pb-9 pt-24">
          <span className="font-mono text-micro uppercase tracking-[0.14em] text-accent">
            01 — MEMORY TAGS
          </span>
          <h1 className="mt-3 max-w-[16ch] text-display text-balance">
            Attach a memory to anything.
          </h1>
          <p className="mt-3 max-w-sm text-body text-white/70">
            Tag a book, a wall, a painting, a fridge magnet — anything. Scan the
            NFC sticker to relive the moment. No app, no login.
          </p>
          <Link
            href="/login"
            className="pointer-events-auto mt-6 inline-flex min-h-[48px] items-center justify-center rounded-ctl bg-accent px-7 text-body font-medium text-white transition-colors hover:bg-accent-strong"
          >
            Get started
          </Link>
        </div>
      </section>

      {/* Steps */}
      <section className="border-t border-border">
        {steps.map(({ n, title, text }) => (
          <div
            key={n}
            className="flex items-baseline gap-5 border-b border-border px-page py-6"
          >
            <span className="index-num pt-1">{n}</span>
            <div>
              <p className="text-heading">{title}</p>
              <p className="mt-1 text-body text-muted">{text}</p>
            </div>
          </div>
        ))}
      </section>

      <footer className="px-page py-8">
        <p className="label">One tap. Every memory, right where you left it.</p>
      </footer>
    </main>
  );
}
