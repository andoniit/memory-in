"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ImagePlus, Loader2, Play, X } from "lucide-react";
import { iconBtnGhost } from "@/lib/ui";
import { GooglePhotosButton } from "@/components/pin/GooglePhotosButton";

type Tab = "photo" | "video" | "note";

interface SignedParams {
  upload_url: string;
  api_key: string;
  timestamp: number;
  signature: string;
  folder: string;
}

interface CloudinaryResult {
  public_id: string;
  resource_type: "image" | "video" | string;
  width?: number;
  height?: number;
  duration?: number;
}

export function UploadForm({
  pinId,
  pinTitle,
}: {
  pinId: string;
  pinTitle: string;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<Tab>("photo");
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState("");
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Local object-URL previews for the chosen files (revoked on change/unmount).
  const previews = useMemo(
    () =>
      files.map((file) => ({
        file,
        url: URL.createObjectURL(file),
        isVideo: file.type.startsWith("video"),
      })),
    [files],
  );
  useEffect(
    () => () => previews.forEach((p) => URL.revokeObjectURL(p.url)),
    [previews],
  );

  function removeFile(index: number) {
    setFiles((fs) => fs.filter((_, i) => i !== index));
  }

  async function getSignedParams(): Promise<SignedParams> {
    const res = await fetch("/api/upload-url");
    if (!res.ok)
      throw new Error((await res.json()).error ?? "Upload setup failed");
    return res.json();
  }

  function uploadToCloudinary(
    file: File,
    params: SignedParams,
    onProgress: (pct: number) => void,
  ): Promise<CloudinaryResult> {
    return new Promise((resolve, reject) => {
      const form = new FormData();
      form.append("file", file);
      form.append("api_key", params.api_key);
      form.append("timestamp", String(params.timestamp));
      form.append("signature", params.signature);
      form.append("folder", params.folder);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", params.upload_url);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable)
          onProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          let msg = `Cloudinary upload failed (${xhr.status})`;
          try {
            const m = JSON.parse(xhr.responseText)?.error?.message;
            if (m) msg = m;
          } catch {
            /* non-JSON response */
          }
          reject(new Error(msg));
        }
      };
      xhr.onerror = () => reject(new Error("Network error during upload"));
      xhr.send(form);
    });
  }

  async function saveMemory(body: Record<string, unknown>) {
    const res = await fetch("/api/memories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok)
      throw new Error((await res.json()).error ?? "Could not save memory");
  }

  async function handleSubmit() {
    setError(null);
    setBusy(true);
    try {
      if (tab === "note") {
        if (!caption.trim()) throw new Error("Write something first.");
        await saveMemory({ pin_id: pinId, type: "note", caption: caption.trim() });
      } else {
        if (files.length === 0) throw new Error("Choose a file first.");
        const params = await getSignedParams();
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const result = await uploadToCloudinary(file, params, (pct) => {
            setProgress(Math.round(((i + pct / 100) / files.length) * 100));
          });
          const type = result.resource_type === "video" ? "video" : "photo";
          await saveMemory({
            pin_id: pinId,
            type,
            cloudinary_id: result.public_id,
            caption: caption.trim() || undefined,
            width: result.width,
            height: result.height,
            duration_secs: result.duration
              ? Math.round(result.duration)
              : undefined,
          });
        }
      }
      router.push(`/p/${pinId}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setBusy(false);
      setProgress(0);
    }
  }

  const accept = tab === "video" ? "video/*" : "image/*";

  return (
    <main className="mx-auto max-w-md px-page py-5">
      <header className="mb-6 flex items-center gap-1">
        <Link href={`/p/${pinId}`} aria-label="Back" className={iconBtnGhost}>
          <ChevronLeft className="h-6 w-6" strokeWidth={1.75} />
        </Link>
        <div>
          <span className="index-num">ADD</span>
          <h1 className="text-heading">{pinTitle}</h1>
        </div>
      </header>

      {/* Tabs */}
      <div className="mb-5 grid grid-cols-3 gap-1 rounded-ctl border border-border bg-surface p-1">
        {(["photo", "video", "note"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              setFiles([]);
            }}
            className={`min-h-[40px] rounded-md font-mono text-micro uppercase tracking-[0.1em] transition-colors ${
              tab === t ? "bg-accent text-white" : "text-muted hover:text-ink"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab !== "note" && (
        <>
          {/* No `capture` → iOS shows Photo Library / Take Photo / Choose File
              (the camera-only behaviour came from the capture attribute). */}
          <input
            ref={fileRef}
            type="file"
            accept={accept}
            multiple
            hidden
            onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="flex min-h-[160px] w-full flex-col items-center justify-center gap-2 rounded-card border border-dashed border-border bg-surface text-muted transition-colors hover:border-ink/30"
          >
            <ImagePlus className="h-8 w-8" strokeWidth={1.5} />
            <span className="text-caption">
              {files.length > 0
                ? `${files.length} file${files.length > 1 ? "s" : ""} selected — tap to change`
                : `Tap to choose ${tab}`}
            </span>
          </button>

          {previews.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {previews.map((p, i) => (
                <div
                  key={i}
                  className="relative aspect-square overflow-hidden rounded-ctl border border-border bg-surface-2"
                >
                  {p.isVideo ? (
                    <>
                      <video
                        src={p.url}
                        muted
                        playsInline
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <Play className="h-6 w-6 fill-white text-white" />
                      </span>
                    </>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  )}
                  {busy && progress > 0 && (
                    <span className="absolute inset-0 bg-white/40" />
                  )}
                  {!busy && (
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      aria-label="Remove"
                      className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="my-3 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="label">or</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <GooglePhotosButton
            pinId={pinId}
            onImported={() => {
              router.push(`/p/${pinId}`);
              router.refresh();
            }}
          />
        </>
      )}

      <textarea
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder={tab === "note" ? "Write a memory…" : "Caption (optional)"}
        rows={tab === "note" ? 5 : 2}
        className="mt-4 w-full rounded-ctl border border-border bg-surface p-3 text-body text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-accent"
      />

      {busy && progress > 0 && (
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full bg-accent transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {error && <p className="mt-4 text-caption text-accent">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={busy}
        className="mt-6 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-ctl bg-accent text-body font-medium text-white transition-colors hover:bg-accent-strong disabled:opacity-50"
      >
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : "Upload memory"}
      </button>
    </main>
  );
}
