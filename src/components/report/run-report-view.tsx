import { REPORT_SECTIONS, type ReportSection } from "@/lib/report/sections";
import type { RunReport } from "@/lib/report/types";
import { PageTitle, LABEL } from "@/components/ui/text";
import { UnbuiltSection } from "./report-section";
import { RunTraceSection } from "./run-trace-section";
import { ScenarioSection } from "./scenario-section";
import { SummarySection } from "./summary-section";

type BuiltSection = (props: { section: ReportSection; report: RunReport }) => React.ReactNode;

/** Components for sections that are built; every other section renders as "Not built yet". */
const BUILT: Readonly<Record<string, BuiltSection>> = {
  summary: SummarySection,
  "run-trace": RunTraceSection,
  scenario: ScenarioSection,
};

/** The run report (PRD "Run report"): a view over one run's rows, with every section present. */
export function RunReportView({ report, sections = REPORT_SECTIONS }: { report: RunReport; sections?: readonly ReportSection[] }) {
  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col gap-4">
        <PageTitle eyebrow="Run report">{report.scenario.text}</PageTitle>
        <p className="font-mono text-[11px] leading-[1.2] font-medium tracking-[0.1em] text-ink-muted">
          <span className="uppercase">Run </span>
          {report.run.id}
        </p>
      </div>

      <div className="grid gap-12 lg:grid-cols-[200px_minmax(0,1fr)]">
        <nav aria-label="Report sections" className="hidden lg:block">
          <ol className="sticky top-8 flex flex-col gap-1">
            {sections.map((s) => (
              <li key={s.key}>
                <a
                  href={`#${s.key}`}
                  className={`flex min-h-11 items-center justify-between gap-2 text-[14px] leading-[1.5] transition-colors duration-150 hover:text-mint ${
                    s.built ? "text-ink-soft" : "text-ink-muted"
                  }`}
                >
                  <span>{s.title}</span>
                  {s.built ? null : <span className={LABEL}>{s.builtIn}</span>}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="flex min-w-0 flex-col gap-12 lg:gap-16">
          {sections.map((section) => {
            const Built = section.built ? BUILT[section.key] : undefined;
            return Built ? (
              <Built key={section.key} section={section} report={report} />
            ) : (
              <UnbuiltSection key={section.key} section={section} />
            );
          })}
        </div>
      </div>
    </div>
  );
}
