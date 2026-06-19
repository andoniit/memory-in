// Shared class strings for the light/technical design system.
// Used on both <button> and <Link> so styling stays consistent.

export const btnPrimary =
  "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-ctl bg-accent px-5 text-body font-medium text-white transition-colors hover:bg-accent-strong active:bg-accent-strong disabled:opacity-50";

export const btnSecondary =
  "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-ctl border border-ink/15 bg-surface px-5 text-body font-medium text-ink transition-colors hover:bg-surface-2 disabled:opacity-50";

export const btnGhost =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-ctl px-3 text-body text-muted transition-colors hover:text-ink";

// Circular icon action button (the orange accent control from the ref).
export const iconBtnAccent =
  "flex h-11 w-11 items-center justify-center rounded-full bg-accent text-white transition-colors hover:bg-accent-strong";

export const iconBtnGhost =
  "flex h-11 w-11 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink";

export const field =
  "min-h-[48px] w-full rounded-ctl border border-border bg-surface px-4 text-body text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-accent";

export const card = "rounded-card border border-border bg-surface";
