"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, Nfc, AppWindow } from "lucide-react";

type Status = "idle" | "writing" | "done" | "error";

// Free "NFC Tools" app on the App Store.
const NFC_TOOLS_IOS = "https://apps.apple.com/app/nfc-tools/id1252962749";

/**
 * Writes the pin URL straight to an NFC tag using the Web NFC API.
 * Supported in Chrome on Android only — elsewhere we show a hint and rely on
 * the QR code / NFC Tools fallback rendered alongside this component.
 */
export function NfcWriter({ url }: { url: string }) {
  const [supported, setSupported] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "NDEFReader" in window);
    setIsIOS(/iP(hone|ad|od)/.test(navigator.userAgent));
  }, []);

  async function write() {
    setError(null);
    setStatus("writing");
    try {
      const ndef = new NDEFReader();
      await ndef.write({ records: [{ recordType: "url", data: url }] });
      setStatus("done");
    } catch (e) {
      setStatus("error");
      const name = e instanceof Error ? e.name : "";
      setError(
        name === "NotAllowedError"
          ? "NFC permission denied — enable NFC and allow it, then try again."
          : name === "NotSupportedError"
            ? "No NFC hardware available on this device."
            : name === "AbortError"
              ? "Timed out — hold the sticker to your phone while writing."
              : e instanceof Error
                ? e.message
                : "Couldn't write to the tag.",
      );
    }
  }

  if (!supported && isIOS) {
    return (
      <div className="rounded-card border border-border bg-surface p-4">
        <p className="mb-3 flex items-center gap-2 text-caption text-muted">
          <Nfc className="h-4 w-4 shrink-0" />
          <span>
            iPhone can&apos;t write tags from Safari. Get the free{" "}
            <span className="font-medium text-ink">NFC Tools</span> app, then
            paste the link below to write your sticker.
          </span>
        </p>
        <a
          href={NFC_TOOLS_IOS}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-ctl bg-ink text-body font-medium text-white transition-colors hover:bg-ink/85"
        >
          <AppWindow className="h-5 w-5" /> Get NFC Tools on the App Store
        </a>
      </div>
    );
  }

  if (!supported) {
    return (
      <div className="rounded-card border border-border bg-surface p-4">
        <p className="flex items-center gap-2 text-caption text-muted">
          <Nfc className="h-4 w-4 shrink-0" />
          <span>
            <span className="font-medium text-ink">Tap-to-write</span> works in
            Chrome on Android. Here, use the QR code or NFC Tools steps below.
          </span>
        </p>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={write}
        disabled={status === "writing"}
        className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-ctl bg-accent text-body font-medium text-white transition-colors hover:bg-accent-strong disabled:opacity-60"
      >
        {status === "writing" ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" /> Hold the sticker to your
            phone…
          </>
        ) : status === "done" ? (
          <>
            <Check className="h-5 w-5" /> Written — tap to test
          </>
        ) : (
          <>
            <Nfc className="h-5 w-5" /> Write to sticker
          </>
        )}
      </button>
      {status === "done" && (
        <p className="mt-2 text-caption text-muted">
          Tag programmed. Tap it with any phone to open this memory.
        </p>
      )}
      {error && <p className="mt-2 text-caption text-accent">{error}</p>}
    </div>
  );
}
