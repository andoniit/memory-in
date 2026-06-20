"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

const JOIN_MESSAGES: Record<string, string> = {
  invalid_code: "That code isn't valid.",
  circle_full: "That circle is already full (4 members max).",
  has_memories:
    "You already have your own memories. Ask your friend to join your circle instead.",
};

/**
 * Join a friend's circle by entering their code. Form-action signature for
 * useActionState. Returns an error message on failure; redirects on success.
 */
export async function joinByCode(
  _prev: string | null,
  formData: FormData,
): Promise<string | null> {
  const code = String(formData.get("code") ?? "")
    .trim()
    .toUpperCase();
  if (!code) return "Enter a code.";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.rpc("join_circle", { p_code: code });
  if (error) {
    const key = Object.keys(JOIN_MESSAGES).find((k) =>
      error.message.includes(k),
    );
    return key ? JOIN_MESSAGES[key] : "Could not join that circle.";
  }

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
