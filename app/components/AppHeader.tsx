"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/graph", label: "Knowledge Graph" },
  { href: "/", label: "Dashboard" },
];

export default function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0b0d10]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-lime-400 text-lg font-black text-black">
            O
          </span>

          <span className="text-base font-semibold tracking-tight text-white">
            Onto<span className="text-lime-400">Write</span>
          </span>
        </Link>

        <nav
          aria-label="Main navigation"
          className="flex items-center gap-1 sm:gap-2"
        >
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-lg px-3 py-2 text-xs font-medium transition sm:px-4 sm:text-sm ${
                  active
                    ? "bg-lime-400/10 text-lime-300"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
