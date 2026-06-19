import Link from "next/link";
import { MapPin, Upload, Smartphone } from "lucide-react";

const steps = [
  { icon: MapPin, title: "Pin", text: "Stick an NFC tag on your wall map." },
  { icon: Upload, title: "Upload", text: "Add photos & videos from anywhere." },
  { icon: Smartphone, title: "Tap", text: "Tap the sticker to relive the trip." },
];

export default function LandingPage() {
  return (
    <main className="min-h-dvh">
      {/* Hero */}
      <section className="flex min-h-[70vh] flex-col items-center justify-center px-page text-center">
        <div className="text-6xl">🌍💕</div>
        <h1 className="mt-6 text-display">Your travels, alive on your wall</h1>
        <p className="mt-3 max-w-sm text-body text-text-muted">
          Pin memories to real places. Tap an NFC sticker to open the photos,
          videos, and story from that trip.
        </p>
        <Link
          href="/login"
          className="mt-8 flex min-h-[48px] items-center justify-center rounded-xl bg-accent px-8 text-body font-medium text-[#0a0f1e]"
        >
          Get started
        </Link>
      </section>

      {/* Steps */}
      <section className="px-page pb-16">
        <div className="mx-auto grid max-w-md gap-4">
          {steps.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-5"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-accent">
                <Icon className="h-6 w-6" />
              </span>
              <div>
                <p className="text-body font-medium">{title}</p>
                <p className="text-caption text-text-muted">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
