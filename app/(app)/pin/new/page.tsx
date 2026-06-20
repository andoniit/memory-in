"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Loader2, MapPin, Check } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { InviteLink } from "@/components/InviteLink";
import { btnPrimary, btnSecondary, field, iconBtnGhost } from "@/lib/ui";
import type { GeocodeResult } from "@/app/api/geocode/route";

const EMOJI = ["📍", "🏖️", "🗼", "⛰️", "🌴", "🏙️", "🌅", "🍷", "✈️", "🏛️"];

export default function NewPinPage() {
  const [title, setTitle] = useState("");
  const [query, setQuery] = useState("");
  const [place, setPlace] = useState<GeocodeResult | null>(null);
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [emoji, setEmoji] = useState("📍");
  const [visitDate, setVisitDate] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ id: string; url: string } | null>(
    null,
  );

  // Debounced geocoding.
  const debounce = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    if (place && query === place.name.split(",")[0]) return;
    clearTimeout(debounce.current);
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    debounce.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results ?? []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 450);
    return () => clearTimeout(debounce.current);
  }, [query, place]);

  function selectPlace(r: GeocodeResult) {
    setPlace(r);
    setQuery(r.name.split(",")[0]);
    setResults([]);
  }

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
          city: place?.name.split(",").slice(0, 2).join(",").trim() ?? query,
          lat: place?.lat,
          lng: place?.lng,
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
      <main className="mx-auto max-w-md px-page py-5">
        <span className="index-num">05 — PROGRAM TAG</span>
        <h1 className="mt-2 text-display">Pin created</h1>
        <p className="mt-3 text-body text-muted">
          Write this URL to your NFC sticker with the free{" "}
          <span className="text-ink">NFC Tools</span> app (Write → URL/URI),
          then stick it on the object.
        </p>

        <div className="mt-6 flex justify-center">
          <div className="rounded-card border border-border bg-white p-4">
            <QRCodeSVG value={created.url} size={160} fgColor="#171717" />
          </div>
        </div>
        <p className="mt-3 text-center text-caption text-muted">
          Or scan this QR to open the pin.
        </p>

        <div className="mt-5">
          <InviteLink url={created.url} />
        </div>

        <ol className="mt-7 space-y-3 border-t border-border pt-5">
          {[
            "Open NFC Tools → Write → Add a record → URL/URI",
            "Paste the URL above",
            "Tap Write, then hold your phone to the sticker",
            "Stick it on the object — matte surface, not behind glass — and tap to test",
          ].map((step, i) => (
            <li key={i} className="flex gap-4">
              <span className="index-num pt-0.5">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-body text-muted">{step}</span>
            </li>
          ))}
        </ol>

        <div className="mt-8 flex gap-3">
          <Link href={`/p/${created.id}/upload`} className={`${btnPrimary} flex-1`}>
            Add photos
          </Link>
          <Link href="/dashboard" className={`${btnSecondary} flex-1`}>
            Done
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-page py-5">
      <header className="mb-7 flex items-center gap-1">
        <Link href="/dashboard" aria-label="Back" className={iconBtnGhost}>
          <ChevronLeft className="h-6 w-6" strokeWidth={1.75} />
        </Link>
        <div>
          <span className="index-num">NEW</span>
          <h1 className="text-heading">Memory pin</h1>
        </div>
      </header>

      <form onSubmit={handleCreate} className="space-y-6">
        <div>
          <label className="label mb-2 block">Title</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Grandma's recipe book"
            className={field}
          />
        </div>

        {/* Optional place search */}
        <div>
          <label className="label mb-2 block">Place (optional)</label>
          <p className="mb-2 text-caption text-muted">
            Add a place to show it on your globe — or skip it for an object like
            a book or fridge magnet.
          </p>
          <div className="relative">
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPlace(null);
              }}
              placeholder="Search a city…"
              className={field}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted">
              {searching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : place ? (
                <Check className="h-4 w-4 text-accent" />
              ) : (
                <MapPin className="h-4 w-4" />
              )}
            </span>
          </div>
          {results.length > 0 && (
            <ul className="mt-2 overflow-hidden rounded-ctl border border-border bg-surface">
              {results.map((r, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => selectPlace(r)}
                    className="block w-full border-b border-border px-4 py-3 text-left text-caption text-muted last:border-0 hover:bg-surface-2 hover:text-ink"
                  >
                    {r.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {place && (
            <p className="mt-2 font-mono text-micro tabular-nums text-muted">
              {place.lat.toFixed(3)}, {place.lng.toFixed(3)}
            </p>
          )}
        </div>

        <div>
          <label className="label mb-2 block">Date (optional)</label>
          <input
            type="date"
            value={visitDate}
            onChange={(e) => setVisitDate(e.target.value)}
            className={field}
          />
        </div>

        <div>
          <label className="label mb-2 block">Marker</label>
          <div className="flex flex-wrap gap-2">
            {EMOJI.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEmoji(e)}
                className={`flex h-11 w-11 items-center justify-center rounded-ctl border text-xl transition-colors ${
                  emoji === e
                    ? "border-accent bg-surface-2"
                    : "border-border bg-surface hover:border-ink/25"
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center justify-between rounded-ctl border border-border bg-surface px-4 py-3">
          <span className="text-body">Public — NFC tap works without login</span>
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="h-5 w-5 accent-[#f25623]"
          />
        </label>

        {error && <p className="text-caption text-accent">{error}</p>}

        <button disabled={busy} className={`${btnPrimary} w-full`}>
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : "Create pin"}
        </button>
      </form>
    </main>
  );
}
