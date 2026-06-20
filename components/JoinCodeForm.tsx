"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { joinByCode } from "@/app/(app)/settings/actions";
import { field } from "@/lib/ui";

export function JoinCodeForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      // Resolves only on failure; success redirects server-side.
      const result = await joinByCode(null, formData);
      if (result) setError(result);
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          name="code"
          required
          autoCapitalize="characters"
          placeholder="Enter a code"
          className={`${field} flex-1 font-mono uppercase tracking-[0.14em]`}
        />
        <button
          disabled={pending}
          className="flex min-h-[48px] items-center justify-center rounded-ctl bg-ink px-5 text-body font-medium text-white transition-colors hover:bg-ink/85 disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Join"}
        </button>
      </div>
      {error && <p className="text-caption text-accent">{error}</p>}
    </form>
  );
}
