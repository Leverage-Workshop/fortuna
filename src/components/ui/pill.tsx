// DESIGN.md §6.3. Accent fills always carry black text; outlined pills are hairline + muted.
const TONES = {
  yellow: "bg-yellow text-black",
  orange: "bg-orange text-black",
  pink: "bg-pink text-black",
  outline: "border border-hairline text-ink-muted",
} as const;

export function Pill({ tone = "outline", children }: { tone?: keyof typeof TONES; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-pill-sm px-2.5 py-1 font-mono text-[11px] leading-[1.3] font-semibold tracking-[0.12em] whitespace-nowrap uppercase ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}

/** The contaminated-run marker, shown on the summary and beside every probability. */
export function ContaminatedPill({ compact = false }: { compact?: boolean }) {
  return <Pill tone="yellow">{compact ? "Not scored" : "Contaminated · Not scored"}</Pill>;
}
