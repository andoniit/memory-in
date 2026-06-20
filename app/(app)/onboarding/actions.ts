"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const JOIN_MESSAGES: Record<string, string> = {
  invalid_code: "That code isn't valid.",
  circle_full: "That Orbit is already full (4 members max).",
  has_memories: "You already have memories here. Ask them to join your Orbit.",
};

export interface OnboardingInput {
  name: string;
  avatarUrl: string | null;
  mode: "create" | "join";
  spaceName: string;
  code: string;
}

/**
 * Complete onboarding: save the profile (name + photo), then either name the
 * user's own Orbit or join a friend's by code.
 */
export async function finishOnboarding(
  input: OnboardingInput,
): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const name = input.name.trim();
  if (!name) return { error: "Please enter your name." };

  await supabase
    .from("profiles")
    .update({ display_name: name, avatar_url: input.avatarUrl ?? null })
    .eq("id", user.id);

  if (input.mode === "join") {
    const code = input.code.trim().toUpperCase();
    if (!code) return { error: "Enter a code to join." };
    const { error } = await supabase.rpc("join_circle", { p_code: code });
    if (error) {
      const key = Object.keys(JOIN_MESSAGES).find((k) =>
        error.message.includes(k),
      );
      return { error: key ? JOIN_MESSAGES[key] : "Could not join that Orbit." };
    }
  } else {
    const spaceName = input.spaceName.trim() || `${name}'s Orbit`;
    const { data: membership } = await supabase
      .from("circle_members")
      .select("circle_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (membership) {
      await supabase
        .from("circles")
        .update({ name: spaceName })
        .eq("id", membership.circle_id);
    }
  }

  redirect("/dashboard");
}
