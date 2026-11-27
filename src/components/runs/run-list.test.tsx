import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { RunList } from "./run-list";

afterEach(cleanup);

test("links each run to its report, flagging contaminated ones", () => {
  render(
    <RunList
      runs={[
        {
          id: "b2e01600-0000-4000-8000-000000000002",
          status: "completed",
          startedAt: new Date("2026-11-27T17:00:00Z"),
          scenarioText: "Will the UK formally leave the EU by 31 December 2020, and in what form?",
          asOf: "2016-07-01",
          contaminated: true,
        },
      ]}
    />,
  );
  const link = screen.getByRole("link", { name: /Will the UK formally leave/ });
  expect(link.getAttribute("href")).toBe("/runs/b2e01600-0000-4000-8000-000000000002");
  expect(screen.getByText("As of 1 Jul 2016")).toBeDefined();
  expect(screen.getByText("Contaminated · Not scored")).toBeDefined();
});

test("says so when there are no runs", () => {
  render(<RunList runs={[]} />);
  expect(screen.getByText("No runs yet.")).toBeDefined();
});
