"use client";

import { useRef, useState } from "react";
import Script from "next/script";
import { Loader2 } from "lucide-react";
import { btnSecondary } from "@/lib/ui";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const SCOPE = "https://www.googleapis.com/auth/photospicker.mediaitems.readonly";

type Status = "idle" | "auth" | "picking" | "importing" | "done" | "error";

/**
 * Imports photos/videos from Google Photos via the Picker API.
 * Hidden unless NEXT_PUBLIC_GOOGLE_CLIENT_ID is configured.
 */
export function GooglePhotosButton({
  pinId,
  onImported,
}: {
  pinId: string;
  onImported?: () => void;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [msg, setMsg] = useState<string | null>(null);
  const cancelled = useRef(false);

  if (!CLIENT_ID) return null;

  function getAccessToken(): Promise<string> {
    return new Promise((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const g = (window as any).google;
      if (!g?.accounts?.oauth2) {
        reject(new Error("Google sign-in isn't ready yet — try again."));
        return;
      }
      const client = g.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPE,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        callback: (resp: any) =>
          resp?.access_token
            ? resolve(resp.access_token)
            : reject(new Error("Google access was denied.")),
      });
      client.requestAccessToken();
    });
  }

  async function start() {
    setMsg(null);
    cancelled.current = false;
    try {
      setStatus("auth");
      const token = await getAccessToken();

      const res = await fetch("/api/gphotos/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: token }),
      });
      const s = await res.json();
      if (!res.ok) throw new Error(s.error ?? "Couldn't start Google Photos.");

      window.open(s.pickerUri, "_blank", "noopener,noreferrer");
      setStatus("picking");
      setMsg("Pick photos in the Google Photos tab, then return here.");

      const sessionId: string = s.id;
      let attempts = 0;
      const poll = async () => {
        if (cancelled.current) return;
        const ir = await fetch("/api/gphotos/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken: token, sessionId, pinId }),
        });
        const ij = await ir.json();
        if (!ir.ok) throw new Error(ij.error ?? "Import failed.");
        if (ij.done) {
          setStatus("done");
          setMsg(`Imported ${ij.imported} from Google Photos.`);
          onImported?.();
          return;
        }
        if (attempts++ < 60) setTimeout(poll, 3000);
        else {
          setStatus("error");
          setMsg("Timed out waiting for your selection.");
        }
      };
      setStatus("importing");
      poll();
    } catch (e) {
      setStatus("error");
      setMsg(e instanceof Error ? e.message : "Something went wrong.");
    }
  }

  const busy = status === "auth" || status === "importing";

  return (
    <>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
      <button
        type="button"
        onClick={start}
        disabled={busy}
        className={`${btnSecondary} w-full`}
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <GoogleMark />
        )}
        {status === "picking" || status === "importing"
          ? "Waiting for your picks…"
          : "Add from Google Photos"}
      </button>
      {msg && <p className="mt-2 text-caption text-muted">{msg}</p>}
    </>
  );
}

function GoogleMark() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M21.35 11.1H12v2.98h5.35c-.23 1.4-1.65 4.1-5.35 4.1a5.9 5.9 0 0 1 0-11.8c1.68 0 2.8.72 3.45 1.34l2.35-2.27C16.4 3.9 14.4 3 12 3a9 9 0 1 0 0 18c5.2 0 8.65-3.65 8.65-8.8 0-.6-.07-1.05-.3-1.1z"
      />
    </svg>
  );
}
