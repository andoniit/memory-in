/** Placeholder shown while the Three.js Earth chunk + textures load. */
export function GlobeSkeleton() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
    </div>
  );
}
