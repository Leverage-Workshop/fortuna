import Link from "next/link";
import { formatDate, formatTimestamp } from "@/lib/format";
import type { RunListItem } from "@/lib/report/types";
import { ContaminatedPill, Pill } from "@/components/ui/pill";
import { LABEL } from "@/components/ui/text";

/** Recent runs, each linking to its report. Clickable cards change only border and title (§6.4). */
export function RunList({ runs }: { runs: RunListItem[] }) {
  if (runs.length === 0) {
    return <p className="text-ink-muted">No runs yet.</p>;
  }
  return (
    <ul className="flex flex-col gap-4">
      {runs.map((run) => (
        <li key={run.id}>
          <Link
            href={`/runs/${run.id}`}
            className="group flex flex-col gap-3 rounded-card border border-hairline p-4 transition-colors duration-150 hover:border-ink sm:p-6"
          >
            <span className="text-[20px] leading-[1.15] font-bold transition-colors duration-150 group-hover:text-mint">
              {run.scenarioText}
            </span>
            <span className={`flex flex-wrap items-center gap-x-4 gap-y-2 text-ink-muted tabular-nums ${LABEL}`}>
              <span>As of {formatDate(run.asOf)}</span>
              <span>Started {formatTimestamp(run.startedAt)}</span>
              <Pill>{run.status.replaceAll("_", " ")}</Pill>
              {run.contaminated ? <ContaminatedPill /> : null}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
