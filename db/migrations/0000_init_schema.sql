CREATE TYPE "public"."agent_role" AS ENUM('scenario_parser', 'actor', 'political_constraint', 'economic_constraint', 'geopolitical_constraint', 'legal_constraint', 'consensus', 'judge', 'market_mapper');--> statement-breakpoint
CREATE TYPE "public"."constraint_lens" AS ENUM('political', 'economic', 'geopolitical', 'legal');--> statement-breakpoint
CREATE TYPE "public"."regime_type" AS ENUM('democratic', 'authoritarian', 'hybrid');--> statement-breakpoint
CREATE TYPE "public"."run_status" AS ENUM('pending', 'awaiting_approval', 'running', 'completed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."venue" AS ENUM('kalshi', 'polymarket');--> statement-breakpoint
CREATE TABLE "market_links" (
	"scenario_id" uuid NOT NULL,
	"venue" "venue" NOT NULL,
	"contract_id" text NOT NULL,
	"match_score" double precision NOT NULL,
	"confirmed_by_user" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "market_links_pkey" PRIMARY KEY("scenario_id","venue","contract_id"),
	CONSTRAINT "market_links_match_score_range" CHECK ("market_links"."match_score" BETWEEN 0 AND 1)
);
--> statement-breakpoint
ALTER TABLE "market_links" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "market_snapshots" (
	"venue" "venue" NOT NULL,
	"contract_id" text NOT NULL,
	"ts" timestamp with time zone NOT NULL,
	"mid_price" double precision NOT NULL,
	"volume" double precision,
	CONSTRAINT "market_snapshots_pkey" PRIMARY KEY("venue","contract_id","ts"),
	CONSTRAINT "market_snapshots_mid_price_range" CHECK ("market_snapshots"."mid_price" BETWEEN 0 AND 1),
	CONSTRAINT "market_snapshots_volume_nonnegative" CHECK ("market_snapshots"."volume" IS NULL OR "market_snapshots"."volume" >= 0)
);
--> statement-breakpoint
ALTER TABLE "market_snapshots" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "agent_outputs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"agent_role" "agent_role" NOT NULL,
	"model" text NOT NULL,
	"output_json" jsonb NOT NULL,
	"rationale" text,
	"input_tokens" integer,
	"output_tokens" integer,
	"cost_usd" numeric(12, 6),
	"duration_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agent_outputs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "constraint_scores" (
	"run_id" uuid NOT NULL,
	"option_id" uuid NOT NULL,
	"lens" "constraint_lens" NOT NULL,
	"score" smallint NOT NULL,
	"rationale" text NOT NULL,
	"evidence_tool_call_ids" uuid[] DEFAULT '{}'::uuid[] NOT NULL,
	CONSTRAINT "constraint_scores_pkey" PRIMARY KEY("run_id","option_id","lens"),
	CONSTRAINT "constraint_scores_score_range" CHECK ("constraint_scores"."score" BETWEEN 0 AND 4)
);
--> statement-breakpoint
ALTER TABLE "constraint_scores" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "forecasts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"outcome" text NOT NULL,
	"probability" double precision NOT NULL,
	"baseline_probability" double precision,
	"override_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "forecasts_run_outcome_key" UNIQUE("run_id","outcome"),
	CONSTRAINT "forecasts_probability_range" CHECK ("forecasts"."probability" BETWEEN 0 AND 1),
	CONSTRAINT "forecasts_baseline_range" CHECK ("forecasts"."baseline_probability" IS NULL OR "forecasts"."baseline_probability" BETWEEN 0 AND 1),
	CONSTRAINT "forecasts_override_has_reason" CHECK ("forecasts"."baseline_probability" IS NULL OR "forecasts"."probability" = "forecasts"."baseline_probability" OR "forecasts"."override_reason" IS NOT NULL)
);
--> statement-breakpoint
ALTER TABLE "forecasts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "handoff_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"author_role" "agent_role" NOT NULL,
	"markdown" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "handoff_documents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scenario_id" uuid NOT NULL,
	"eve_session_id" text,
	"status" "run_status" DEFAULT 'pending' NOT NULL,
	"cost_usd" numeric(12, 6) DEFAULT 0 NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	CONSTRAINT "runs_cost_nonnegative" CHECK ("runs"."cost_usd" >= 0),
	CONSTRAINT "runs_finished_after_start" CHECK ("runs"."finished_at" IS NULL OR "runs"."finished_at" >= "runs"."started_at")
);
--> statement-breakpoint
ALTER TABLE "runs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "tool_calls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"agent_role" "agent_role" NOT NULL,
	"tool" text NOT NULL,
	"args_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"cutoff" timestamp with time zone,
	"result_summary" text,
	"source_url" text,
	"retrieved_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tool_calls" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "actors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scenario_id" uuid NOT NULL,
	"name" text NOT NULL,
	"regime_type" "regime_type" NOT NULL,
	"profile" text,
	CONSTRAINT "actors_scenario_name_key" UNIQUE("scenario_id","name")
);
--> statement-breakpoint
ALTER TABLE "actors" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "decision_points" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scenario_id" uuid NOT NULL,
	"label" text NOT NULL,
	"actor_ids" uuid[] NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "decision_points_scenario_position_key" UNIQUE("scenario_id","position"),
	CONSTRAINT "decision_points_actor_ids_nonempty" CHECK (cardinality("decision_points"."actor_ids") >= 1)
);
--> statement-breakpoint
ALTER TABLE "decision_points" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"decision_point_id" uuid NOT NULL,
	"label" text NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "options_decision_point_position_key" UNIQUE("decision_point_id","position")
);
--> statement-breakpoint
ALTER TABLE "options" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "scenarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"text" text NOT NULL,
	"as_of" date NOT NULL,
	"horizon" date,
	"resolution_question" text,
	"contaminated" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "scenarios" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "market_links" ADD CONSTRAINT "market_links_scenario_id_scenarios_id_fk" FOREIGN KEY ("scenario_id") REFERENCES "public"."scenarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_outputs" ADD CONSTRAINT "agent_outputs_run_id_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "constraint_scores" ADD CONSTRAINT "constraint_scores_run_id_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "constraint_scores" ADD CONSTRAINT "constraint_scores_option_id_options_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."options"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forecasts" ADD CONSTRAINT "forecasts_run_id_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."runs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "handoff_documents" ADD CONSTRAINT "handoff_documents_run_id_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "runs" ADD CONSTRAINT "runs_scenario_id_scenarios_id_fk" FOREIGN KEY ("scenario_id") REFERENCES "public"."scenarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_calls" ADD CONSTRAINT "tool_calls_run_id_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "actors" ADD CONSTRAINT "actors_scenario_id_scenarios_id_fk" FOREIGN KEY ("scenario_id") REFERENCES "public"."scenarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decision_points" ADD CONSTRAINT "decision_points_scenario_id_scenarios_id_fk" FOREIGN KEY ("scenario_id") REFERENCES "public"."scenarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "options" ADD CONSTRAINT "options_decision_point_id_decision_points_id_fk" FOREIGN KEY ("decision_point_id") REFERENCES "public"."decision_points"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agent_outputs_run_id_idx" ON "agent_outputs" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "constraint_scores_option_id_idx" ON "constraint_scores" USING btree ("option_id");--> statement-breakpoint
CREATE INDEX "handoff_documents_run_author_idx" ON "handoff_documents" USING btree ("run_id","author_role");--> statement-breakpoint
CREATE INDEX "runs_scenario_id_idx" ON "runs" USING btree ("scenario_id");--> statement-breakpoint
CREATE INDEX "tool_calls_run_id_idx" ON "tool_calls" USING btree ("run_id");