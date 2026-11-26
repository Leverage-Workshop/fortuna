# PRD: Fortuna — Study the constraints, not the prince

Nov 23, 2026 · @Caleb Sandfort

> "I hold it to be true that Fortune is the arbiter of one-half of our actions, but that she still leaves us to direct the other half, or perhaps a little less." — Niccolò Machiavelli, *The Prince*, chapter 25 (W. K. Marriott translation, 1908)

## Overview

Fortuna is a personal forecasting tool for geopolitical events that move markets, such as elections, trade disputes, sanctions and treaty talks. It applies the method from Marko Papic's *Geopolitical Alpha* (Wiley, 2020): predict what a government will do from the material limits on its choices, not from what its leaders say they want.

A team of AI agents breaks the user's scenario into actors and options, scores each option against political, economic, geopolitical and legal constraints, and produces a probability-weighted decision tree. The engine then compares those probabilities with live Kalshi and Polymarket prices. Where the two disagree, the gap is a potential edge, and every forecast is logged and scored when the event resolves.

**Problem.** Geopolitical forecasts are usually narrative: what leaders say they want, filtered through media framing. Papic's framework argues the opposite: preferences are optional and subject to constraints, while constraints are neither. Applying that discipline by hand is slow, and there is no record of whether it worked.

**Product.** The user enters a scenario and an as-of date. Agents separate what each actor *wants* from what each actor *can do*, score the material constraints on every option, prune what is infeasible, and output probabilities. Each forecast is linked to a matching Kalshi or Polymarket contract, logged, and scored when the event resolves.

**Why multi-agent.** The split is the method, not decoration:

- Preference agents and constraint agents are separate roles, so preferences cannot quietly override constraints.
- Constraint agents never see actor rhetoric or media narrative, which enforces the book's rule to ignore both.
- Each constraint type needs different data and tools (polls, bond yields, legal texts), so specialization is real.
- A separate judge has to reconcile them, which makes the reasoning auditable.

**Why build it.** Two reasons: a practical tool for checking geopolitical theses against market pricing, and a hands-on project for the Vercel AI stack (eve, AI Gateway, AI Elements).

## Goals and non-goals

The MVP succeeds if it produces an auditable forecast for a live scenario, links it to a market, and scores it on resolution.

**Goals**

1. Turn a free-text scenario into actors, decision points and options, confirmed by the user before analysis runs.
2. Score every option against four constraint types with cited evidence, and prune options that a binding constraint rules out.
3. Output a decision tree with probabilities, where every probability traces back to constraint scores.
4. Compare each forecast to a linked Kalshi or Polymarket contract and show the edge in percentage points.
5. Log every forecast and score it with Brier score once the market resolves.
6. Learning goal: exercise eve (subagents, durable runs, approvals, evals), AI Gateway routing, and AI Elements streaming UI.

**Non-goals**

- Automated or real-money trading. Paper positions only.
- Multi-user SaaS, auth beyond a single owner, or billing.
- Backtesting on historical events as proof the system works (see Risks: hindsight contamination).
- General news summarization or a chat assistant.
- Faithful reproduction of the book's text. The framework is encoded as an original rubric.

## Users and core use cases

The primary user is a single owner: a developer-trader who wants to test geopolitical theses against market pricing. A secondary audience is anyone reviewing the project as a portfolio piece.

| Use case | Trigger | What the user gets |
| --- | --- | --- |
| Run a live scenario | A geopolitical question with an open market contract | Decision tree, probabilities, edge vs market |
| Re-run on news | A material development (election result, court ruling, rate move) | New forecast version and a diff of which constraint scores moved |
| Review the track record | Weekly, or after resolutions | Brier score, calibration curve, paper P&L vs market |
| Inspect a forecast | Doubt about a number | Every constraint score with its cited evidence and the judge's reasoning |
| Teach the framework | Exploring a past event | A walkthrough run, clearly labeled as contaminated (not scored) |

## Framework encoding

The framework becomes four constraint lenses and one scoring rubric; preferences only break ties among options that survive. The lenses follow the book's hierarchy of constraints, highest first; formal legal rules give way when they collide with the others.

