"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { btnSecondary } from "@/lib/ui";

/**
 * Client-side sign out: clears the Supabase session in the browser, then does a
 * full navigation to /login so every server component re-renders unauthenticated.
 */
export function SignOutButton() {
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <button
      onClick={signOut}
      disabled={busy}
      className={`${btnSecondary} w-full`}
    >
      {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign out"}
    </button>
  );
}
