"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Globe, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/dashboard#globe", label: "Globe", icon: Globe },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-20 flex items-center justify-around border-t border-border bg-surface/95 pb-safe backdrop-blur",
        // Desktop: a centered floating pill instead of a full-width bar.
        "md:inset-x-auto md:bottom-6 md:left-1/2 md:w-auto md:-translate-x-1/2 md:gap-1 md:rounded-full md:border md:px-2 md:pb-0 md:shadow-[0_8px_30px_rgba(0,0,0,0.12)]",
      )}
    >
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href.split("#")[0];
        return (
          <Link
            key={label}
            href={href}
            className={cn(
              "flex min-h-[60px] flex-1 flex-col items-center justify-center gap-1 md:min-h-0 md:flex-none md:flex-row md:gap-2 md:px-4 md:py-2.5",
              active ? "text-accent" : "text-muted hover:text-ink",
            )}
          >
            <Icon className="h-5 w-5" strokeWidth={1.75} />
            <span className="font-mono text-[0.625rem] uppercase tracking-[0.12em]">
              {label}
            </span>
          </Link>
        );
      })}
      <Link
        href="/pin/new"
        aria-label="New pin"
        className="flex min-h-[60px] flex-1 flex-col items-center justify-center md:min-h-0 md:flex-none md:px-2 md:py-2"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-white transition-colors hover:bg-accent-strong">
          <Plus className="h-5 w-5" />
        </span>
      </Link>
    </nav>
  );
}
