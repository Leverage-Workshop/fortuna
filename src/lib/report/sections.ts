// The run report's sections, in the PRD's order ("Run report" table). `builtIn` is the milestone
// that fills the section; sections from later milestones render as "Not built yet (Mn)". When a
// feature builds a section, set `built: true` here and give it a component in RunReportView.

export type Milestone = "M1" | "M2" | "M3" | "M4" | "M5" | "M6";

export type ReportSection = {
  key: string;
  title: string;
  /** What the section shows once built: the PRD's "What it shows" column. */
  shows: string;
  builtIn: Milestone;
  built: boolean;
};

export const REPORT_SECTIONS: readonly ReportSection[] = [
  {
    key: "summary",
    title: "Summary",
    shows: "Question, as-of date, outcome probabilities and the contaminated flag.",
    builtIn: "M1",
    built: true,
  },
  {
    key: "run-trace",
    title: "Run trace and cost",
    shows: "Agents run, models, tokens, duration, cost and a link to the Agent Runs trace.",
    builtIn: "M1",
    built: true,
  },
  {
    key: "scenario",
    title: "Scenario breakdown",
    shows: "Actors, regime types, decision points and options.",
    builtIn: "M1",
    built: true,
  },
  {
    key: "constraint-matrix",
    title: "Constraint matrix",
    shows: "Option × lens scores; each score opens its rationale and evidence.",
    builtIn: "M2",
    built: false,
  },
  {
    key: "evidence-ledger",
    title: "Evidence ledger",
    shows: "Every tool call: tool, arguments, cutoff applied, result summary, source URL and retrieval time.",
    builtIn: "M2",
    built: false,
  },
  {
    key: "handoff-documents",
    title: "Handoff documents",
    shows: "Full text of each dossier, with its author role and which roles were allowed to read it.",
    builtIn: "M2",
    built: false,
  },
  {
    key: "actor-preferences",
    title: "Actor preferences",
    shows: "Each actor's ranked options and stated reasons.",
    builtIn: "M3",
    built: false,
  },
  {
    key: "scores-to-probabilities",
    title: "From scores to probabilities",
    shows: "Load per option, baseline weight with the k used, judge overrides and reasons, and the final probability.",
    builtIn: "M3",
    built: false,
  },
  {
    key: "decision-tree",
    title: "Decision tree",
    shows: "The pruned tree with probabilities on each branch; pruned options struck through with the binding lens.",
    builtIn: "M3",
    built: false,
  },
  {
    key: "consensus",
    title: "Consensus view",
    shows: "What commentators and markets expected, with sources.",
    builtIn: "M3",
    built: false,
  },
  {
    key: "market-comparison",
    title: "Market comparison",
    shows: "Matched contract, match score, price at forecast time, edge and the spread between venues.",
    builtIn: "M5",
    built: false,
  },
  {
    key: "resolution",
    title: "Resolution and score",
    shows: "Outcome, Brier score vs market, and which lens was most wrong.",
    builtIn: "M6",
    built: false,
  },
];
