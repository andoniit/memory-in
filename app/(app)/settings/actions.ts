"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Create a couple owned by the current user (waiting for a partner). */
export async function createCouple() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Idempotent: if they already have a couple, do nothing.
  const { data: existing } = await supabase
    .from("couples")
    .select("id")
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .maybeSingle();
  if (existing) {
    revalidatePath("/settings");
    return;
  }

  const { error } = await supabase
    .from("couples")
    .insert({ user1_id: user.id });
  if (error) throw new Error(error.message);

  revalidatePath("/settings");
}

/** Update the current user's display name. */
export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const displayName = String(formData.get("display_name") ?? "").trim();
  await supabase
    .from("profiles")
    .update({ display_name: displayName })
    .eq("id", user.id);

  revalidatePath("/settings");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
