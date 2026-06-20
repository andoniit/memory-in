import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Onboarding } from "@/components/onboarding/Onboarding";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  // Already onboarded → straight to the app.
  if (profile?.display_name) redirect("/dashboard");

  const meta = user.user_metadata ?? {};
  const defaultName: string = meta.full_name ?? meta.name ?? "";
  const defaultAvatar: string | null = meta.avatar_url ?? meta.picture ?? null;

  return (
    <Onboarding defaultName={defaultName} defaultAvatar={defaultAvatar} />
  );
}
