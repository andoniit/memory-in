"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";

export function StorySection({
  pinId,
  initialStory,
  canGenerate,
}: {
  pinId: string;
  initialStory: string | null;
  canGenerate: boolean;
}) {
  const [story, setStory] = useState(initialStory);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin_id: pinId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not generate story");
      setStory(data.story);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  // Nothing to show and the viewer can't generate → render nothing.
  if (!story && !canGenerate) return null;

  return (
    <section className="border-b border-border px-page py-6">
      <div className="mb-3 flex items-center justify-between">
        <p className="label">Story</p>
        {canGenerate && (
          <button
            onClick={generate}
            disabled={busy}
            className="flex items-center gap-1.5 font-mono text-micro uppercase tracking-[0.12em] text-accent disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {story ? "Regenerate" : "Generate"}
          </button>
        )}
      </div>

      {story ? (
        <p className="text-body leading-relaxed">{story}</p>
      ) : (
        <p className="text-body text-muted">
          Generate an AI travel story from your photos and captions.
        </p>
      )}

      {error && <p className="mt-2 text-caption text-accent">{error}</p>}
    </section>
  );
}
