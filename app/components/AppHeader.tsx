"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useEffect, useState } from "react";
import { account } from "@/lib/appwrite";

const graphLink = { href: "/graph", label: "Knowledge Graph" };
const dashboardLink = { href: "/dashboard", label: "Dashboard" };

export default function AppHeader() {
  const pathname = usePathname();
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    account
      .get()
      .then(() => setSignedIn(true))
      .catch(() => setSignedIn(false));
  }, []);

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
          <Link
            href={graphLink.href}
            aria-current={
              pathname.startsWith(graphLink.href) ? "page" : undefined
            }
            className={`rounded-lg px-3 py-2 text-xs font-medium transition sm:px-4 sm:text-sm ${
              pathname.startsWith(graphLink.href)
                ? "bg-lime-400/10 text-lime-300"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            {graphLink.label}
          </Link>
          {signedIn ? (
            <Link
              href={dashboardLink.href}
              aria-current={
                pathname.startsWith(dashboardLink.href) ? "page" : undefined
              }
              className={`rounded-lg px-3 py-2 text-xs font-medium transition sm:px-4 sm:text-sm ${
                pathname.startsWith(dashboardLink.href)
                  ? "bg-lime-400/10 text-lime-300"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              {dashboardLink.label}
            </Link>
          ) : (
            <Link
              href="/auth"
              aria-current={pathname === "/auth" ? "page" : undefined}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition sm:px-4 sm:text-sm ${
                pathname === "/auth"
                  ? "bg-lime-400/10 text-lime-300"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
