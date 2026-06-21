import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCircle } from "@/lib/auth";
import { getBaseUrl } from "@/lib/base-url";
import { PinManager } from "@/components/pin/PinManager";

export const dynamic = "force-dynamic";

export default async function ManagePinPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=/pin/${id}`);

  const { data: pin } = await supabase
    .from("pins")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!pin) notFound();

  const circle = await getCircle(user.id);
  if (!circle || circle.id !== pin.circle_id) redirect(`/p/${id}`);

  const { data: memories } = await supabase
    .from("memories")
    .select("*")
    .eq("pin_id", id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  const appUrl = await getBaseUrl();

  return (
    <PinManager pin={pin} url={`${appUrl}/p/${pin.id}`} memories={memories ?? []} />
  );
}
