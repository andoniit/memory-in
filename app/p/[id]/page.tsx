import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Plus } from "lucide-react";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getCouple } from "@/lib/auth";
import { heroUrl } from "@/lib/cloudinary";
import { PhotoGrid } from "@/components/pin/PhotoGrid";
import type { Memory } from "@/types/index";

// Always render fresh so newly uploaded memories show on tap.
export const dynamic = "force-dynamic";

export default async function PinPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // RLS: public pins read by anyone; private pins only if the caller's couple
  // owns them (the authed cookie carries the session).
  const { data: pin } = await supabase
    .from("pins")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!pin) {
    // Either it doesn't exist or it's private and the viewer isn't a member.
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect(`/login?redirect=/p/${id}`);
    notFound();
  }

  const { data: memories } = await supabase
    .from("memories")
    .select("*")
    .eq("pin_id", id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(60);

  const list: Memory[] = memories ?? [];
  const hero = list.find((m) => m.type === "photo") ?? list[0];

  // Is the viewer a member of this pin's couple? (controls "Add memory")
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let isMember = false;
  if (user) {
    const couple = await getCouple(user.id);
    isMember = !!couple && couple.id === pin.couple_id;
  }

  // Fire-and-forget-ish analytics (fast single update).
  const svc = createServiceClient();
  await Promise.allSettled([
    svc.rpc("increment_pin_view", { p_id: id }),
    svc.from("pin_views").insert({ pin_id: id }),
  ]);

  const dateLabel = pin.visit_date
    ? new Date(pin.visit_date).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <main className="min-h-dvh pb-24">
      {/* Top bar */}
      <div className="sticky top-0 z-10 flex items-center gap-2 bg-background/80 px-2 pt-safe backdrop-blur">
        <Link
          href="/dashboard"
          aria-label="Back"
          className="flex h-11 w-11 items-center justify-center rounded-full text-text-primary"
        >
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <span className="truncate text-body font-medium">
          {pin.emoji} {pin.city ?? pin.title}
        </span>
      </div>

      {/* Hero */}
      <section className="relative">
        {hero?.type === "photo" && hero.cloudinary_id ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroUrl(hero.cloudinary_id)}
            alt={pin.title}
            className="h-[50vh] w-full object-cover"
          />
        ) : (
          <div className="flex h-[40vh] w-full items-center justify-center bg-surface text-6xl">
            {pin.emoji}
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background to-transparent p-page pt-16">
          <h1 className="text-display">{pin.title}</h1>
          <p className="mt-1 text-caption text-text-muted">
            {[pin.city, dateLabel].filter(Boolean).join(" · ")}
          </p>
          <p className="mt-1 text-caption text-accent-2">
            💕 {list.length} {list.length === 1 ? "memory" : "memories"}
          </p>
        </div>
      </section>

      {/* AI story */}
      {pin.story && (
        <section className="px-page py-5">
          <h2 className="mb-2 text-micro uppercase tracking-wide text-text-muted">
            Our story
          </h2>
          <p className="text-body italic leading-relaxed">{pin.story}</p>
        </section>
      )}

      {/* Memories */}
      <section className="py-3">
        <h2 className="mb-2 px-page text-micro uppercase tracking-wide text-text-muted">
          All memories
        </h2>
        {list.length > 0 ? (
          <PhotoGrid memories={list} />
        ) : (
          <p className="px-page text-caption text-text-muted">
            No memories yet — be the first to add one.
          </p>
        )}
      </section>

      {/* Add memory — visible to couple members, or to signed-out visitors who
          may sign in to contribute. */}
      {(isMember || !user) && (
        <div className="fixed inset-x-0 bottom-0 z-10 bg-gradient-to-t from-background to-transparent p-page pb-safe">
          <Link
            href={`/p/${id}/upload`}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-accent-2 text-body font-medium text-[#0a0f1e]"
          >
            <Plus className="h-5 w-5" /> Add your memory
          </Link>
        </div>
      )}
    </main>
  );
}
