import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { acceptInvite } from "./actions";
import { btnPrimary } from "@/lib/ui";

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

  let inviterName = "Someone";
  if (couple) {
    const { data: inviter } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", couple.user1_id)
      .maybeSingle();
    inviterName = inviter?.display_name ?? "Your partner";
  }

  const accept = acceptInvite.bind(null, code);

  return (
    <main className="flex min-h-dvh flex-col justify-center px-page">
      {!couple ? (
        <div>
          <span className="index-num">INVITE</span>
          <h1 className="mt-3 text-display">Invalid link</h1>
          <p className="mt-2 text-body text-muted">
            This invite isn&apos;t valid or has expired.
          </p>
          <Link href="/dashboard" className={`${btnPrimary} mt-7`}>
            Go home
          </Link>
        </div>
      ) : (
        <div>
          <span className="index-num">INVITE</span>
          <h1 className="mt-3 max-w-[16ch] text-display text-balance">
            {inviterName} invited you to MemoryPin
          </h1>
          <p className="mt-3 max-w-sm text-body text-muted">
            Connect to start mapping travel memories together.
          </p>

          {user ? (
            <form action={accept} className="mt-7">
              <button className={`${btnPrimary} w-full`}>
                Accept &amp; connect
              </button>
            </form>
          ) : (
            <Link
              href={`/login?redirect=/invite/${code}`}
              className={`${btnPrimary} mt-7 w-full`}
            >
              Sign up to accept
            </Link>
          )}
        </div>
      )}
    </main>
  );
}
