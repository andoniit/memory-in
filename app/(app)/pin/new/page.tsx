"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Loader2 } from "lucide-react";
import { InviteLink } from "@/components/InviteLink";

const EMOJI = ["📍", "💕", "🏖️", "🗼", "⛰️", "🌴", "🏙️", "🌅", "🍷", "✈️"];

export default function NewPinPage() {
  const [title, setTitle] = useState("");
  const [city, setCity] = useState("");
  const [emoji, setEmoji] = useState("📍");
  const [visitDate, setVisitDate] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ id: string; url: string } | null>(
    null,
  );

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/pins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          city,
          emoji,
          visit_date: visitDate || undefined,
          is_public: isPublic,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create pin");
      setCreated(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  if (created) {
    return (
      <main className="mx-auto max-w-md px-page py-6">
        <h1 className="text-heading">Program your sticker 🏷️</h1>
        <p className="mt-2 text-caption text-text-muted">
          Write this URL to your NFC sticker using the free{" "}
          <span className="font-medium text-text-primary">NFC Tools</span> app
          (Write → URL/URI), then stick it on your map.
        </p>

        <div className="mt-4">
          <InviteLink url={created.url} />
        </div>

        <ol className="mt-6 space-y-2 text-caption text-text-muted">
          <li>1. Open NFC Tools → Write → Add a record → URL/URI</li>
          <li>2. Paste the URL above</li>
          <li>3. Tap Write, then hold your phone to the sticker</li>
          <li>4. Stick it on a matte (non-glass) map and tap to test</li>
        </ol>

        <div className="mt-8 flex gap-3">
          <Link
            href={`/p/${created.id}/upload`}
            className="flex min-h-[48px] flex-1 items-center justify-center rounded-xl bg-accent-2 text-body font-medium text-[#0a0f1e]"
          >
            Add photos
          </Link>
          <Link
            href="/dashboard"
            className="flex min-h-[48px] flex-1 items-center justify-center rounded-xl border border-border text-body"
          >
            Done
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-page py-4">
      <header className="mb-5 flex items-center gap-2">
        <Link
          href="/dashboard"
          aria-label="Back"
          className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full"
        >
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-heading">New memory pin</h1>
      </header>

      <form onSubmit={handleCreate} className="space-y-4">
        <div>
          <label className="mb-1 block text-caption text-text-muted">
            Title
          </label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Our Paris trip"
            className="min-h-[44px] w-full rounded-xl border border-border bg-surface-2 px-4 text-body outline-none focus:border-accent"
          />
        </div>

        <div>
          <label className="mb-1 block text-caption text-text-muted">
            City
          </label>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Paris, France"
            className="min-h-[44px] w-full rounded-xl border border-border bg-surface-2 px-4 text-body outline-none focus:border-accent"
          />
        </div>

        <div>
          <label className="mb-1 block text-caption text-text-muted">
            Visit date
          </label>
          <input
            type="date"
            value={visitDate}
            onChange={(e) => setVisitDate(e.target.value)}
            className="min-h-[44px] w-full rounded-xl border border-border bg-surface-2 px-4 text-body outline-none focus:border-accent"
          />
        </div>

        <div>
          <label className="mb-1 block text-caption text-text-muted">
            Emoji
          </label>
          <div className="flex flex-wrap gap-2">
            {EMOJI.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEmoji(e)}
                className={`flex h-11 w-11 items-center justify-center rounded-xl border text-xl ${
                  emoji === e
                    ? "border-accent bg-surface-2"
                    : "border-border bg-surface"
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3">
          <span className="text-body">Public (NFC tap works without login)</span>
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="h-5 w-5 accent-[#6c8eff]"
          />
        </label>

        {error && <p className="text-caption text-accent-2">{error}</p>}

        <button
          disabled={busy}
          className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-accent text-body font-medium text-[#0a0f1e] disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : "Create pin"}
        </button>
      </form>
    </main>
  );
}
