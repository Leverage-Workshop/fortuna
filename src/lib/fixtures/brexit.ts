// The PRD's "Worked example: Brexit" as fixture data. Every agent output, score and probability
// here is illustrative (written to show the mechanics, not produced by a run), and the scenario
// is contaminated: the models already know the outcome, so it is never scored.
//
// IDs are fixed so seeding is idempotent and the report URL is stable. Imports use relative
// paths with `.ts` extensions so `scripts/seed-brexit.ts` can load this under plain Node.
import type { agentRole, constraintLens, regimeType } from "../db/schema/enums.ts";

type AgentRole = (typeof agentRole.enumValues)[number];
type Lens = (typeof constraintLens.enumValues)[number];
type RegimeType = (typeof regimeType.enumValues)[number];

const id = (n: number) => `b2e01600-0000-4000-8000-${n.toString().padStart(12, "0")}`;

export const BREXIT_SCENARIO_ID = id(1);
export const BREXIT_RUN_ID = id(2);

/** Model name recorded on fixture agent outputs: no model produced them. */
export const FIXTURE_MODEL = "fixture";

export const scenario = {
  id: BREXIT_SCENARIO_ID,
  text: "Will the UK formally leave the EU by 31 December 2020, and in what form?",
  asOf: "2016-07-01",
  horizon: "2020-12-31",
  resolutionQuestion: "UK is no longer an EU member state on 31 December 2020.",
  contaminated: true,
} as const;

export const actors: ReadonlyArray<{ id: string; name: string; regimeType: RegimeType; profile: string }> = [
  {
    id: id(101),
    name: "UK Government",
    regimeType: "democratic",
    profile:
      "Incoming Conservative leadership. David Cameron announced his resignation on 24 June 2016, and the leading successor candidate backed Remain.",
  },
  {
    id: id(102),
    name: "House of Commons",
    regimeType: "democratic",
    profile: "Most MPs backed Remain in the 23 June 2016 referendum, which Leave won with 51.9%.",
  },
  {
    id: id(103),
    name: "EU27",
    regimeType: "democratic",
    profile: "The European Commission and the Council of the 27 remaining member states.",
  },
  {
    id: id(104),
    name: "Ireland",
    regimeType: "democratic",
    profile: "The only EU member state that shares a land border with the UK.",
  },
];

const [ukGovernment, , eu27] = actors;

/** Constraint scores per option, in lens order political / economic / geopolitical / legal. */
type Scores = Readonly<Record<Lens, number>>;

export const decisionPoints: ReadonlyArray<{
  id: string;
  label: string;
  position: number;
  actorIds: string[];
  options: ReadonlyArray<{ id: string; label: string; position: number; scores: Scores }>;
}> = [
  {
    id: id(201),
    label: "Article 50 timing",
    position: 1,
    actorIds: [ukGovernment!.id],
    options: [
      {
        id: id(301),
        label: "Invoke Article 50 within 12 months",
        position: 1,
        scores: { political: 0, economic: 2, geopolitical: 1, legal: 1 },
      },
      {
        id: id(302),
        label: "Delay indefinitely",
        position: 2,
        scores: { political: 3, economic: 1, geopolitical: 2, legal: 0 },
      },
      {
        id: id(303),
        label: "Second referendum or set the result aside",
        position: 3,
        scores: { political: 4, economic: 0, geopolitical: 0, legal: 1 },
      },
    ],
  },
  {
    id: id(202),
    label: "Form of exit",
    position: 2,
    actorIds: [ukGovernment!.id, eu27!.id],
    options: [
      {
        id: id(304),
        label: "Exit with a withdrawal deal",
        position: 1,
        scores: { political: 1, economic: 1, geopolitical: 2, legal: 1 },
      },
      {
        id: id(305),
        label: "Exit with no deal",
        position: 2,
        scores: { political: 2, economic: 3, geopolitical: 3, legal: 1 },
      },
      {
        id: id(306),
        label: "Article 50 extended past the horizon",
        position: 3,
        scores: { political: 3, economic: 1, geopolitical: 1, legal: 2 },
      },
    ],
  },
];

