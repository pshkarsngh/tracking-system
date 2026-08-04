import { Brand } from "@/components/brand";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div className="ambient-glow" aria-hidden />
      <div className="absolute left-5 top-5">
        <Brand />
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
