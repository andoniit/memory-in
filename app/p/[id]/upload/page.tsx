import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCouple } from "@/lib/auth";
import { UploadForm } from "@/components/pin/UploadForm";

export const dynamic = "force-dynamic";

export default async function UploadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=/p/${id}/upload`);

  const { data: pin } = await supabase
    .from("pins")
    .select("id, title, couple_id")
    .eq("id", id)
    .maybeSingle();
  if (!pin) notFound();

  // Only couple members may add memories.
  const couple = await getCouple(user.id);
  if (!couple || couple.id !== pin.couple_id) {
    redirect(`/p/${id}`);
  }

  return <UploadForm pinId={id} pinTitle={pin.title} />;
}