| Constraint (highest first) | Question it answers | Typical evidence |
| --- | --- | --- |
| Political | Can the leader stay in power? In democracies: voter sentiment, the median voter, political capital, the election calendar. In authoritarian systems: performance legitimacy tied to economic stability | Polls, approval, seat counts, election dates; growth, unemployment, unrest |
| Macroeconomic and financial | Can the economy absorb it? Debt, deficits, inflation, currency stability, trade and supply-chain dependence | FRED series, yields, FX, trade data |
| Geopolitical and geographic | Do geography and other states allow it? Terrain, resources, military capacity, alliances, balance of power | Energy and trade dependence, force posture, alliance commitments |
| Constitutional and legal | Is it formally possible? Courts, treaties, procedural clocks, veto points. Lowest in the hierarchy | Constitutions, treaty articles, court calendars |

**Scoring rubric.** Each constraint agent scores every option from 0 to 4, with at least one cited piece of evidence per score of 2 or higher.

| Score | Label | Meaning |
| --- | --- | --- |
| 0 | None | No meaningful restriction |
| 1 | Friction | Adds cost, does not change the choice |
| 2 | Costly | Actor pays a real price; choosing it needs strong preference |
| 3 | Severe | Only plausible under crisis or regime change |
| 4 | Binding | Infeasible within the scenario horizon |

**Aggregation rules**

1. Any score of 4 prunes the option, unless the judge cites evidence the constraint will loosen within the horizon.
2. Surviving options get a baseline weight proportional to e^(−k × load), computed in code, not by the model. k starts at 0.5 and is refit to minimize Brier score once about 30 live forecasts have resolved.
3. Preferences adjust weights only among options within one point of the lowest load.
4. The judge may override the baseline, but must state the override and its reason. Overrides are tracked and scored separately. A legal score of 4 never prunes on its own: the judge decides whether higher-order pressures would override the rule.

**Political lens by regime type.** The parser tags each actor as democratic, authoritarian or hybrid, and the user confirms it at the approval step. One political agent scores on the same 0 to 4 scale but works from the matching checklist:

- Democratic: the median voter, approval, political capital and the election calendar.
- Authoritarian: performance legitimacy, meaning whether the economic pain an option causes threatens the regime's hold on power.
- Hybrid: scored against both checklists; the higher score counts.

To avoid counting one downturn twice, the two lenses ask different questions. The economic lens asks whether the economy can absorb the option; the political lens asks whether the regime survives the pain.

## Agent architecture

Nine agent roles, and the key rule is what each one is not allowed to see. Every agent returns Zod-validated structured output; free text lives only in `rationale` fields.

| Agent | Sees | Does not see | Tools | Output |
| --- | --- | --- | --- | --- |
| Scenario parser | User scenario, as-of date | Nothing hidden | None | Actors, decision points, options, horizon, resolution question |
| Actor agent (one per actor) | Actor profile, stated positions up to as-of date | Constraint scores | Web search (date-bounded) | Ranked options with preference strength 0 to 4 |
| Political constraint | Options, actor list, as-of date | Actor rhetoric, media framing | Polls, election data, web search | Score 0 to 4 per option, evidence |
| Economic constraint | Same | Same | FRED, market data, web search | Same |
| Geopolitical constraint | Same | Same | Trade and energy data, web search | Same |
| Legal constraint | Same | Same | Legal and treaty sources, web search | Same |
| Consensus agent | Scenario, as-of date | All other agent outputs | News and analyst search | What markets and commentators expect, with sources |
| Judge | All of the above | Market price | None (aggregation in code) | Pruned tree, probabilities, overrides, key uncertainties |
| Market mapper | Final question, judge output | Nothing hidden | Kalshi and Polymarket market data | Matched contract, resolution-rule fit score, price, edge |

**Design rules**

- The judge never sees the market price, so the forecast cannot anchor on it. The mapper compares afterward.
- Constraint agents cannot read each other's output in the first pass; one optional cross-check round lets each revise once.
- Every tool whose results carry dates takes a cutoff, and the tool wrapper sets it from the run's as-of date; the model never chooses it. Structured sources filter exactly (FRED vintage data, poll datasets, market price history). Web search filters by publish date and drops undated results, which is best effort only. The models' own knowledge still leaks, so past-event runs stay flagged as contaminated and unscored. In live runs the cutoff is now, so the filter changes nothing.
- Model choice is per role through AI Gateway: a cheap model for parser and mapper, a stronger one for constraint agents and judge.

