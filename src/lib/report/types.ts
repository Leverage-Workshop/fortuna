// The run report's view model: what the page reads from the database for one run. Plain data,
// safe to pass from server to client components.

export type RunStatus = "pending" | "awaiting_approval" | "running" | "completed" | "failed" | "cancelled";

export type RunReport = {
  run: {
    id: string;
    status: RunStatus;
    eveSessionId: string | null;
    costUsd: number;
    startedAt: Date;
    finishedAt: Date | null;
  };
  scenario: {
    id: string;
    text: string;
    asOf: string;
    horizon: string | null;
    resolutionQuestion: string | null;
    contaminated: boolean;
  };
  /** Highest probability first. */
  forecasts: Array<{
    id: string;
    outcome: string;
    probability: number;
    baselineProbability: number | null;
    overrideReason: string | null;
  }>;
  /** In the order the agents finished. */
  agentOutputs: Array<{
    id: string;
    agentRole: string;
    model: string;
    inputTokens: number | null;
    outputTokens: number | null;
    costUsd: number | null;
    durationMs: number | null;
  }>;
  actors: Array<{ id: string; name: string; regimeType: string; profile: string | null }>;
  decisionPoints: Array<{
    id: string;
    label: string;
    position: number;
    actorNames: string[];
    options: Array<{ id: string; label: string; position: number }>;
  }>;
};

export type RunListItem = {
  id: string;
  status: RunStatus;
  startedAt: Date;
  scenarioText: string;
  asOf: string;
  contaminated: boolean;
};
