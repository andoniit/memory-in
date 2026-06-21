"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Loader2, Star, Trash2 } from "lucide-react";
import type { Memory, Pin } from "@/types/index";
import { InviteLink } from "@/components/InviteLink";
import { btnPrimary, field, iconBtnGhost } from "@/lib/ui";

const EMOJI = ["📍", "🏖️", "🗼", "⛰️", "🌴", "🏙️", "🌅", "🍷", "✈️", "🏛️"];

export function PinManager({
  pin,
  url,
  memories: initialMemories,
}: {
  pin: Pin;
  url: string;
  memories: Memory[];
}) {
  const router = useRouter();
  const [memories, setMemories] = useState(initialMemories);
  const [coverId, setCoverId] = useState<string | null>(pin.cover_memory_id);
  const [title, setTitle] = useState(pin.title);
  const [city, setCity] = useState(pin.city ?? "");
  const [emoji, setEmoji] = useState(pin.emoji);
  const [visitDate, setVisitDate] = useState(pin.visit_date ?? "");
  const [isPublic, setIsPublic] = useState(pin.is_public);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    setMsg(null);
    try {
      const res = await fetch(`/api/pins/${pin.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          city: city || null,
          emoji,
          visit_date: visitDate || null,
          is_public: isPublic,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Save failed");
      setMsg("Saved");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/pins/${pin.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Delete failed");
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setDeleting(false);
    }
  }

  async function deleteMemory(id: string) {
    const res = await fetch(`/api/memories/${id}`, { method: "DELETE" });
    if (res.ok) {
      setMemories((m) => m.filter((x) => x.id !== id));
      if (coverId === id) setCoverId(null);
      router.refresh();
    }
  }

  async function setCover(id: string) {
    setCoverId(id);
    await fetch(`/api/pins/${pin.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cover_memory_id: id }),
    });
    router.refresh();
  }

  const media = memories.filter((m) => m.type !== "note");
  const notes = memories.filter((m) => m.type === "note");

  return (
    <main className="mx-auto max-w-md px-page py-5">
      <header className="mb-7 flex items-center gap-1">
        <Link href={`/p/${pin.id}`} aria-label="Back" className={iconBtnGhost}>
          <ChevronLeft className="h-6 w-6" strokeWidth={1.75} />
        </Link>
        <div>
          <span className="index-num">MANAGE</span>
          <h1 className="text-heading">{pin.title}</h1>
        </div>
      </header>

      {/* Edit */}
      <section className="space-y-5">
        <div>
          <label className="label mb-2 block">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={field}
          />
        </div>
        <div>
          <label className="label mb-2 block">City</label>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className={field}
          />
        </div>
        <div>
          <label className="label mb-2 block">Visit date</label>
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
          <span className="text-body">Public — tap works without login</span>
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="h-5 w-5 accent-[#f25623]"
          />
        </label>

        {msg && <p className="text-caption text-accent">{msg}</p>}
        {error && <p className="text-caption text-accent">{error}</p>}

        <button onClick={save} disabled={saving} className={`${btnPrimary} w-full`}>
          {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save changes"}
        </button>
      </section>

      {/* Photos & videos */}
      <section className="mt-10">
        <div className="mb-3 flex items-center justify-between">
          <p className="label">Photos &amp; videos</p>
          <Link
            href={`/p/${pin.id}/upload`}
            className="font-mono text-micro uppercase tracking-[0.12em] text-accent"
          >
            + Add
          </Link>
        </div>

        {media.length === 0 ? (
          <p className="text-caption text-muted">No photos yet.</p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {media.map((m) => {
              const isCover = coverId === m.id;
              return (
                <div
                  key={m.id}
                  className="relative aspect-square overflow-hidden rounded-ctl border border-border bg-surface-2"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={m.thumb_url ?? ""}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  {isCover && (
                    <span className="absolute left-1 top-1 rounded-full bg-accent px-1.5 py-0.5 text-[0.6rem] font-medium text-white">
                      Cover
                    </span>
                  )}
                  <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-gradient-to-t from-black/60 to-transparent p-1">
                    <button
                      onClick={() => setCover(m.id)}
                      aria-label="Set as cover"
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-ink"
                    >
                      <Star
                        className={`h-3.5 w-3.5 ${isCover ? "fill-accent text-accent" : ""}`}
                      />
                    </button>
                    <button
                      onClick={() => deleteMemory(m.id)}
                      aria-label="Delete"
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-accent"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {notes.length > 0 && (
          <ul className="mt-3 space-y-2">
            {notes.map((n) => (
              <li
                key={n.id}
                className="flex items-start justify-between gap-3 rounded-ctl border border-border bg-surface p-3"
              >
                <p className="text-caption text-ink">{n.caption}</p>
                <button
                  onClick={() => deleteMemory(n.id)}
                  aria-label="Delete note"
                  className="shrink-0 text-muted hover:text-accent"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* NFC */}
      <section className="mt-10">
        <p className="label mb-3">NFC sticker URL</p>
        <InviteLink url={url} />
      </section>

      {/* Danger zone */}
      <section className="mt-10 border-t border-border pt-6">
        <p className="label mb-3">Danger zone</p>
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-ctl border border-accent/40 text-body font-medium text-accent"
          >
            <Trash2 className="h-4 w-4" /> Delete pin
          </button>
        ) : (
          <div className="rounded-card border border-accent/40 bg-surface p-4">
            <p className="text-body">
              Delete this pin and all its memories? This can&apos;t be undone.
            </p>
            <div className="mt-4 flex gap-3">
              <button
                onClick={remove}
                disabled={deleting}
                className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-ctl bg-accent text-body font-medium text-white"
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Delete"
                )}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="min-h-[44px] flex-1 rounded-ctl border border-border text-body"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
