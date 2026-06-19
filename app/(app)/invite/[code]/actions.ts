"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Accept a couple invite: attach the current user as user2 of the couple that
 * owns `code`. Guards against joining your own couple or a full couple.
 */
export async function acceptInvite(code: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=/invite/${code}`);

  // If the user already has a couple, just send them home.
  const { data: mine } = await supabase
    .from("couples")
    .select("id")
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .maybeSingle();
  if (mine) redirect("/dashboard");

  const { data: couple } = await supabase
    .from("couples")
    .select("id, user1_id, user2_id")
    .eq("invite_code", code.toUpperCase())
    .maybeSingle();

  if (!couple) throw new Error("This invite code is not valid.");
  if (couple.user1_id === user.id) redirect("/dashboard");
  if (couple.user2_id) throw new Error("This couple is already complete.");

  const { error } = await supabase
    .from("couples")
    .update({ user2_id: user.id })
    .eq("id", couple.id);
  if (error) throw new Error(error.message);

  redirect("/dashboard");
}
