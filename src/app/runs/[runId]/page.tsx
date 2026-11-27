import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getDb } from "@/lib/db/client";
import { loadRunReport } from "@/lib/report/load-run-report";
import { RunReportView } from "@/components/report/run-report-view";

type Props = { params: Promise<{ runId: string }> };

// One load per request, shared by generateMetadata and the page.
const getReport = cache((runId: string) => loadRunReport(getDb(), runId));

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { runId } = await props.params;
  const report = await getReport(runId);
  return { title: report ? `Run report · ${report.scenario.text} · Fortuna` : "Run not found · Fortuna" };
}

export default async function RunReportPage(props: Props) {
  const { runId } = await props.params;
  const report = await getReport(runId);
  if (!report) {
    notFound();
  }
  return <RunReportView report={report} />;
}
