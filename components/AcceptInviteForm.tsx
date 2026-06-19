"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { acceptInvite } from "@/app/(app)/invite/[code]/actions";
import { btnPrimary } from "@/lib/ui";

export function AcceptInviteForm({ code }: { code: string }) {
  const [error, action, pending] = useActionState(acceptInvite, null);

  return (
    <form action={action} className="mt-7">
      <input type="hidden" name="code" value={code} />
      <button disabled={pending} className={`${btnPrimary} w-full`}>
        {pending ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          "Accept & join"
        )}
      </button>
      {error && <p className="mt-3 text-caption text-accent">{error}</p>}
    </form>
  );
}
