"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** A nav link with the 1px inset mint underline when one of `matches` is the current path or its parent. */
export function NavLink({ href, matches, children }: { href: string; matches: string[]; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = matches.some((m) => pathname === m || (m !== "/" && pathname.startsWith(`${m}/`)));

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex min-h-11 items-center px-1 font-mono text-[12px] font-semibold tracking-[0.12em] uppercase transition-colors duration-150 hover:text-mint ${
        active ? "shadow-[inset_0_-1px_0_var(--color-mint)]" : "text-ink-soft"
      }`}
    >
      {children}
    </Link>
  );
}
