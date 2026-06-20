import { GlobeBackground } from "@/components/globe/GlobeBackground";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <GlobeBackground />
      <div className="relative z-10">{children}</div>
    </>
  );
}
