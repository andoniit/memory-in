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
              "flex min-h-[60px] flex-1 flex-col items-center justify-center gap-1",
              active ? "text-accent" : "text-muted",
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
        className="flex min-h-[60px] flex-1 flex-col items-center justify-center"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-white transition-colors hover:bg-accent-strong">
          <Plus className="h-5 w-5" />
        </span>
      </Link>
    </nav>
  );
}
