"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

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
          text: "Let's share our travel memories 💕",
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
      <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-2 p-2">
        <code className="flex-1 truncate px-1 text-caption text-text-primary">
          {url}
        </code>
        <button
          onClick={copy}
          aria-label="Copy invite link"
          className="flex h-9 w-9 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-text-muted hover:text-text-primary"
        >
          {copied ? (
            <Check className="h-4 w-4 text-accent" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
      </div>
      <button
        onClick={share}
        className="min-h-[44px] w-full rounded-xl bg-accent px-4 text-body font-medium text-[#0a0f1e]"
      >
        Share invite
      </button>
    </div>
  );
}
