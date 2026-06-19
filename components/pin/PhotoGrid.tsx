"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Play, X } from "lucide-react";
import type { Memory } from "@/types/index";
import { fullUrl, videoUrl } from "@/lib/cloudinary";

/**
 * 3-column square photo grid with a full-screen, swipeable lightbox.
 */
export function PhotoGrid({ memories }: { memories: Memory[] }) {
  const [active, setActive] = useState<number | null>(null);

  const media = memories.filter((m) => m.type !== "note");
  const notes = memories.filter((m) => m.type === "note");

  return (
    <>
      {notes.length > 0 && (
        <div className="space-y-2 px-page">
          {notes.map((n) => (
            <p
              key={n.id}
              className="rounded-card border border-border bg-surface p-4 text-body text-ink"
            >
              {n.caption}
            </p>
          ))}
        </div>
      )}

      <div className="photo-grid mt-2">
        {media.map((m, i) => (
          <button
            key={m.id}
            onClick={() => setActive(i)}
            className="relative"
            aria-label={m.caption ?? "Open memory"}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={m.thumb_url ?? ""} alt={m.caption ?? ""} loading="lazy" />
            {m.type === "video" && (
              <span className="absolute inset-0 flex items-center justify-center bg-black/20">
                <Play className="h-8 w-8 fill-white text-white" />
              </span>
            )}
          </button>
        ))}
      </div>

      {active !== null && media[active] && (
        <Lightbox
          media={media}
          index={active}
          setIndex={setActive}
          onClose={() => setActive(null)}
        />
      )}
    </>
  );
}

function Lightbox({
  media,
  index,
  setIndex,
  onClose,
}: {
  media: Memory[];
  index: number;
  setIndex: (i: number) => void;
  onClose: () => void;
}) {
  const touchX = useRef<number | null>(null);
  const current = media[index];

  const go = useCallback(
    (dir: number) => {
      const next = (index + dir + media.length) % media.length;
      setIndex(next);
    },
    [index, media.length, setIndex],
  );

  // Keyboard navigation + lock scroll.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [go, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/95"
      onClick={onClose}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        touchX.current = null;
      }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between p-3 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        <span className="font-mono text-micro tabular-nums text-white/70">
          {String(index + 1).padStart(2, "0")} /{" "}
          {String(media.length).padStart(2, "0")}
        </span>
        <button
          onClick={onClose}
          aria-label="Close"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Media */}
      <div className="relative flex flex-1 items-center justify-center px-2">
        {current.type === "video" ? (
          <video
            key={current.id}
            src={current.cloudinary_id ? videoUrl(current.cloudinary_id) : ""}
            controls
            autoPlay
            playsInline
            className="max-h-full max-w-full rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={current.id}
            src={
              current.cloudinary_id
                ? fullUrl(current.cloudinary_id)
                : (current.url ?? "")
            }
            alt={current.caption ?? ""}
            className="max-h-full max-w-full rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        )}

        {media.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                go(-1);
              }}
              aria-label="Previous"
              className="absolute left-2 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                go(1);
              }}
              aria-label="Next"
              className="absolute right-2 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
      </div>

      {/* Caption */}
      {current.caption && (
        <p className="px-page pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3 text-center text-caption text-white/80">
          {current.caption}
        </p>
      )}
    </div>
  );
}
