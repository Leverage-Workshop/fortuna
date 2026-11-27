import { formatCount, formatDuration, formatTimestamp, formatUsd } from "@/lib/format";
import type { RunReport } from "@/lib/report/types";
import type { ReportSection } from "@/lib/report/sections";
import { Pill } from "@/components/ui/pill";
import { LABEL } from "@/components/ui/text";
import { NoData, SectionFrame } from "./report-section";

const roleLabel = (role: string) => role.replaceAll("_", " ");

export function RunTraceSection({ section, report }: { section: ReportSection; report: RunReport }) {
  const { run, agentOutputs } = report;
  const durationMs = run.finishedAt ? run.finishedAt.getTime() - run.startedAt.getTime() : null;

  return (
    <SectionFrame section={section} meta={<Pill>{roleLabel(run.status)}</Pill>}>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
        <Stat label="Started" value={formatTimestamp(run.startedAt)} />
        <Stat label="Finished" value={formatTimestamp(run.finishedAt)} />
        <Stat label="Duration" value={formatDuration(durationMs)} />
        <Stat label="Cost" value={formatUsd(run.costUsd)} />
        <Stat label="Trace" value={run.eveSessionId ?? "—"} />
      </dl>

      <div className="mt-8">
        {agentOutputs.length === 0 ? (
          <NoData />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-[14px]">
              <thead>
                <tr className={`bg-surface text-left text-ink-muted ${LABEL}`}>
                  <th scope="col" className="sticky left-0 bg-surface px-3 py-2 font-semibold">
                    Agent
                  </th>
                  <th scope="col" className="px-3 py-2 font-semibold">
                    Model
                  </th>
                  <NumHeader>Tokens in</NumHeader>
                  <NumHeader>Tokens out</NumHeader>
                  <NumHeader>Duration</NumHeader>
                  <NumHeader>Cost</NumHeader>
                </tr>
              </thead>
              <tbody>
                {agentOutputs.map((o) => (
                  <tr
                    key={o.id}
                    id={`agent-output-${o.id}`}
                    className="border-y border-hairline transition-colors duration-150 hover:border-ink"
                  >
                    <th scope="row" className={`sticky left-0 bg-canvas px-3 py-3 text-left ${LABEL}`}>
                      {roleLabel(o.agentRole)}
                    </th>
                    <td className="px-3 py-3 font-mono text-[14px] font-medium">{o.model}</td>
                    <NumCell>{formatCount(o.inputTokens)}</NumCell>
                    <NumCell>{formatCount(o.outputTokens)}</NumCell>
                    <NumCell>{formatDuration(o.durationMs)}</NumCell>
                    <NumCell>{formatUsd(o.costUsd)}</NumCell>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </SectionFrame>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className={`${LABEL} text-ink-muted`}>{label}</dt>
      <dd className="font-mono break-words text-[14px] font-medium tabular-nums">{value}</dd>
    </div>
  );
}

function NumHeader({ children }: { children: React.ReactNode }) {
  return (
    <th scope="col" className="px-3 py-2 text-right font-semibold">
      {children}
    </th>
  );
}

function NumCell({ children }: { children: React.ReactNode }) {
  return <td className="px-3 py-3 text-right font-mono text-[14px] font-medium tabular-nums">{children}</td>;
}
