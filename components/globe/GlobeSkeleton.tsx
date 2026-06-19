import { OrbitMark } from "@/components/OrbitMark";

/** Flat placeholder shown while the Three.js globe chunk loads. */
export function GlobeSkeleton() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <OrbitMark className="w-[min(80%,360px)] animate-pulse opacity-70" />
    </div>
  );
}