**How eve enforces this** (pattern from Vercel's Foreman template)

- Each role is a subagent in `agent/subagents/<role>/` with its own instructions, tools and output schema. Subagents start fresh sessions and inherit nothing from the orchestrator, so each works only from its brief.
- Long material moves as handoff documents: an agent writes a Markdown dossier to Postgres and returns its ID, and the next agent fetches it by ID. Dossiers never pass through the orchestrator's context.
- The read tool enforces isolation, not just the brief: each role's read tool returns only documents from author roles on its allowlist. Constraint agents cannot fetch actor dossiers, and the judge cannot fetch market data. Supabase row-level security enforces the same rule in the database: the tool wrapper signs a short-lived token carrying the caller's agent\_role, and a policy on handoff\_documents returns only rows whose author\_role is on that role's allowlist. Agent tools never use the service-role key, which bypasses row-level security.
- Subagents run in task mode: the output schema forces them to finish, so none can pause. The parse approval lives in the orchestrator, as a tool with `approval: always()`.
- The built-in agent tool is disabled, so the orchestrator can delegate only to the declared roles.
- One models file assigns every model. The judge uses a different vendor from the constraint agents, so their errors are less correlated.

## Tools and data sources

The MVP runs on free sources; open-source intelligence (OSINT) on shipping comes in through IMF PortWatch and Global Fishing Watch, with live vessel and flight feeds deferred. Each table lists the tools one role group gets, which is also that role's allowlist.

**Rules for every tool**

- Any tool whose results carry dates takes a cutoff, set by the wrapper from the run's as-of date. "Exact" means the source filters by date reliably; "best effort" means it can leak.
- Tools return signals against a baseline (for example, transits vs the 90-day average), not raw feeds. Agents reason over changes, not ship pings.
- Every result carries its source URL and retrieval time, so constraint scores can cite it.

**All roles**

| Tool | Source | Access | Cutoff | Phase |
| --- | --- | --- | --- | --- |
| `read_document` | Postgres handoff documents | Internal; filtered by the caller's allowlist | n/a | MVP |
| `write_document` | Postgres handoff documents | Internal | n/a | MVP |
| `get_brief` | Scenario, actors, options for this run | Internal | n/a | MVP |

**Political constraint**

| Tool | Source | Access | Cutoff | Phase |
| --- | --- | --- | --- | --- |
| `get_polls` | Wikipedia opinion-polling pages, parsed | Free | Exact, by fieldwork date | MVP |
| `get_election_calendar` | IFES ElectionGuide | Free | Exact | MVP |
| `get_regime_profile` | V-Dem dataset (regime type, institutions) | Free download, annual | Exact, by year | MVP |
| `get_unrest_events` | [ACLED](https://acleddata.com/api-documentation/getting-started) protests and riots | Free account, OAuth | Exact, by event date | MVP |
| `get_internet_outages` | IODA or Cloudflare Radar | Free | Exact | Later |

**Macroeconomic and financial constraint**

| Tool | Source | Access | Cutoff | Phase |
| --- | --- | --- | --- | --- |
| `get_series` | FRED, with ALFRED vintages | Free key | Exact, as published on the date | MVP |
| `get_country_macro` | IMF World Economic Outlook, World Bank | Free | Exact, by WEO release | MVP |
| `get_trade_flows` | UN Comtrade | Free tier, key | Best effort (data is revised) | MVP |
| `get_energy_flows` | US EIA API | Free key | Exact | Later |

**Geopolitical and geographic constraint (OSINT lives here)**

| Tool | Source | Access | Cutoff | Phase |
| --- | --- | --- | --- | --- |
| `get_chokepoint_transits` | [IMF PortWatch](https://portwatch.imf.org/pages/faqs): daily transits and trade volume at 28 chokepoints | Free, no key; lags a few days | Exact, by date | MVP |
| `get_vessel_activity` | [Global Fishing Watch API](https://api-doc.globalfishingwatch.org/): all vessel types, AIS gaps, encounters, loitering | Free key, non-commercial only | Exact, by date | MVP |
| `get_conflict_events` | ACLED battles and strikes; UCDP | Free account | Exact, by event date | MVP |
| `get_sanctions` | OpenSanctions, OFAC SDN list | Free for non-commercial use | Best effort (lists change) | MVP |
| `get_military_balance` | SIPRI military spending and arms transfers | Free download, annual | Exact, by year | Later |
| `get_live_vessels` | [aisstream.io](https://aisstream.io/documentation) WebSocket | Free key, beta, no SLA | Live only; needs our own collector for history | Later |
| `get_flight_activity` | [OpenSky Network](https://openskynetwork.github.io/opensky-api) | Free, non-commercial research | Exact (historical access on request) | Later |
| `get_fire_detections` | NASA FIRMS satellite fire data | Free key | Exact | Later |

**Constitutional and legal constraint**

| Tool | Source | Access | Cutoff | Phase |
| --- | --- | --- | --- | --- |
| `get_constitution` | Constitute Project | Free | Best effort (amendments) | MVP |
| `get_treaty` | UN Treaty Collection, EUR-Lex | Free | Best effort | MVP |
| `get_legislation_status` | Congress.gov API (US); web search elsewhere | Free key | Exact, by action date | Later |
| `get_court_docket` | CourtListener (US) | Free key | Exact, by filing date | Later |

**Actor, consensus and market roles**

| Tool | Used by | Source | Access | Cutoff | Phase |
| --- | --- | --- | --- | --- | --- |
| `search_news` | Actor, consensus | [GDELT DOC 2.0 API](https://www.gdeltproject.org/data.html) | Free, no key | Exact, by date seen | MVP |
| `web_search` | Actor, consensus, constraint agents | Exa, Tavily or Brave | Paid above free tier | Best effort | MVP |
| `search_contracts`, `get_contract_rules`, `get_price` | Market mapper | Kalshi and Polymarket public endpoints | Free, no key | n/a (live) | MVP |
| `get_price_history` | Market mapper, scoring job | Kalshi candlesticks, Polymarket price history | Free, no key | Exact | MVP |

The judge gets only `read_document`. Access terms were checked for PortWatch, Global Fishing Watch, aisstream.io, ACLED, OpenSky, GDELT, Kalshi and Polymarket; confirm the rest in M1. Several sources are licensed for non-commercial use only, which matters if this ever becomes a product.

## Run pipeline

One run is a single durable workflow with one human gate: nothing expensive starts until the user approves the parse.

&#91;embedded content: run pipeline · one approval gate, three parallel agent groups\]

Actor, constraint and consensus agents run side by side without seeing each other; the judge combines them, and only then does the mapper bring in the market price.

## Worked example: Brexit

Run as of 1 July 2016, a week after the referendum, the framework's top branch is a negotiated exit, because constraints overrule the Remain preferences of most of Parliament. All agent outputs and probabilities below are illustrative, written to show the mechanics; they are not a real run.

**Scenario input.** "Will the UK formally leave the EU by 31 December 2020, and in what form?" As-of date: 1 July 2016. Known facts at that date: Leave won 51.9% on 23 June; David Cameron announced his resignation on 24 June; most MPs and the leading successor candidate had backed Remain.

**Step 1: parser output (user approves before anything else runs)**

- Actors: UK Government (incoming Conservative leadership), House of Commons, EU27 (Commission and Council), Ireland.
- Decision point 1, UK Government: invoke Article 50 within 12 months · delay indefinitely · second referendum or set the result aside.
- Decision point 2, UK and EU27 jointly: exit with a withdrawal deal · exit with no deal · Article 50 extended past the horizon.
- Resolution question: UK is no longer an EU member state on 31 December 2020.

**Step 2: who gets what**

| Agent | Assignment in this run | Illustrative finding |
| --- | --- | --- |
| Actor: UK Government | State what the new leadership wants | Must be seen to deliver; prefers invoking, but on its own timetable |
| Actor: House of Commons | State what MPs want | Large Remain majority; prefers delay or the softest possible exit |
| Actor: EU27 | State what the bloc wants | Keep the single market's freedoms indivisible; deter other exits; no talks before Article 50 |
| Actor: Ireland | State what Dublin wants | No hard border on the island |
| Political constraint | Score options on survival and the median voter | 17.4 million Leave votes; ignoring them is career-ending for any governing party |
| Economic constraint | Score options on absorbable cost | Sterling hit its lowest level against the dollar since 1985; no-deal is the costliest path |
| Geopolitical constraint | Score options on what EU27 and Ireland will allow | EU27 holds the leverage and sets the sequencing; the Irish border constrains any no-deal path |
| Legal constraint | Score options on procedure | Article 50 sets a two-year clock; an extension needs unanimous EU27 approval |
| Consensus agent | Summarize what commentary and markets expect | Placeholder: filled from date-bounded news search in a real run |

**Step 3: constraint scores (0 = none, 4 = binding)**

| Option | Political | Economic | Geopolitical | Legal | Load |
| --- | --- | --- | --- | --- | --- |
| DP1: invoke within 12 months | 0 | 2 | 1 | 1 | 4 |
| DP1: delay indefinitely | 3 | 1 | 2 | 0 | 6 |
| DP1: second referendum or set aside | **4** | 0 | 0 | 1 | pruned |
| DP2: exit with a deal | 1 | 1 | 2 | 1 | 5 |
| DP2: exit with no deal | 2 | 3 | 3 | 1 | 9 |
| DP2: extended past horizon | 3 | 1 | 1 | 2 | 7 |

**Step 4: judge.** Code turns load into baseline weights (example rule: weight proportional to e^(−0.5 × load)), giving invoke 73% vs delay 27%, and deal 67%, extension 24%, no deal 9%. The judge overrides decision point 1 to invoke 80%, citing a new leader's early political capital and the UK Government's preference; the override is logged.

| Outcome by 31 Dec 2020 | Probability |
| --- | --- |
| Exit with a withdrawal deal | 53% |
| No exit (delay or extension) | 40% |
| Exit with no deal | 7% |

**Step 5: market comparison.** With an illustrative contract "UK leaves the EU by 31 Dec 2020" priced at 45¢, the engine says 60% (53 + 7), an edge of +15 points, which would be flagged.

**Outcome and caveat.** The UK left on 31 January 2020 under a withdrawal agreement, the engine's top branch. That proves nothing: the models already know the outcome, so this run teaches the mechanics and is never scored.

## Prediction market comparison and evaluation

Only forecasts made before the outcome is known count, and each one is judged against the market price at the moment it was made.

**Matching a contract.** The market mapper searches Kalshi and Polymarket for contracts on the scenario, reads each contract's resolution rules, and scores how well they match the engine's resolution question (0 to 1). Below 0.8, the user must confirm the match or rewrite the question to fit the contract. A forecast on a slightly different question is not comparable. When both venues list the same question, both prices are stored and the spread between them is shown beside the edge.

**Edge.** Edge = engine probability minus market mid price, in percentage points. A forecast is flagged when the absolute edge is at least 10 points (configurable) and the contract has enough volume to trust its price.

**Metrics**

| Metric | What it shows |
| --- | --- |
| Brier score, engine vs market | Whether the engine beats the price it disagreed with |
| Calibration curve | Whether 70% calls come true about 70% of the time |
| Paper P&L | Fixed stake on every flagged edge at the price then quoted |
| Override record | Whether judge overrides help or hurt vs the code baseline |
| Constraint attribution | Which lens drove the forecasts that were most wrong |

**Cadence.** A scheduled job snapshots linked market prices daily, checks for resolutions, and scores resolved forecasts. Re-runs create new forecast versions; every version is scored against its own timestamped market price.

**Honest limit.** Meaningful scores need dozens of resolved forecasts, which takes months. Until then the track record is anecdotal.

## Run report

Every run produces a report that shows how the forecast was reached, from the parsed scenario to the final probability. The report page ships in M1 with every section stubbed, and each milestone fills in its sections, so the report doubles as a progress view.

| Report section | What it shows | Data from | Filled at |
| --- | --- | --- | --- |
| Summary | Question, as-of date, outcome probabilities, contaminated flag | forecasts, scenarios | M1 (fixture), live at M3 |
| Run trace and cost | Agents run, models, tokens, duration, cost, link to the Agent Runs trace | runs, agent\_outputs | M1 |
| Scenario breakdown | Actors, regime types, decision points, options, and the user's edits at approval | actors, decision\_points, options | M1 |
| Constraint matrix | Option × lens scores; each score opens its rationale and evidence | constraint\_scores | M2 |
| Evidence ledger | Every tool call: tool, arguments, cutoff applied, result summary, source URL, retrieval time | tool\_calls | M2 |
| Handoff documents | Full text of each dossier, with author role and which roles were allowed to read it | handoff\_documents | M2 |
| Actor preferences | Each actor's ranked options and stated reasons | agent\_outputs | M3 |
| From scores to probabilities | Load per option, baseline weight with the k used, judge overrides and reasons, final probability | forecasts, agent\_outputs | M3 |
| Decision tree | The pruned tree with probabilities on each branch; pruned options shown struck through with the binding lens | forecasts, constraint\_scores | M3 |
| Consensus view | What commentators and markets expected, with sources | agent\_outputs | M3 |
| Market comparison | Matched contract, match score, price at forecast time, edge, spread between venues | market\_links, market\_snapshots | M5 |
| Resolution and score | Outcome, Brier score vs market, which lens was most wrong | forecasts | M6 |

**Rules**

- The report is a view over the database, never a generated document, so it cannot drift from the stored run. A Markdown export is available for sharing.
- Every number links to the row that produced it, and every evidence item links to its source.
- An unbuilt section says "Not built yet (M3)"; a built section with nothing to show says "No data for this run". The two are never confused.
- Re-runs of the same scenario can be compared side by side, showing which scores moved and why (after M6).

## Tech stack on Vercel

The stack is chosen so each Vercel AI piece does one clear job in the pipeline.

| Layer | Choice | Job in this project |
| --- | --- | --- |
| Agents | [eve 1.0](https://vercel.com/blog/eve-is-now-generally-available): one directory per role, instructions and skills in markdown, tools in TypeScript, subagents | Every agent role; an orchestrator agent calls the role subagents |
| Durability and approvals | eve on Vercel Workflows (built in) | Fan-out, checkpointed steps, pause for user approval of the parse |
| Structured output | Zod schemas in eve tools | Typed scores and trees |
| Evals | eve evals | Rubric consistency: same input, stable scores. Not forecast accuracy |
| Observability | Agent Runs traces | Each subagent's model calls, tool calls and cost |
| Models | [AI Gateway](https://vercel.com/kb/guide/ai-gateway-and-ai-sdk) | Per-role model choice, fallbacks, cost per run |
| App | Next.js App Router, with eve's framework integration | Scenario intake, run viewer, track record |
| UI | [AI Elements](https://elements.ai-sdk.dev/docs/guides) | Streaming each agent's progress and reasoning into the run view |
| Data | Supabase (Postgres) with Drizzle | Scenarios, runs, scores, forecasts, market snapshots, handoff documents |
| Schedules | Vercel Cron or eve scheduled tasks | Daily price snapshots, resolution checks, scoring |
| External data | Kalshi and Polymarket market data, FRED, a web search tool | Prices, economic series, date-bounded evidence |

eve fits because the project needs subagents, durable runs, approvals and evals together; Vercel's framework guide points to AI SDK agents only for single-request work. That guide calls eve's current release a 1.0 release candidate while the blog announces 1.0, so pin the version at install.

## Data model

Twelve tables; a forecast is immutable once written, so the record can't be quietly revised.

| Table | Key fields | Notes |
| --- | --- | --- |
| scenarios | id, text, as\_of, horizon, resolution\_question, contaminated | `contaminated` = true for past events; never scored |
| actors | id, scenario\_id, name, regime\_type, profile | From the parser, edited by the user |
| decision\_points | id, scenario\_id, actor\_ids, order | Joint decisions list several actors |
| options | id, decision\_point\_id, label |  |
| runs | id, scenario\_id, eve\_session\_id, status, cost\_usd, started\_at | One per execution |
| agent\_outputs | id, run\_id, agent\_role, model, output\_json, rationale | Raw structured output per agent |
| tool\_calls | id, run\_id, agent\_role, tool, args\_json, cutoff, result\_summary, source\_url, retrieved\_at | Feeds the report's evidence ledger |
| handoff\_documents | id, run\_id, author\_role, markdown, created\_at | Dossiers passed between agents by ID; reads filtered by the reader's allowlist of author roles, enforced by row-level security |
| constraint\_scores | run\_id, option\_id, lens, score, rationale, evidence\_tool\_call\_ids | One row per option per lens; evidence points at tool\_calls |
| forecasts | id, run\_id, outcome, probability, baseline\_probability, override\_reason, created\_at | Immutable |
| market\_links | scenario\_id, venue, contract\_id, match\_score, confirmed\_by\_user | Kalshi or Polymarket |
| market\_snapshots | contract\_id, ts, mid\_price, volume | Daily, plus one at forecast time |

Resolutions and scores can live as columns on `forecasts` (resolved\_at, outcome\_value, brier) until a separate table is needed.

## MVP scope and milestones

The MVP is a single-user app that runs one live scenario end to end and scores it; everything else waits. Each milestone ends with something runnable.

1. **M1: Skeleton.** Next.js app, Postgres schema, AI Gateway wired, parser agent with structured output, Brexit walkthrough as a fixture. Run report page with every section stubbed, rendering the fixture.
2. **M2: Constraint pass.** Four constraint agents run in parallel as eve subagents; scores and evidence stored; legal-score rule from the constraint hierarchy applied.
3. **M3: Judge and tree.** Actor agents, code-side aggregation, judge with logged overrides, decision tree rendered with AI Elements streaming.
4. **M4: Human approval.** The orchestrator's approval tool pauses the session after parsing until the user approves or edits actors and options.
5. **M5: Markets.** One venue adapter interface (search contracts, fetch resolution rules, fetch price), implemented read-only for Kalshi and international Polymarket through their public endpoints. Then the market mapper, match confirmation, edge display and daily snapshot cron. Polymarket US can be added later if it lists contracts the other two lack.
6. **M6: Scoring.** Resolution checks, Brier score, calibration curve, paper P&L page.

**Out of MVP:** consensus agent's media analysis beyond a basic search, cross-check round between constraint agents, scenario templates, sharing.

## Risks and open questions

The biggest risk is believing an unproven signal; the design answers it by scoring only live forecasts against timestamped prices.

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Hindsight contamination | Past-event runs look brilliant and mean nothing | `contaminated` flag; only live scenarios are scored |
| Poor LLM calibration | Probabilities are confident but arbitrary | Code-side baseline from scores; overrides logged and scored separately |
| Contract mismatch | Edge reflects a different question, not insight | Resolution-rule match score; user confirms below 0.8 |
| Thin markets | Price is noise; edge is meaningless | Minimum volume before an edge is flagged |
| Framework drift | The rubric stops reflecting the book's method | Check lenses against the text at M2; keep the rubric in one versioned file |
| Run cost | Nine agents plus web search per run adds up | Per-role models via AI Gateway; cost shown on every run |
| Stale evidence | Constraint scores built on old data | Evidence must carry dates; re-run on material news |

**Open questions**

None open. All four were settled on 25 November 2026 and are recorded in the sections above: regime-specific political checklists, a tunable baseline, Kalshi plus Polymarket, and cutoff-filtered tools.

## Sources

- Marko Papic, *Geopolitical Alpha: An Investment Framework for Predicting the Future* (Wiley, 2020); framework summaries at [Value Research](https://valueresearchonline.com/stories/50404/portfolio-positions-and-politics) and [CFA Institute](https://rpc.cfainstitute.org/blogs/enterprising-investor/2020/marko-papic-geopolitical-forecasting-in-volatile-times)
- [eve vs AI SDK agents vs WorkflowAgent](https://vercel.com/kb/guide/eve-vs-ai-sdk-agents-vs-workflowagent)
- [Foreman: eve software factory](https://vercel.com/kb/guide/eve-software-factory)
- [Introducing eve 1.0](https://vercel.com/blog/eve-is-now-generally-available)
- [Build AI agents with AI Gateway and AI SDK](https://vercel.com/kb/guide/ai-gateway-and-ai-sdk)
- [AI Elements](https://elements.ai-sdk.dev/docs/guides)
