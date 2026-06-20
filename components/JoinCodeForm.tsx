"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { joinByCode } from "@/app/(app)/settings/actions";
import { field } from "@/lib/ui";

export function JoinCodeForm() {
  const [error, action, pending] = useActionState(joinByCode, null);

  return (
    <form action={action} className="flex flex-col gap-2">
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
