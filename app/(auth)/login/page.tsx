"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import { btnPrimary, btnSecondary, field } from "@/lib/ui";

function LoginForm() {
  const params = useSearchParams();
  const redirect = params.get("redirect") ?? "";
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  const callbackUrl = () => {
    const url = new URL("/auth/callback", window.location.origin);
    if (redirect) url.searchParams.set("redirect", redirect);
    return url.toString();
  };

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: callbackUrl() },
    });
    if (error) {
      setError(error.message);
      setStatus("error");
    } else {
      setStatus("sent");
    }
  }

  async function signInWithGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl() },
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
          We&apos;ll email you a secure magic link — no password.
        </p>

        {status === "sent" ? (
          <div className="mt-8 rounded-card border border-border bg-surface p-5">
            <p className="label">Check your inbox</p>
            <p className="mt-2 text-body">
              A magic link is on its way to{" "}
              <span className="font-medium">{email}</span>.
            </p>
          </div>
        ) : (
          <>
            <form onSubmit={sendMagicLink} className="mt-8 space-y-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={field}
              />
              <button
                type="submit"
                disabled={status === "sending"}
                className={`${btnPrimary} w-full`}
              >
                {status === "sending" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Send magic link"
                )}
              </button>
            </form>

            <div className="my-5 flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="label">or</span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <button
              onClick={signInWithGoogle}
              className={`${btnSecondary} w-full`}
            >
              Continue with Google
            </button>

            {error && <p className="mt-4 text-caption text-accent">{error}</p>}
          </>
        )}
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
