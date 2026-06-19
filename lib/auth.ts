import { createClient } from "@/lib/supabase/server";
import type { Couple } from "@/types/index";

/** The authenticated user, or null. */
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** The couple the given user belongs to (as user1 or user2), or null. */
export async function getCouple(userId: string): Promise<Couple | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("couples")
    .select("*")
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .maybeSingle();
  return data;
}

/** Where to send a user right after login. */
export async function postLoginPath(userId: string) {
  const couple = await getCouple(userId);
  return couple ? "/dashboard" : "/settings";
}
