import { connection } from "next/server";
import { getDb } from "@/lib/db/client";
import { listRuns } from "@/lib/report/load-run-report";
import { RunList } from "@/components/runs/run-list";
import { LABEL, PageTitle } from "@/components/ui/text";

export default async function Home() {
  await connection(); // runs change per request; never prerender this list at build time
  const runs = await listRuns(getDb());

  return (
    <div className="flex flex-col gap-12">
      <PageTitle eyebrow="Study the constraints, not the prince" wordmark>
        Fortuna
      </PageTitle>
      <section aria-labelledby="runs-title" className="flex flex-col gap-6">
        <h2 id="runs-title" className={LABEL}>
          Runs
        </h2>
        <RunList runs={runs} />
      </section>
    </div>
  );
}
