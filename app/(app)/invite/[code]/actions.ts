"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const MESSAGES: Record<string, string> = {
  invalid_code: "This invite link isn't valid.",
  circle_full: "This Orbit is already full (4 members max).",
  has_memories:
    "You already have your own memories. Ask them to join your Orbit instead.",
};

/**
 * Accept a circle invite. Form-action signature for useActionState.
 * Joins the circle that owns `code` (capacity + move handled in the DB).
 * Returns an error message on failure; redirects to /dashboard on success.
 */
export async function acceptInvite(
  _prev: string | null,
  formData: FormData,
): Promise<string | null> {
  const code = String(formData.get("code") ?? "");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=/invite/${code}`);

  const { error } = await supabase.rpc("join_circle", { p_code: code });
  if (error) {
    const key = Object.keys(MESSAGES).find((k) => error.message.includes(k));
    return key ? MESSAGES[key] : "Could not join this circle.";
  }

  redirect("/dashboard");
}
