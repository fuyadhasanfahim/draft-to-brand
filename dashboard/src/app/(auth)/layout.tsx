import Link from "next/link";
import { BRAND } from "@/lib/constants/brand";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <aside className="relative hidden lg:flex flex-col justify-between bg-[var(--color-dark)] text-white p-12 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <Link
          href="/"
          className="relative z-10 inline-flex items-center gap-2.5 font-semibold tracking-tight"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={BRAND.logo}
            alt={BRAND.name}
            className="h-20 w-auto object-contain bg-white p-2"
          />
        </Link>
        <div className="relative z-10 max-w-md">
          <h1 className="text-display text-4xl text-white">An operating system for your agency.</h1>
          <p className="mt-4 text-white/70 text-sm leading-relaxed">
            {BRAND.mission}
          </p>
        </div>
        <p className="relative z-10 text-xs text-white/40">© {new Date().getFullYear()} {BRAND.name}</p>
      </aside>

      <main className="flex items-center justify-center p-6 lg:p-10">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
