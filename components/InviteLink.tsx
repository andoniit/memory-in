"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { btnPrimary } from "@/lib/ui";

export function InviteLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard may be unavailable (insecure context) — selection still works.
    }
  }

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join me on MemoryPin",
          text: "Let's map our travel memories.",
          url,
        });
        return;
      } catch {
        /* user cancelled */
      }
    }
    copy();
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 rounded-ctl border border-border bg-surface-2 p-1.5">
        <code className="flex-1 truncate px-2 font-mono text-caption text-ink">
          {url}
        </code>
        <button
          onClick={copy}
          aria-label="Copy link"
          className="flex h-9 w-9 items-center justify-center rounded-md text-muted hover:bg-surface hover:text-ink"
        >
          {copied ? (
            <Check className="h-4 w-4 text-accent" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
      </div>
      <button onClick={share} className={`${btnPrimary} w-full`}>
        Share invite
      </button>
    </div>
  );
}
