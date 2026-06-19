import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Plus, SlidersHorizontal } from "lucide-react";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getCouple } from "@/lib/auth";
import { heroUrl } from "@/lib/cloudinary";
import { PhotoGrid } from "@/components/pin/PhotoGrid";
import { StorySection } from "@/components/pin/StorySection";
import { iconBtnGhost } from "@/lib/ui";
import type { Memory } from "@/types/index";

export const dynamic = "force-dynamic";

export default async function PinPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: pin } = await supabase
    .from("pins")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!pin) {
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

  const {
    data: { user },
  } = await supabase.auth.getUser();
  let isMember = false;
  if (user) {
    const couple = await getCouple(user.id);
    isMember = !!couple && couple.id === pin.couple_id;
  }

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
    <main className="min-h-dvh pb-28">
      {/* Top bar */}
      <div className="sticky top-0 z-10 flex items-center gap-1 bg-background/85 px-2 pt-safe backdrop-blur">
        <Link href="/dashboard" aria-label="Back" className={iconBtnGhost}>
          <ChevronLeft className="h-6 w-6" strokeWidth={1.75} />
        </Link>
        <span className="truncate font-mono text-micro uppercase tracking-[0.14em] text-muted">
          {pin.city ?? pin.title}
        </span>
        {isMember && (
          <Link
            href={`/pin/${id}`}
            aria-label="Manage pin"
            className={`${iconBtnGhost} ml-auto`}
          >
            <SlidersHorizontal className="h-5 w-5" strokeWidth={1.75} />
          </Link>
        )}
      </div>

      {/* Hero */}
      <section className="relative">
        {hero?.type === "photo" && hero.cloudinary_id ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroUrl(hero.cloudinary_id)}
              alt={pin.title}
              className="h-[52vh] w-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent px-page pb-6 pt-20">
              <h1 className="text-display text-white">{pin.title}</h1>
              <p className="mt-2 font-mono text-micro uppercase tracking-[0.14em] text-white/80">
                {[pin.city, dateLabel].filter(Boolean).join(" / ")}
              </p>
            </div>
          </>
        ) : (
          <div className="flex h-[40vh] w-full flex-col items-center justify-center gap-3 bg-surface-2">
            <span className="text-5xl opacity-40">{pin.emoji}</span>
            <h1 className="text-heading">{pin.title}</h1>
          </div>
        )}
      </section>

      {/* Meta row */}
      <div className="flex items-center justify-between border-b border-border px-page py-4">
        <span className="label">
          {list.length} {list.length === 1 ? "memory" : "memories"}
        </span>
        <span className="font-mono text-micro tabular-nums text-muted">
          {String(pin.view_count).padStart(3, "0")} views
        </span>
      </div>

      {/* AI story */}
      <StorySection
        pinId={id}
        initialStory={pin.story}
        canGenerate={isMember}
      />

      {/* Memories */}
      <section className="py-5">
        <p className="label mb-3 px-page">All memories</p>
        {list.length > 0 ? (
          <PhotoGrid memories={list} />
        ) : (
          <p className="px-page text-body text-muted">
            No memories yet — be the first to add one.
          </p>
        )}
      </section>

      {/* Add memory */}
      {(isMember || !user) && (
        <div className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-surface/95 p-page pb-[calc(env(safe-area-inset-bottom)+16px)] backdrop-blur">
          <Link
            href={`/p/${id}/upload`}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-ctl bg-accent text-body font-medium text-white transition-colors hover:bg-accent-strong"
          >
            <Plus className="h-5 w-5" /> Add your memory
          </Link>
        </div>
      )}
    </main>
  );
}
