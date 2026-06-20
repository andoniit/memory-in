"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { iconBtnGhost } from "@/lib/ui";

/** Web Share on mobile; clipboard fallback elsewhere. Shares the current page. */
export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, text: title, url });
        return;
      } catch {
        /* cancelled */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <button onClick={share} aria-label="Share" className={iconBtnGhost}>
      {copied ? (
        <Check className="h-5 w-5 text-accent" />
      ) : (
        <Share2 className="h-5 w-5" strokeWidth={1.75} />
      )}
    </button>
  );
}
