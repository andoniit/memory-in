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
      className="group block overflow-hidden rounded-card border border-border bg-surface transition-colors hover:border-ink/25"
    >
      <div className="relative aspect-[4/3] w-full bg-surface-2">
        {pin.cover?.thumb_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={pin.cover.thumb_url}
            alt={pin.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl text-muted/40">
            {pin.emoji}
          </div>
        )}
        <span className="absolute left-2 top-2 rounded-full bg-surface/90 px-2 py-0.5 font-mono text-micro tabular-nums text-muted backdrop-blur">
          {String(pin.memory_count).padStart(2, "0")}
        </span>
      </div>
      <div className="p-3">
        <p className="truncate text-body font-medium">
          {pin.city ?? pin.title}
        </p>
        <p className="label mt-1">{dateLabel ?? "Undated"}</p>
      </div>
    </Link>
  );
}
