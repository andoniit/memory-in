"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Mail } from "lucide-react";

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
    <main className="flex min-h-dvh flex-col items-center justify-center px-page">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6">
        <h1 className="text-heading">Sign in to MemoryPin</h1>
        <p className="mt-1 text-caption text-text-muted">
          Your travels, alive on your wall.
        </p>

        {status === "sent" ? (
          <div className="mt-6 rounded-xl border border-border bg-surface-2 p-4 text-center">
            <Mail className="mx-auto mb-2 h-6 w-6 text-accent" />
            <p className="text-body">Check your inbox</p>
            <p className="mt-1 text-caption text-text-muted">
              We sent a magic link to {email}.
            </p>
          </div>
        ) : (
          <>
            <form onSubmit={sendMagicLink} className="mt-6 space-y-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="min-h-[44px] w-full rounded-xl border border-border bg-surface-2 px-4 text-body text-text-primary outline-none placeholder:text-text-muted focus:border-accent"
              />
              <button
                type="submit"
                disabled={status === "sending"}
                className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 text-body font-medium text-[#0a0f1e] disabled:opacity-60"
              >
                {status === "sending" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Send magic link"
                )}
              </button>
            </form>

            <div className="my-4 flex items-center gap-3 text-micro text-text-muted">
              <span className="h-px flex-1 bg-border" />
              or
              <span className="h-px flex-1 bg-border" />
            </div>

            <button
              onClick={signInWithGoogle}
              className="min-h-[44px] w-full rounded-xl border border-border bg-surface-2 px-4 text-body font-medium text-text-primary"
            >
              Continue with Google
            </button>

            {error && (
              <p className="mt-3 text-caption text-accent-2">{error}</p>
            )}
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
