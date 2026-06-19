import Link from "next/link";
import type { PinWithMemories } from "@/types/index";

export function PinCard({ pin }: { pin: PinWithMemories }) {
  const dateLabel = pin.visit_date
    ? new Date(pin.visit_date).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <Link
      href={`/p/${pin.id}`}
      className="block overflow-hidden rounded-2xl border border-border bg-surface"
    >
      <div className="aspect-[4/3] w-full bg-surface-2">
        {pin.cover?.thumb_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={pin.cover.thumb_url}
            alt={pin.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl">
            {pin.emoji}
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="truncate text-body font-medium">
          {pin.emoji} {pin.city ?? pin.title}
        </p>
        <p className="mt-0.5 text-micro text-text-muted">
          {[dateLabel, `${pin.memory_count} memories`]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>
    </Link>
  );
}
