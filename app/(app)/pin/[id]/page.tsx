import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCircle } from "@/lib/auth";
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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return <PinManager pin={pin} url={`${appUrl}/p/${pin.id}`} />;
}
