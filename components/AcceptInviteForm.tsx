"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { acceptInvite } from "@/app/(app)/invite/[code]/actions";
import { btnPrimary } from "@/lib/ui";

export function AcceptInviteForm({ code }: { code: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await acceptInvite(null, formData);
      if (result) setError(result);
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-7">
      <input type="hidden" name="code" value={code} />
      <button disabled={pending} className={`${btnPrimary} w-full`}>
        {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Accept & join"}
      </button>
      {error && <p className="mt-3 text-caption text-accent">{error}</p>}
    </form>
  );
}
