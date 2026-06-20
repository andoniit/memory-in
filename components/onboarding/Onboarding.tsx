"use client";

import { useRef, useState, useTransition } from "react";
import { Camera, Loader2, Plus, Users } from "lucide-react";
import { finishOnboarding } from "@/app/(app)/onboarding/actions";
import { thumbUrl } from "@/lib/cloudinary";
import { btnPrimary, field } from "@/lib/ui";

export function Onboarding({
  defaultName,
  defaultAvatar,
}: {
  defaultName: string;
  defaultAvatar: string | null;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState(defaultName);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(defaultAvatar);
  const [uploading, setUploading] = useState(false);
  const [mode, setMode] = useState<"create" | "join">("create");
  const [spaceName, setSpaceName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  async function uploadAvatar(file: File) {
    setUploading(true);
    setError(null);
    try {
      const res = await fetch("/api/upload-url");
      const params = await res.json();
      if (!res.ok) throw new Error(params.error ?? "Upload failed");
      const form = new FormData();
      form.append("file", file);
      form.append("api_key", params.api_key);
      form.append("timestamp", String(params.timestamp));
      form.append("signature", params.signature);
      form.append("folder", params.folder);
      const up = await fetch(params.upload_url, { method: "POST", body: form });
      const data = await up.json();
      if (!up.ok) throw new Error("Upload failed");
      setAvatarUrl(thumbUrl(data.public_id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not upload photo");
    } finally {
      setUploading(false);
    }
  }

  function next() {
    setError(null);
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    setStep(2);
  }

  function finish() {
    setError(null);
    startTransition(async () => {
      const result = await finishOnboarding({
        name,
        avatarUrl,
        mode,
        spaceName,
        code,
      });
      if (result?.error) setError(result.error);
    });
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-page py-10">
      <span className="index-num">
        {step === 1 ? "01 — YOU" : "02 — YOUR ORBIT"}
      </span>

      {step === 1 ? (
        <>
          <h1 className="mt-3 text-display">Welcome</h1>
          <p className="mt-2 text-body text-muted">
            A couple of details and you&apos;re in.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="relative h-24 w-24 overflow-hidden rounded-full border border-border bg-surface-2"
              aria-label="Add profile photo"
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-muted">
                  <Camera className="h-7 w-7" strokeWidth={1.5} />
                </span>
              )}
              {uploading && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                </span>
              )}
            </button>
            <span className="label">Profile photo</span>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadAvatar(f);
              }}
            />
          </div>

          <div className="mt-6">
            <label className="label mb-2 block">Your name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className={field}
            />
          </div>

          {error && <p className="mt-4 text-caption text-accent">{error}</p>}

          <button onClick={next} className={`${btnPrimary} mt-8 w-full`}>
            Continue
          </button>
        </>
      ) : (
        <>
          <h1 className="mt-3 text-display">Your Orbit</h1>
          <p className="mt-2 text-body text-muted">
            An Orbit is your shared memory space — keep it solo, or invite a
            partner or friends (up to 4).
          </p>

          {/* Mode toggle */}
          <div className="mt-6 grid grid-cols-2 gap-1 rounded-ctl border border-border bg-surface p-1">
            {(
              [
                ["create", "Create", Plus],
                ["join", "Join", Users],
              ] as const
            ).map(([m, labelText, Icon]) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex min-h-[40px] items-center justify-center gap-2 rounded-md text-caption transition-colors ${
                  mode === m ? "bg-accent text-white" : "text-muted hover:text-ink"
                }`}
              >
                <Icon className="h-4 w-4" />
                {labelText}
              </button>
            ))}
          </div>

          {mode === "create" ? (
            <div className="mt-5">
              <label className="label mb-2 block">Name your Orbit</label>
              <input
                value={spaceName}
                onChange={(e) => setSpaceName(e.target.value)}
                placeholder={`${name.trim() || "My"}'s Orbit`}
                className={field}
              />
              <p className="mt-2 text-caption text-muted">
                You can invite people later from Settings.
              </p>
            </div>
          ) : (
            <div className="mt-5">
              <label className="label mb-2 block">Enter a friend&apos;s code</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                autoCapitalize="characters"
                placeholder="Enter a code"
                className={`${field} font-mono uppercase tracking-[0.14em]`}
              />
            </div>
          )}

          {error && <p className="mt-4 text-caption text-accent">{error}</p>}

          <button
            onClick={finish}
            disabled={pending || uploading}
            className={`${btnPrimary} mt-8 w-full`}
          >
            {pending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : mode === "create" ? (
              "Create my Orbit"
            ) : (
              "Join Orbit"
            )}
          </button>

          <button
            onClick={() => {
              setError(null);
              setStep(1);
            }}
            className="mt-3 text-caption text-muted hover:text-ink"
          >
            Back
          </button>
        </>
      )}
    </main>
  );
}
