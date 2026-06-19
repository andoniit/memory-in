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
    <nav className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-around border-t border-border bg-surface/95 pb-safe backdrop-blur">
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href.split("#")[0];
        return (
          <Link
            key={label}
            href={href}
            className={cn(
              "flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 text-micro",
              active ? "text-accent" : "text-text-muted",
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        );
      })}
      <Link
        href="/pin/new"
        aria-label="New pin"
        className="flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 text-micro text-accent-2"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-2 text-[#0a0f1e]">
          <Plus className="h-5 w-5" />
        </span>
      </Link>
    </nav>
  );
}
