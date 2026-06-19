import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AcceptInviteForm } from "@/components/AcceptInviteForm";
import { btnPrimary } from "@/lib/ui";
import { MAX_CIRCLE_MEMBERS } from "@/types/index";

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

  const { data: circle } = await supabase
    .from("circles")
    .select("id, owner_id")
    .eq("invite_code", code.toUpperCase())
    .maybeSingle();

  let inviterName = "Someone";
  let memberCount = 0;
  if (circle) {
    const { data: owner } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", circle.owner_id)
      .maybeSingle();
    inviterName = owner?.display_name ?? "Someone";
    const { count } = await supabase
      .from("circle_members")
      .select("user_id", { count: "exact", head: true })
      .eq("circle_id", circle.id);
    memberCount = count ?? 0;
  }

  const full = memberCount >= MAX_CIRCLE_MEMBERS;

  return (
    <main className="flex min-h-dvh flex-col justify-center px-page">
      {!circle ? (
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
            {inviterName} invited you to their MemoryPin circle
          </h1>
          <p className="mt-3 max-w-sm text-body text-muted">
            Join to share travel memories together — up to{" "}
            {MAX_CIRCLE_MEMBERS} people per circle.
          </p>
          <p className="mt-2 font-mono text-micro tabular-nums text-muted">
            {memberCount} / {MAX_CIRCLE_MEMBERS} members
          </p>

          {full ? (
            <p className="mt-7 text-body text-accent">
              This circle is already full.
            </p>
          ) : user ? (
            <AcceptInviteForm code={code} />
          ) : (
            <Link
              href={`/login?redirect=/invite/${code}`}
              className={`${btnPrimary} mt-7 w-full`}
            >
              Sign up to join
            </Link>
          )}
        </div>
      )}
    </main>
  );
}
