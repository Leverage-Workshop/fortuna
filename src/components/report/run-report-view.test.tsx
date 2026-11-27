import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, test } from "vitest";
import * as fx from "@/lib/fixtures/brexit";
import { REPORT_SECTIONS } from "@/lib/report/sections";
import type { RunReport } from "@/lib/report/types";
import { RunReportView } from "./run-report-view";

afterEach(cleanup);

const startedAt = new Date("2026-11-27T17:00:00Z");

/** The report loadRunReport returns for the seeded Brexit fixture. */
function brexitReport(): RunReport {
  return {
    run: {
      id: fx.BREXIT_RUN_ID,
      status: "completed",
      eveSessionId: null,
      costUsd: 0,
      startedAt,
      finishedAt: new Date(startedAt.getTime() + 10),
    },
    scenario: { ...fx.scenario },
    forecasts: fx.forecasts.map((f, i) => ({ id: `f${i}`, ...f })),
    agentOutputs: fx.agentOutputs.map((o, i) => ({
      id: `o${i}`,
      agentRole: o.agentRole,
      model: fx.FIXTURE_MODEL,
      inputTokens: null,
      outputTokens: null,
      costUsd: null,
      durationMs: null,
    })),
    actors: fx.actors.map(({ id, name, regimeType, profile }) => ({ id, name, regimeType, profile })),
    decisionPoints: fx.decisionPoints.map((dp) => ({
      id: dp.id,
      label: dp.label,
      position: dp.position,
      actorNames: dp.actorIds.map((id) => fx.actors.find((a) => a.id === id)!.name),
      options: dp.options.map(({ id, label, position }) => ({ id, label, position })),
    })),
  };
}

function emptyReport(): RunReport {
  return {
    ...brexitReport(),
    scenario: { ...fx.scenario, resolutionQuestion: null, horizon: null, contaminated: false },
    forecasts: [],
    agentOutputs: [],
    actors: [],
    decisionPoints: [],
  };
}

const section = (key: string) => {
  const el = document.getElementById(key);
  if (!el) throw new Error(`section ${key} not rendered`);
  return within(el);
};

describe("RunReportView", () => {
  test("renders every PRD report section, in order", () => {
    render(<RunReportView report={brexitReport()} />);
    const headings = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    expect(headings).toEqual(REPORT_SECTIONS.map((s) => s.title));
    expect(headings).toHaveLength(12);
  });

  test("unbuilt sections say which milestone builds them", () => {
    render(<RunReportView report={brexitReport()} />);
    expect(section("constraint-matrix").getByText("Not built yet (M2)")).toBeDefined();
    expect(section("decision-tree").getByText("Not built yet (M3)")).toBeDefined();
    expect(section("market-comparison").getByText("Not built yet (M5)")).toBeDefined();
    expect(section("resolution").getByText("Not built yet (M6)")).toBeDefined();
    expect(screen.getAllByText(/^Not built yet/)).toHaveLength(9);
    expect(screen.queryByText("No data for this run.")).toBeNull();
  });

  test("summary shows the question, as-of date, rounded probabilities and the contaminated flag", () => {
    render(<RunReportView report={brexitReport()} />);
    const summary = section("summary");
    expect(summary.getByText(fx.scenario.resolutionQuestion)).toBeDefined();
    expect(summary.getByText("1 Jul 2016")).toBeDefined();
    expect(summary.getByText("Contaminated · Not scored")).toBeDefined();
    expect(summary.getAllByText("Not scored")).toHaveLength(3);

    const outcomes = within(summary.getByRole("list", { name: "Outcome probabilities" })).getAllByRole("listitem");
    expect(outcomes.map((li) => li.textContent)).toEqual([
      expect.stringContaining("Exit with a withdrawal deal"),
      expect.stringContaining("No exit (delay or extension)"),
      expect.stringContaining("Exit with no deal"),
    ]);
    expect(["53%", "40%", "7%"].every((p) => summary.getByText(p))).toBe(true);
  });

  test("judge overrides keep their stated reason one click away", () => {
    render(<RunReportView report={brexitReport()} />);
    const summary = section("summary");
    expect(summary.getAllByText("Judge override")).toHaveLength(3);
    expect(summary.getAllByText(fx.JUDGE_OVERRIDE_REASON)[0]!.closest("details")).not.toBeNull();
  });

  test("run trace lists each agent with its model, and unrecorded usage as a dash", () => {
    render(<RunReportView report={brexitReport()} />);
    const trace = section("run-trace");
    const rows = trace.getAllByRole("row").slice(1);
    expect(rows).toHaveLength(10);
    expect(within(rows[0]!).getByRole("rowheader").textContent).toBe("scenario parser");
    expect(within(rows[0]!).getByText("fixture")).toBeDefined();
    expect(within(rows[0]!).getAllByText("—")).toHaveLength(4);
    expect(trace.getByText("$0.00")).toBeDefined();
    expect(trace.getByText("completed")).toBeDefined();
  });

  test("scenario breakdown lists actors with regime types and each decision point's options", () => {
    render(<RunReportView report={brexitReport()} />);
    const breakdown = section("scenario");
    expect(breakdown.getByText("House of Commons")).toBeDefined();
    expect(breakdown.getAllByText("democratic")).toHaveLength(4);
    expect(breakdown.getByText("UK Government · EU27")).toBeDefined();
    expect(breakdown.getByText("Second referendum or set the result aside")).toBeDefined();
    expect(breakdown.getByText("DP2")).toBeDefined();
  });

  test("built sections with no rows say 'No data for this run', distinct from unbuilt ones", () => {
    render(<RunReportView report={emptyReport()} />);
    expect(section("summary").getByText("No data for this run.")).toBeDefined();
    expect(section("run-trace").getByText("No data for this run.")).toBeDefined();
    expect(section("scenario").getByText("No data for this run.")).toBeDefined();
    expect(section("summary").getByText("Resolution question not set")).toBeDefined();
    expect(section("summary").queryByText("Contaminated · Not scored")).toBeNull();
    expect(section("constraint-matrix").queryByText("No data for this run.")).toBeNull();
  });

  test("a section marked built without a component still renders, as unbuilt", () => {
    const sections = REPORT_SECTIONS.map((s) => (s.key === "evidence-ledger" ? { ...s, built: true } : s));
    render(<RunReportView report={brexitReport()} sections={sections} />);
    expect(section("evidence-ledger").getByText("Not built yet (M2)")).toBeDefined();
  });
});
