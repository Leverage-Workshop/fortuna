"use client";

import { useEffect } from "react";
import { Pill } from "@/components/ui/pill";

/** DESIGN.md §6.6 error state. Details go to the console, not the page. */
export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="flex flex-col items-start gap-4 rounded-card border border-pink p-4 sm:p-6">
      <Pill tone="pink">Failed</Pill>
      <p>This page couldn&apos;t load. The database may be unreachable.</p>
      <button
        type="button"
        onClick={() => retry()}
        className="min-h-11 rounded-feature bg-surface px-6 py-3 font-mono text-[12px] leading-none font-semibold tracking-[0.12em] text-ink-soft uppercase ring-ink transition-shadow duration-150 hover:ring-1"
      >
        Retry
      </button>
    </div>
  );
}
