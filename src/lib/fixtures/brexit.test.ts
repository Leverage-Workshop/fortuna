import { describe, expect, test } from "vitest";
import { actors, agentOutputs, decisionPoints, forecasts, scenario } from "./brexit";

const LENSES = ["political", "economic", "geopolitical", "legal"] as const;

function load(scores: Record<(typeof LENSES)[number], number>) {
  return LENSES.reduce((sum, lens) => sum + scores[lens], 0);
}

/** PRD step 4: weight ∝ e^(−0.5 × load) over options with no score of 4. */
function baselineWeights(dp: (typeof decisionPoints)[number]) {
  const surviving = dp.options.filter((o) => !LENSES.some((lens) => o.scores[lens] === 4));
  const raw = surviving.map((o) => ({ label: o.label, w: Math.exp(-0.5 * load(o.scores)) }));
  const total = raw.reduce((sum, r) => sum + r.w, 0);
  return Object.fromEntries(raw.map((r) => [r.label, r.w / total]));
}

const byOutcome = (outcome: string) => forecasts.find((f) => f.outcome === outcome)!;

describe("Brexit fixture", () => {
  test("is a contaminated past-event scenario as of 1 July 2016", () => {
    expect(scenario.contaminated).toBe(true);
    expect(scenario.asOf).toBe("2016-07-01");
    expect(actors.map((a) => a.name)).toEqual(["UK Government", "House of Commons", "EU27", "Ireland"]);
  });

  test("matches the PRD's constraint table, loads and pruned option", () => {
    const loads = decisionPoints.flatMap((dp) => dp.options.map((o) => [o.label, load(o.scores)]));
    expect(Object.fromEntries(loads)).toEqual({
      "Invoke Article 50 within 12 months": 4,
      "Delay indefinitely": 6,
      "Second referendum or set the result aside": 5,
      "Exit with a withdrawal deal": 5,
      "Exit with no deal": 9,
      "Article 50 extended past the horizon": 7,
    });
    const pruned = decisionPoints[0]!.options[2]!;
    expect(pruned.scores.political).toBe(4);
  });

  test("baseline probabilities follow e^(−0.5 × load), chained across both decision points", () => {
    const dp1 = baselineWeights(decisionPoints[0]!);
    const dp2 = baselineWeights(decisionPoints[1]!);
    const invoke = dp1["Invoke Article 50 within 12 months"]!;
    expect(invoke).toBeCloseTo(0.731, 3);

    expect(byOutcome("Exit with a withdrawal deal").baselineProbability).toBeCloseTo(
      invoke * dp2["Exit with a withdrawal deal"]!,
      4,
    );
    expect(byOutcome("Exit with no deal").baselineProbability).toBeCloseTo(invoke * dp2["Exit with no deal"]!, 4);
    expect(byOutcome("No exit (delay or extension)").baselineProbability).toBeCloseTo(
      1 - invoke + invoke * dp2["Article 50 extended past the horizon"]!,
      4,
    );
  });

  test("final probabilities apply the judge's 80% override and round to the PRD's 53 / 40 / 7", () => {
    const dp2 = baselineWeights(decisionPoints[1]!);
    expect(byOutcome("Exit with a withdrawal deal").probability).toBeCloseTo(0.8 * dp2["Exit with a withdrawal deal"]!, 4);
    expect(forecasts.map((f) => Math.round(f.probability * 100))).toEqual([53, 40, 7]);
    expect(forecasts.every((f) => f.overrideReason.length > 0)).toBe(true);
  });

  test("probabilities and baselines each sum to 1", () => {
    expect(forecasts.reduce((s, f) => s + f.probability, 0)).toBeCloseTo(1, 6);
    expect(forecasts.reduce((s, f) => s + f.baselineProbability, 0)).toBeCloseTo(1, 6);
  });

  test("decision points reference fixture actors only", () => {
    const actorIds = new Set(actors.map((a) => a.id));
    expect(decisionPoints.every((dp) => dp.actorIds.every((a) => actorIds.has(a)))).toBe(true);
  });

  test("has one output per agent that ran: parser, four actors, four constraint agents, judge", () => {
    const roles = agentOutputs.map((o) => o.agentRole);
    expect(roles.filter((r) => r === "actor")).toHaveLength(4);
    expect(roles).toContain("scenario_parser");
    expect(roles).toContain("judge");
    expect(roles).toHaveLength(10);
  });
});
