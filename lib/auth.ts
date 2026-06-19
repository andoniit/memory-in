import { createClient } from "@/lib/supabase/server";
import type { Circle, CircleMemberView } from "@/types/index";

/** The authenticated user, or null. */
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * The circle the given user belongs to. Every user has exactly one (a personal
 * circle is auto-created at signup), so this is null only in the brief window
 * before the signup trigger runs.
 */
export async function getCircle(userId: string): Promise<Circle | null> {
  const supabase = await createClient();
  const { data: membership } = await supabase
    .from("circle_members")
    .select("circle_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (!membership) return null;

  const { data: circle } = await supabase
    .from("circles")
    .select("*")
    .eq("id", membership.circle_id)
    .maybeSingle();
  return circle;
}

/** Members of a circle, enriched with display names. */
export async function getCircleMembers(
  circle: Circle,
  selfId: string,
): Promise<CircleMemberView[]> {
  const supabase = await createClient();
  const { data: members } = await supabase
    .from("circle_members")
    .select("user_id")
    .eq("circle_id", circle.id);
  if (!members) return [];

  const ids = members.map((m) => m.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("id", ids);
  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.display_name]));

  return members.map((m) => ({
    user_id: m.user_id,
    display_name: nameById.get(m.user_id) ?? null,
    is_owner: m.user_id === circle.owner_id,
    is_self: m.user_id === selfId,
  }));
}

/** Where to send a user right after login. Solo works, so always the dashboard. */
export async function postLoginPath() {
  return "/dashboard";
}
