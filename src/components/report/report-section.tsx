// The frame every report section sits in, plus the two absence states from DESIGN.md §6.6, which
// must never look alike: "Not built yet" (dashed, tagged) and "No data for this run" (plain).
import type { ReportSection } from "@/lib/report/sections";
import { Pill } from "@/components/ui/pill";
import { LABEL } from "@/components/ui/text";

export function SectionFrame({
  section,
  meta,
  feature = false,
  children,
}: {
  section: ReportSection;
  meta?: React.ReactNode;
  /** The forecast-summary feature tile (§6.5): ink border, larger radius and padding. */
  feature?: boolean;
  children: React.ReactNode;
}) {
  const frame = feature
    ? "rounded-feature border border-ink p-6 sm:p-8"
    : "rounded-card border border-hairline p-4 sm:p-6";
  return (
    <section id={section.key} aria-labelledby={`${section.key}-title`} className={`scroll-mt-8 ${frame}`}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 id={`${section.key}-title`} className={LABEL}>
          {section.title}
        </h2>
        {meta ? <div className="flex flex-wrap items-center gap-2 text-ink-muted">{meta}</div> : null}
      </div>
      {children}
    </section>
  );
}

export function UnbuiltSection({ section }: { section: ReportSection }) {
  return (
    <section
      id={section.key}
      aria-labelledby={`${section.key}-title`}
      className="scroll-mt-8 rounded-card border border-dashed border-ink-muted p-4 sm:p-6"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 id={`${section.key}-title`} className={`${LABEL} text-ink-muted`}>
          {section.title}
        </h2>
        <Pill>Not built yet ({section.builtIn})</Pill>
      </div>
      <p className="text-[14px] leading-[1.5] text-ink-muted">{section.shows}</p>
    </section>
  );
}

export function NoData() {
  return <p className="text-ink-muted">No data for this run.</p>;
}
