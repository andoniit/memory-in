"use client";

import { useState } from "react";
import { Play, X } from "lucide-react";
import type { Memory } from "@/types/index";
import { fullUrl, videoUrl } from "@/lib/cloudinary";

/**
 * 3-column square photo grid with a lightweight tap-to-expand lightbox.
 * Swipe navigation + Framer Motion polish lands in Phase 3.
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
              className="rounded-xl border border-border bg-surface p-3 text-body text-text-primary"
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
            <img
              src={m.thumb_url ?? ""}
              alt={m.caption ?? ""}
              loading="lazy"
            />
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
          memory={media[active]}
          onClose={() => setActive(null)}
        />
      )}
    </>
  );
}

function Lightbox({
  memory,
  onClose,
}: {
  memory: Memory;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-[calc(env(safe-area-inset-top)+1rem)] flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white"
      >
        <X className="h-5 w-5" />
      </button>

      {memory.type === "video" ? (
        <video
          src={memory.cloudinary_id ? videoUrl(memory.cloudinary_id) : ""}
          controls
          autoPlay
          playsInline
          className="max-h-full max-w-full rounded-lg"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={memory.cloudinary_id ? fullUrl(memory.cloudinary_id) : (memory.url ?? "")}
          alt={memory.caption ?? ""}
          className="max-h-full max-w-full rounded-lg"
          onClick={(e) => e.stopPropagation()}
        />
      )}
    </div>
  );
}
