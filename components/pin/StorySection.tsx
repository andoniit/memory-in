"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Sparkles } from "lucide-react";

/**
 * The pin's story — written by the member, with AI as an optional "make it
 * poetic" assistant on their own draft. Non-members see the saved story
 * read-only (or nothing if empty).
 */
export function StorySection({
  pinId,
  initialStory,
  canEdit,
}: {
  pinId: string;
  initialStory: string | null;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [text, setText] = useState(initialStory ?? "");
  const [polishing, setPolishing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function polish() {
    if (!text.trim()) {
      setError("Write a few words first, then let AI polish them.");
      return;
    }
    setPolishing(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin_id: pinId, draft: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "AI request failed");
      setText(data.story);
      setSaved(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setPolishing(false);
    }
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/pins/${pinId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ story: text.trim() || null }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Save failed");
      setSaved(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  // Read-only for visitors.
  if (!canEdit) {
    if (!initialStory) return null;
    return (
      <section className="border-b border-border px-page py-6">
        <p className="label mb-3">Story</p>
        <p className="text-body leading-relaxed">{initialStory}</p>
      </section>
    );
  }

  const dirty = text !== (initialStory ?? "");

  return (
    <section className="border-b border-border px-page py-6">
      <div className="mb-3 flex items-center justify-between">
        <p className="label">Story</p>
        <button
          onClick={polish}
          disabled={polishing || saving}
          className="flex items-center gap-1.5 font-mono text-micro uppercase tracking-[0.12em] text-accent disabled:opacity-50"
        >
          {polishing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          Make it poetic
        </button>
      </div>

      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setSaved(false);
        }}
        rows={4}
        placeholder="Write your story… then tap “Make it poetic” for an AI rewrite you can edit."
        className="w-full rounded-ctl border border-border bg-surface p-3 text-body leading-relaxed text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-accent"
      />

      {error && <p className="mt-2 text-caption text-accent">{error}</p>}

      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving || polishing || !dirty}
          className="flex min-h-[44px] items-center justify-center gap-2 rounded-ctl bg-accent px-5 text-body font-medium text-white transition-colors hover:bg-accent-strong disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save story"}
        </button>
        {saved && !dirty && (
          <span className="flex items-center gap-1 text-caption text-muted">
            <Check className="h-4 w-4 text-accent" /> Saved
          </span>
        )}
      </div>
    </section>
  );
}