/** Each constraint agent's illustrative finding (PRD step 2), reused as the rationale of its scores. */
export const lensFindings: Readonly<Record<Lens, string>> = {
  political: "17.4 million Leave votes; ignoring them is career-ending for any governing party.",
  economic: "Sterling hit its lowest level against the dollar since 1985; no-deal is the costliest path.",
  geopolitical: "EU27 holds the leverage and sets the sequencing; the Irish border constrains any no-deal path.",
  legal: "Article 50 sets a two-year clock; an extension needs unanimous EU27 approval.",
};

const lensRole: Readonly<Record<Lens, AgentRole>> = {
  political: "political_constraint",
  economic: "economic_constraint",
  geopolitical: "geopolitical_constraint",
  legal: "legal_constraint",
};

export const JUDGE_OVERRIDE_REASON =
  "Overrides decision point 1 to invoke 80% (baseline 73%), citing a new leader's early political capital and the UK Government's preference to be seen to deliver.";

/**
 * Outcome probabilities, rounded to four places. Baselines follow PRD step 4: per decision point,
 * weight ∝ e^(−0.5 × load) over surviving options (invoke 73.1% / delay 26.9%; deal 66.5%,
 * extension 24.5%, no deal 9.0%), chained across the two decision points. The final probabilities
 * apply the judge's override of decision point 1 to invoke 80%, so every outcome carries the reason.
 */
export const forecasts: ReadonlyArray<{
  outcome: string;
  probability: number;
  baselineProbability: number;
  overrideReason: string;
}> = [
  {
    outcome: "Exit with a withdrawal deal",
    probability: 0.5322,
    baselineProbability: 0.4863,
    overrideReason: JUDGE_OVERRIDE_REASON,
  },
  {
    outcome: "No exit (delay or extension)",
    probability: 0.3958,
    baselineProbability: 0.4479,
    overrideReason: JUDGE_OVERRIDE_REASON,
  },
  {
    outcome: "Exit with no deal",
    probability: 0.072,
    baselineProbability: 0.0658,
    overrideReason: JUDGE_OVERRIDE_REASON,
  },
];

/** Illustrative agent outputs (PRD step 2 and step 4), in the order the pipeline would produce them. */
export const agentOutputs: ReadonlyArray<{ agentRole: AgentRole; rationale: string; output: Record<string, unknown> }> = [
  {
    agentRole: "scenario_parser",
    rationale: "Four actors, two decision points with three options each, resolving on UK membership on 31 December 2020.",
    output: {
      actors: actors.map((a) => a.name),
      decisionPoints: decisionPoints.map((dp) => ({ label: dp.label, options: dp.options.map((o) => o.label) })),
      horizon: scenario.horizon,
      resolutionQuestion: scenario.resolutionQuestion,
    },
  },
  {
    agentRole: "actor",
    rationale: "Must be seen to deliver; prefers invoking, but on its own timetable.",
    output: { actor: "UK Government" },
  },
  {
    agentRole: "actor",
    rationale: "Large Remain majority; prefers delay or the softest possible exit.",
    output: { actor: "House of Commons" },
  },
  {
    agentRole: "actor",
    rationale: "Keep the single market's freedoms indivisible; deter other exits; no talks before Article 50.",
    output: { actor: "EU27" },
  },
  {
    agentRole: "actor",
    rationale: "No hard border on the island.",
    output: { actor: "Ireland" },
  },
  ...(Object.keys(lensFindings) as Lens[]).map((lens) => ({
    agentRole: lensRole[lens],
    rationale: lensFindings[lens],
    output: { lens },
  })),
  {
    agentRole: "judge",
    rationale: JUDGE_OVERRIDE_REASON,
    output: { overrides: [{ decisionPoint: 1, option: "Invoke Article 50 within 12 months", probability: 0.8 }] },
  },
];
