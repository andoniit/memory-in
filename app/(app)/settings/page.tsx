import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCouple } from "@/lib/auth";
import { createCouple, updateProfile, signOut } from "./actions";
import { InviteLink } from "@/components/InviteLink";
import { btnPrimary, btnSecondary, field } from "@/lib/ui";

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

  const couple = await getCouple(user.id);

  let partner: { display_name: string | null } | null = null;
  if (couple) {
    const partnerId =
      couple.user1_id === user.id ? couple.user2_id : couple.user1_id;
    if (partnerId) {
      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", partnerId)
        .maybeSingle();
      partner = data;
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const inviteUrl = couple ? `${appUrl}/invite/${couple.invite_code}` : "";

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
      <section className="mb-6">
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

      {/* Couple */}
      <section className="mb-10">
        <p className="label mb-3">Couple</p>

        {!couple ? (
          <form action={createCouple} className="rounded-card border border-border bg-surface p-5">
            <p className="text-body text-muted">
              Create a couple to share memories, then send the invite link to
              your partner.
            </p>
            <button className={`${btnPrimary} mt-4`}>Create couple</button>
          </form>
        ) : partner ? (
          <div className="rounded-card border border-border bg-surface p-5">
            <p className="text-body">
              Connected with{" "}
              <span className="font-medium text-accent">
                {partner.display_name ?? "your partner"}
              </span>
            </p>
          </div>
        ) : (
          <div className="rounded-card border border-border bg-surface p-5">
            <p className="mb-3 text-body text-muted">
              Share this link with your partner to connect:
            </p>
            <InviteLink url={inviteUrl} />
          </div>
        )}
      </section>

      <form action={signOut}>
        <button className={`${btnSecondary} w-full`}>Sign out</button>
      </form>
    </main>
  );
}
