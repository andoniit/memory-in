import Link from "next/link";
import { OrbitMark } from "@/components/OrbitMark";
import { btnPrimary } from "@/lib/ui";

const steps = [
  { n: "01", title: "Pin", text: "Place an NFC tag on your wall map." },
  { n: "02", title: "Upload", text: "Add photos and videos from anywhere." },
  { n: "03", title: "Tap", text: "Tap the tag to open the trip." },
];

export default function LandingPage() {
  return (
    <main className="min-h-dvh">
      {/* Top bar */}
      <header className="flex items-center justify-between px-page py-5">
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

      {/* Hero */}
      <section className="relative px-page pt-6">
        <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto flex justify-center opacity-90">
          <OrbitMark className="w-[min(92vw,460px)]" />
        </div>

        <div className="relative flex min-h-[62vh] flex-col justify-end pb-10">
          <span className="index-num">01 — MEMORY MAP</span>
          <h1 className="mt-3 max-w-[14ch] text-display text-balance">
            Memories, mapped to the places you&apos;ve been.
          </h1>
          <p className="mt-4 max-w-sm text-body text-muted">
            Pin photos and videos to real locations. Tap a physical NFC sticker
            to open the trip — no app, no login.
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
        <p className="label">Satellite-simple memories — pole to pole.</p>
      </footer>
    </main>
  );
}
