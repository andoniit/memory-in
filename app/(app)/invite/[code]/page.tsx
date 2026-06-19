import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { acceptInvite } from "./actions";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: couple } = await supabase
    .from("couples")
    .select("id, user1_id, user2_id")
    .eq("invite_code", code.toUpperCase())
    .maybeSingle();

  let inviterName = "someone";
  if (couple) {
    const { data: inviter } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", couple.user1_id)
      .maybeSingle();
    inviterName = inviter?.display_name ?? "your partner";
  }

  const accept = acceptInvite.bind(null, code);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-page text-center">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6">
        {!couple ? (
          <>
            <h1 className="text-heading">Invalid invite</h1>
            <p className="mt-2 text-caption text-text-muted">
              This invite link isn&apos;t valid or has expired.
            </p>
            <Link
              href="/dashboard"
              className="mt-5 inline-block min-h-[44px] rounded-xl bg-accent px-5 py-3 text-body font-medium text-[#0a0f1e]"
            >
              Go home
            </Link>
          </>
        ) : (
          <>
            <div className="text-4xl">💕</div>
            <h1 className="mt-3 text-heading">
              {inviterName} invited you to MemoryPin
            </h1>
            <p className="mt-2 text-caption text-text-muted">
              Connect to start sharing travel memories together.
            </p>

            {user ? (
              <form action={accept} className="mt-5">
                <button className="min-h-[44px] w-full rounded-xl bg-accent-2 px-5 py-3 text-body font-medium text-[#0a0f1e]">
                  Accept &amp; connect
                </button>
              </form>
            ) : (
              <Link
                href={`/login?redirect=/invite/${code}`}
                className="mt-5 inline-block min-h-[44px] w-full rounded-xl bg-accent px-5 py-3 text-body font-medium text-[#0a0f1e]"
              >
                Sign up to accept
              </Link>
            )}
          </>
        )}
      </div>
    </main>
  );
}
