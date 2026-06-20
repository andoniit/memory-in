import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCircle, getCircleMembers } from "@/lib/auth";
import { updateProfile } from "./actions";
import { InviteLink } from "@/components/InviteLink";
import { JoinCodeForm } from "@/components/JoinCodeForm";
import { SignOutButton } from "@/components/SignOutButton";
import { btnPrimary, field } from "@/lib/ui";
import { MAX_CIRCLE_MEMBERS } from "@/types/index";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const circle = await getCircle(user.id);
  const members = circle ? await getCircleMembers(circle, user.id) : [];
  const canInvite = !!circle && members.length < MAX_CIRCLE_MEMBERS;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const inviteUrl = circle ? `${appUrl}/invite/${circle.invite_code}` : "";

  return (
    <main className="mx-auto max-w-md px-page py-5">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <span className="index-num">04 — ACCOUNT</span>
          <h1 className="mt-2 text-heading">Settings</h1>
        </div>
        <Link href="/dashboard" className="label hover:text-ink">
          Done
        </Link>
      </header>

      {/* Profile */}
      <section className="mb-8">
        <p className="label mb-3">Profile</p>
        <form action={updateProfile} className="space-y-3">
          <input
            name="display_name"
            defaultValue={profile?.display_name ?? ""}
            placeholder="Your name"
            className={field}
          />
          <button className={btnPrimary}>Save</button>
        </form>
      </section>

      {/* Circle */}
      <section className="mb-10">
        <div className="mb-3 flex items-center justify-between">
          <p className="label">Your circle</p>
          <span className="font-mono text-micro tabular-nums text-muted">
            {members.length} / {MAX_CIRCLE_MEMBERS}
          </span>
        </div>

        <div className="rounded-card border border-border bg-surface p-5">
          <ul className="space-y-2">
            {members.map((m) => (
              <li
                key={m.user_id}
                className="flex items-center justify-between text-body"
              >
                <span>
                  {m.display_name ?? "Member"}
                  {m.is_self && (
                    <span className="text-muted"> (you)</span>
                  )}
                </span>
                {m.is_owner && <span className="label">Owner</span>}
              </li>
            ))}
          </ul>

          {canInvite ? (
            <div className="mt-5 border-t border-border pt-5">
              <p className="mb-3 text-caption text-muted">
                Invite a partner or friends — send them this code (up to{" "}
                {MAX_CIRCLE_MEMBERS} total).
              </p>
              <div className="mb-3 flex items-center justify-between rounded-ctl border border-border bg-surface-2 px-4 py-3">
                <span className="font-mono text-heading tracking-[0.3em]">
                  {circle?.invite_code}
                </span>
                <span className="label">Your code</span>
              </div>
              <InviteLink url={inviteUrl} />
            </div>
          ) : (
            <p className="mt-4 text-caption text-muted">
              Your circle is full.
            </p>
          )}
        </div>

        {members.length === 1 && (
          <p className="mt-3 text-caption text-muted">
            You&apos;re flying solo — that&apos;s perfectly fine. Invite people
            anytime to share a map.
          </p>
        )}
      </section>

      {members.length === 1 && (
        <section className="mb-10">
          <p className="label mb-3">Join a friend&apos;s circle</p>
          <div className="rounded-card border border-border bg-surface p-5">
            <p className="mb-3 text-caption text-muted">
              Got a code from a friend? Enter it to share their memories.
            </p>
            <JoinCodeForm />
          </div>
        </section>
      )}

      <SignOutButton />
    </main>
  );
}
