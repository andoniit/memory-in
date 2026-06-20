import Link from "next/link";
import { btnPrimary } from "@/lib/ui";

const steps = [
  {
    n: "01",
    title: "Tag",
    text: "Stick an NFC tag on anything — a book, a wall, a painting, a fridge magnet.",
  },
  { n: "02", title: "Attach", text: "Add photos, videos, and notes to it." },
  { n: "03", title: "Scan", text: "Tap the tag to relive the memory." },
];

export default function LandingPage() {
  return (
    <main className="min-h-dvh">
      {/* Top bar */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-page py-5">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-accent" />
          <span className="font-mono text-micro uppercase tracking-[0.2em]">
            MemoryPin
          </span>
        </div>
        <Link href="/login" className="label hover:text-ink">
          Sign in
        </Link>
      </header>

      {/* Hero — content overlays the shared rotating globe from the root layout */}
      <section className="relative px-page pt-4">
        <div className="relative mx-auto flex min-h-[64vh] max-w-5xl flex-col justify-end pb-10 md:min-h-[78vh] md:items-center md:justify-center md:pb-16 md:text-center">
          <span className="index-num">01 — MEMORY TAGS</span>
          <h1 className="mt-3 max-w-[16ch] text-display text-balance md:text-[3.25rem] md:leading-[1.05]">
            Attach a memory to anything.
          </h1>
          <p className="mt-4 max-w-sm text-body text-muted">
            Tag a book, a wall, a painting, a fridge magnet — anything. Scan the
            NFC sticker to relive the moment. No app, no login.
          </p>
          <div className="mt-7">
            <Link href="/login" className={btnPrimary}>
              Get started
            </Link>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="border-t border-border">
        <div className="mx-auto grid max-w-5xl md:grid-cols-3">
          {steps.map(({ n, title, text }) => (
            <div
              key={n}
              className="flex items-baseline gap-5 border-b border-border px-page py-6 md:flex-col md:gap-3 md:border-b-0 md:border-r md:last:border-r-0"
            >
              <span className="index-num pt-1">{n}</span>
              <div>
                <p className="text-heading">{title}</p>
                <p className="mt-1 text-body text-muted">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="mx-auto max-w-5xl px-page py-8">
        <p className="label">One tap. Every memory, right where you left it.</p>
      </footer>
    </main>
  );
}
