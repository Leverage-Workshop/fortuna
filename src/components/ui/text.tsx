// Type roles from DESIGN.md §4 that recur across pages.

/** Mono UPPER label for kickers, table headers and metadata. */
export const LABEL = "font-mono text-[11px] leading-[1.3] font-semibold tracking-[0.12em] uppercase";

/** The whisper/shout pair: a tracked 300-weight eyebrow above a display title. Once per page, at the top. */
export function PageTitle({ eyebrow, children, wordmark = false }: { eyebrow: string; children: React.ReactNode; wordmark?: boolean }) {
  return (
    <header className="flex flex-col gap-3">
      <p className="text-[18px] leading-[1.2] font-light tracking-[0.1em] text-ink-muted uppercase">{eyebrow}</p>
      <h1
        className={
          wordmark
            ? "font-display text-[48px] leading-[0.95] tracking-[0.01em] uppercase sm:text-[72px]"
            : "font-display text-[36px] leading-[0.95] tracking-[0.01em] sm:text-[48px]"
        }
      >
        {children}
      </h1>
    </header>
  );
}
