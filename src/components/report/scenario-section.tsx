import type { RunReport } from "@/lib/report/types";
import type { ReportSection } from "@/lib/report/sections";
import { Pill } from "@/components/ui/pill";
import { LABEL } from "@/components/ui/text";
import { NoData, SectionFrame } from "./report-section";

/** The parser's breakdown: actors with regime types, then decision points and their options. */
export function ScenarioSection({ section, report }: { section: ReportSection; report: RunReport }) {
  const { actors, decisionPoints } = report;
  const meta = (
    <span className={`${LABEL} tabular-nums`}>
      {actors.length} actors · {decisionPoints.length} decision points
    </span>
  );

  if (actors.length === 0 && decisionPoints.length === 0) {
    return (
      <SectionFrame section={section}>
        <NoData />
      </SectionFrame>
    );
  }

  return (
    <SectionFrame section={section} meta={meta}>
      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <h3 className="mb-4 text-[20px] leading-[1.15] font-bold">Actors</h3>
          <ul className="flex flex-col">
            {actors.map((a) => (
              <li key={a.id} id={`actor-${a.id}`} className="flex flex-col gap-2 border-t border-hairline py-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-bold">{a.name}</span>
                  <Pill>{a.regimeType}</Pill>
                </div>
                {a.profile ? (
                  <p className="font-serif text-[17px] leading-[1.55] tracking-[-0.01em] text-ink-soft">{a.profile}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-[20px] leading-[1.15] font-bold">Decision points</h3>
          <ol className="flex flex-col">
            {decisionPoints.map((dp) => (
              <li key={dp.id} id={`decision-point-${dp.id}`} className="flex flex-col gap-3 border-t border-hairline py-4">
                <div className="flex flex-wrap items-baseline gap-3">
                  <span className={`${LABEL} text-ink-muted tabular-nums`}>DP{dp.position}</span>
                  <span className="font-bold">{dp.label}</span>
                </div>
                <p className={`${LABEL} text-ink-muted`}>{dp.actorNames.join(" · ")}</p>
                <ol className="flex flex-col gap-2">
                  {dp.options.map((o) => (
                    <li key={o.id} id={`option-${o.id}`} className="flex gap-3 text-[16px] leading-[1.6]">
                      <span className="w-5 shrink-0 font-mono text-[14px] font-medium text-ink-muted tabular-nums">
                        {o.position}.
                      </span>
                      <span>{o.label}</span>
                    </li>
                  ))}
                </ol>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </SectionFrame>
  );
}
