import Link from "next/link";
import { NavLink } from "./nav-link";

/** DESIGN.md §6.11: wordmark left, mono links. Only approved pages get a link. */
export function SiteHeader() {
  return (
    <header className="border-b border-hairline">
      <div className="mx-auto flex h-16 w-full max-w-[1280px] items-center gap-8 px-4 sm:px-6 lg:px-12">
        <Link href="/" className="font-display text-[24px] leading-none tracking-[0.01em] uppercase">
          Fortuna
        </Link>
        <nav aria-label="Main" className="flex h-full items-stretch">
          <NavLink href="/" matches={["/", "/runs"]}>
            Runs
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
