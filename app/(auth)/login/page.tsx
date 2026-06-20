"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { btnPrimary } from "@/lib/ui";

function LoginForm() {
  const params = useSearchParams();
  const redirect = params.get("redirect") ?? "";

  async function signInWithGoogle() {
    const url = new URL("/auth/callback", window.location.origin);
    if (redirect) url.searchParams.set("redirect", redirect);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: url.toString() },
    });
  }

  return (
    <main className="flex min-h-dvh flex-col px-page">
      <header className="flex items-center gap-2 py-5">
        <span className="h-2.5 w-2.5 rounded-full bg-accent" />
        <Link
          href="/"
          className="font-mono text-micro uppercase tracking-[0.2em]"
        >
          MemoryPin
        </Link>
      </header>

      <div className="flex flex-1 flex-col justify-center pb-16">
        <span className="index-num">02 — ACCESS</span>
        <h1 className="mt-3 text-display">Sign in</h1>
        <p className="mt-2 max-w-xs text-body text-muted">
          Continue with Google to start tagging memories.
        </p>

        <button
          onClick={signInWithGoogle}
          className={`${btnPrimary} mt-8 w-full`}
        >
          <GoogleMark />
          Continue with Google
        </button>
      </div>
    </main>
  );
}

function GoogleMark() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#fff"
        d="M21.35 11.1H12v2.98h5.35c-.23 1.4-1.65 4.1-5.35 4.1a5.9 5.9 0 0 1 0-11.8c1.68 0 2.8.72 3.45 1.34l2.35-2.27C16.4 3.9 14.4 3 12 3a9 9 0 1 0 0 18c5.2 0 8.65-3.65 8.65-8.8 0-.6-.07-1.05-.3-1.1z"
      />
    </svg>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
