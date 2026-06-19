import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCouple } from "@/lib/auth";
import { createCouple, updateProfile, signOut } from "./actions";
import { InviteLink } from "@/components/InviteLink";

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

  // Resolve the partner (the other member of the couple), if any.
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

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const inviteUrl = couple ? `${appUrl}/invite/${couple.invite_code}` : "";

  return (
    <main className="mx-auto max-w-md px-page py-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-heading">Settings</h1>
        <Link href="/dashboard" className="text-caption text-accent">
          Done
        </Link>
      </header>

      {/* Profile */}
      <section className="mb-6 rounded-2xl border border-border bg-surface p-5">
        <h2 className="mb-3 text-body font-medium">Profile</h2>
        <form action={updateProfile} className="space-y-3">
          <label className="block text-caption text-text-muted">
            Display name
          </label>
          <input
            name="display_name"
            defaultValue={profile?.display_name ?? ""}
            placeholder="Your name"
            className="min-h-[44px] w-full rounded-xl border border-border bg-surface-2 px-4 text-body outline-none focus:border-accent"
          />
          <button className="min-h-[44px] rounded-xl bg-accent px-4 text-body font-medium text-[#0a0f1e]">
            Save
          </button>
        </form>
      </section>

      {/* Couple */}
      <section className="mb-6 rounded-2xl border border-border bg-surface p-5">
        <h2 className="mb-3 text-body font-medium">Couple</h2>

        {!couple ? (
          <form action={createCouple}>
            <p className="mb-3 text-caption text-text-muted">
              Create a couple to start sharing memories, then send the invite
              link to your partner.
            </p>
            <button className="min-h-[44px] rounded-xl bg-accent-2 px-4 text-body font-medium text-[#0a0f1e]">
              Create couple
            </button>
          </form>
        ) : partner ? (
          <p className="text-body">
            Connected with{" "}
            <span className="font-medium text-accent-2">
              {partner.display_name ?? "your partner"}
            </span>{" "}
            💕
          </p>
        ) : (
          <div>
            <p className="mb-3 text-caption text-text-muted">
              Share this link with your partner to connect:
            </p>
            <InviteLink url={inviteUrl} />
          </div>
        )}
      </section>

      <form action={signOut}>
        <button className="min-h-[44px] w-full rounded-xl border border-border bg-surface px-4 text-body text-text-muted">
          Sign out
        </button>
      </form>
    </main>
  );
}
