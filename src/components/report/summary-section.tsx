import { formatDate, formatPercent } from "@/lib/format";
import type { RunReport } from "@/lib/report/types";
import type { ReportSection } from "@/lib/report/sections";
import { ContaminatedPill } from "@/components/ui/pill";
import { LABEL } from "@/components/ui/text";
import { NoData, SectionFrame } from "./report-section";

/** The forecast summary feature tile (DESIGN.md §6.5). Market price and edge arrive with M5. */
export function SummarySection({ section, report }: { section: ReportSection; report: RunReport }) {
  const { scenario, forecasts } = report;
  return (
    <SectionFrame section={section} feature meta={scenario.contaminated ? <ContaminatedPill /> : null}>
      <p className="text-[18px] leading-[1.2] font-light tracking-[0.1em] uppercase">
        {scenario.resolutionQuestion ?? <span className="text-ink-muted">Resolution question not set</span>}
      </p>
      <dl className={`mt-4 flex flex-wrap gap-x-6 gap-y-2 ${LABEL} tabular-nums`}>
        <div className="flex gap-2">
          <dt className="text-ink-muted">As of</dt>
          <dd>{formatDate(scenario.asOf)}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-ink-muted">Horizon</dt>
          <dd>{formatDate(scenario.horizon)}</dd>
        </div>
      </dl>

      <div className="mt-8">
        {forecasts.length === 0 ? (
          <NoData />
        ) : (
          <ul className="flex flex-col gap-6" aria-label="Outcome probabilities">
            {forecasts.map((f) => (
              <OutcomeRow key={f.id} forecast={f} contaminated={scenario.contaminated} />
            ))}
          </ul>
        )}
      </div>
    </SectionFrame>
  );
}

function OutcomeRow({ forecast, contaminated }: { forecast: RunReport["forecasts"][number]; contaminated: boolean }) {
  const overridden = forecast.overrideReason !== null;
  return (
    <li id={`forecast-${forecast.id}`} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <span className="text-[16px] leading-[1.6]">{forecast.outcome}</span>
        <div className="flex items-center gap-3">
          {contaminated ? <ContaminatedPill compact /> : null}
          <span
            className={`font-mono text-[32px] leading-none font-semibold tracking-[-0.02em] tabular-nums sm:text-[40px] ${
              overridden ? "rounded-tag border border-yellow px-2 py-1" : ""
            }`}
          >
            {formatPercent(forecast.probability)}
          </span>
        </div>
      </div>
      <div className="h-1.5 rounded-tag bg-surface" aria-hidden="true">
        <div className="h-full rounded-tag bg-mint" style={{ width: `${forecast.probability * 100}%` }} />
      </div>
      {overridden ? (
        <details className="group">
          <summary className={`flex min-h-11 cursor-pointer items-center ${LABEL} text-yellow`}>Judge override</summary>
          <p className="font-serif text-[17px] leading-[1.55] tracking-[-0.01em] text-ink-soft">{forecast.overrideReason}</p>
        </details>
      ) : null}
    </li>
  );
}
