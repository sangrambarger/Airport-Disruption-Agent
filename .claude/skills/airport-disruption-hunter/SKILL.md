---
name: airport-disruption-hunter
description: Recall-first OSINT researcher for airport operational disruptions — closures, runway/ATC/radar failures, strikes and labour action, cargo terminal disruption, security incidents, customs delays, and weather impact — with a focus on cargo/supply-chain relevance. Use whenever the user asks to check, monitor, hunt, or research airport disruptions or operational risk, strikes/industrial action affecting an airport or cargo, "what's going on at [airport/IATA code]", or wants an EventWatch-style exhaustive signal hunt across official, regional, labour, aviation, cargo, and multilingual sources — even if they never say "disruption" and just name an airport and ask if there are issues. Do not use for general flight-status/delay lookups for a single passenger itinerary with no operational or cargo angle.
---

# Airport Disruption Signal Hunter

Ported from the Antigravity "Airport Disruption Signal Hunter Agent" pack. Ancestor design docs
(`00`-`14` at the repo root) are Google Antigravity `/goal` instructions — this skill re-expresses
the same design as Claude Code tool usage.

## Mission

Hunt for early global airport disruption signals that may affect cargo movement, logistics
continuity, airport operations, aviation infrastructure, or supply-chain flow. This is a
signal-discovery task, not an answer-generation one: the goal is to find every credible early
signal, not to stop once a plausible answer exists.

## Core philosophy

- **Discovery is recall-first.** Capture weak-but-credible signals rather than filtering them out
  early — local reports, union notices, and airport advisories often surface a disruption before
  international media does. Don't stop after finding 3-4 good sources.
- **Classification is precision-first.** Only after discovery, decide what's actually worth
  surfacing. Reason from operational consequences (does availability, cargo throughput, or
  customs clearance actually drop?), not from keyword matches — a radar failure, a storm, a
  ground-handling strike, and a security evacuation can all produce the same operational outcome.
- **Don't rely on English or international media alone.** Local-language, regional, and
  official-source signals are often the earliest and most concrete.

## Workflow

1. **Scope the hunt.** Identify the airport(s)/region, IATA/ICAO codes, local name variants,
   relevant languages, and whether this is a fresh sweep or a follow-up on an existing signal.
2. **Discovery.** Search across source buckets (official, aviation authority, labour/union, cargo,
   airline, local-language news, weather, security) using both English and local-language queries.
   See `references/source-strategy.md` and `references/query-development.md`.
3. **Record every candidate signal** in the shape defined by
   `assets/signal-ledger-schema.json` — even ones you're not sure matter yet.
4. **Deduplicate and cluster.** Match signals across languages/titles by airport, approximate
   date, cause, and affected service — not by title text alone. See
   `references/dedup-clustering.md`.
5. **Classify and check already-sent status.** Assign a workflow status and decide whether to
   surface it. See "Classification statuses" below and `references/reference-examples.md` for
   calibration.
6. **Report.** Return structured output per `assets/output-schemas.json` — never prose-only.

## Tool mapping

The original pack assumes Antigravity's subagent primitive; in Claude Code, map roles onto
available tools:

- **WebSearch** is the primary discovery tool for each search cycle — run both natural-language
  and exact-phrase/dork-style queries (`references/query-development.md`).
- **WebFetch** verifies specific pages surfaced by search (airport authority status pages,
  NOTAMs, union bulletins) rather than trusting a headline alone.
- **Agent tool**, when available, parallelizes discovery: spawn one agent per source-bucket or
  per language (see `references/subagent-roles.md` for the role breakdown and the structured
  fields each one must return), then merge their findings before deduplication. If subagents
  aren't available or the hunt is narrow (one airport, one language), work the buckets
  sequentially instead — the discipline matters more than the parallelism.
- Treat any bundled reference file as loaded **on demand**: pull in the one relevant to the step
  you're on rather than reading all of them up front.

## Candidate signal criteria

Treat any credible mention of the following as a candidate signal worth capturing during
discovery (non-exhaustive — reason from operational consequence, not this list alone):

closure/partial closure · runway closure or restriction · suspended departures/arrivals ·
ATC/radar/navigation/cyber/IT failure · ground handling or refuelling disruption · cargo terminal
or freight disruption · customs/cargo-security disruption · security incident or evacuation ·
strike, strike threat, walkout, or industrial-action notice · weather disrupting operations ·
fire/accident/gas leak/infrastructure damage · mass cancellations or diversions tied to an
airport-level issue · access disruption affecting operations or cargo · reopening/recovery
("operations resumed", "strike called off").

## Reference files

Load only what the current step needs:

| File | Load when... |
|---|---|
| `references/source-strategy.md` | building the source list for a hunt — the 11 source buckets and what to look for in each |
| `references/query-development.md` | generating search queries — natural-language, exact-match, dork-style, and follow-up-expansion patterns |
| `references/multilingual-map.md` | deciding which languages to search per country/region |
| `references/subagent-roles.md` | parallelizing discovery with the Agent tool — per-role focus and required output fields |
| `references/dedup-clustering.md` | merging findings — event-fingerprint matching and meaningful-update vs. duplicate calls |
| `references/reference-examples.md` | calibrating whether a signal is strong or weak |
| `references/research-playbook.md` | deeper EventWatch-style research/escalation guidance — note: this file cross-references `research-playbooks.md` and `governance/threshold-rulebook.md` from a broader EventWatch repo that isn't part of this pack, so some pointers in it won't resolve here |
| `references/event-fingerprinting.md` | assigning a stable `canonical_event_id`, or stamping `first_detected_at`/`last_updated_at` when appending to the ledger |

## Configuration

This skill is scope-agnostic by design — a new deployment should only ever need to edit
`assets/config.json`, never the skill or workflow logic itself:

- `assets/config.json` — region scope (global or a specific list), cadence targets, delivery
  destination(s), feature flags (flight-tracking API, verification pass), and a pointer to
  `assets/cargo-hub-tiers.json`.
- `assets/cargo-hub-tiers.json` — airport criticality tiers (by cargo throughput/role, not
  passenger volume) used to weight impact. Not exhaustive; extend freely — an airport missing
  from it is treated as the lowest tier by default.

If `config.json`'s `scope.mode` is `"regions"`, pass its `scope` object as
`Workflow({ name: "airport-disruption-hourly-sweep", args: { regionScope: config.scope } })` —
the workflow script reads `args.regionScope` and restricts every discovery bucket's prompt to it.
Leaving `scope.mode` as `"global"` (the default) or omitting `args` entirely searches unrestricted.

## Output contract

Always structure findings using the schemas in `assets/output-schemas.json`:

- `candidate_signal_output` — one per raw finding during discovery
- `classified_event_output` — one per clustered event after classification
- `search_cycle_summary` — one per hunt, summarizing what was searched and found

When maintaining a running ledger across multiple hunts/cycles, persist entries using
`assets/signal-ledger-schema.json`. Use `assets/service-dependency-graph.json` to judge how a
disrupted airport service (ground handling, refuelling, cargo handling, customs, ATC/radar,
runway ops, IT/cyber) propagates to operational and cargo impact.

`classified_event_output` (schema v2) carries a typed `impact` block — `flights_cancelled`,
`flights_delayed`, `passengers_affected`, `duration_days`, `cargo_confirmed`,
`cargo_relevance_level` — alongside the narrative `operational_impact` and
`cargo_or_logistics_relevance` fields. Populate `impact` from real evidence only, leaving a field
`null` rather than guessing; set `extraction_method: "agent_reported"` (a migration backfilling
older entries from text is the only place `"heuristic_backfill"` belongs). `cargo_relevance_level`
is what drives the cargo-first triage sort downstream — get it right: `"direct"` only for
explicit freighter/belly-cargo/cargo-terminal/cargo-workforce involvement, `"possible"` for
plausible-but-unconfirmed exposure, `"none"` otherwise.

## Classification statuses

Assign exactly one workflow status per clustered event. **Cargo/logistics relevance is one lens,
not the only one that makes an event reportable.** An event also clears the bar on real
operational/flight-count impact, on a recurring pattern at the same airport, or (at `monitor`
level) on credible-but-unconfirmed risk — don't discard something as noise just because it's
passenger-only or not yet officially confirmed:

- `new_event` — a disruption not previously captured that clears the bar on any of: confirmed
  cargo/logistics impact; real operational/flight-count impact at meaningful scale (dozens of
  flights cancelled/diverted/grounded, not a single flight); or a materialized instance of a
  recurring pattern at an airport worth tracking going forward.
- `meaningful_update` — existing event, but new evidence changes the risk picture (status change,
  duration change, cargo impact confirmed, escalation/de-escalation, scale materially increased)
- `duplicate` — repeats a known event with no material new information
- `monitor` — not yet at reportable scale, but worth tracking: an unresolved dispute or strike
  threat with no confirmed date, an early instance of a pattern that may be forming (e.g. a
  second weather ground-stop at the same airport in as many days), or a report pending official
  confirmation
- `noise` — genuinely trivial: a single flight affected with no pattern or escalation risk, an
  incident resolved with no lasting operational effect, or a hoax/false alarm with no measurable
  disruption

Only `new_event` and `meaningful_update` are normally worth surfacing prominently; `monitor` is
held pending more evidence or escalation; `duplicate` and `noise` are not surfaced as new items.

## Scheduled operation

For ad hoc hunts (a user asks about a specific airport or region right now), follow the workflow
above directly with WebSearch/WebFetch/Agent.

For **standing, recurring monitoring** ("keep watching", "check every hour"), this repo ships two
runnable Workflows instead of one — a fast, narrow pass and a slow, recall-complete pass, run on
separate schedules rather than forcing one workflow shape to do both jobs:

- `.claude/workflows/airport-disruption-flash-pass.js` — airport authority, civil
  aviation/regulator, airline operations, and weather/emergency only (the buckets official/fast
  sources update within). Recency-bounded to `args.sinceTimestamp` (the last successful flash
  pass) rather than a fixed window, with a 2-hour fallback if that's not supplied.
- `.claude/workflows/airport-disruption-deep-pass.js` — all seven buckets from
  `references/subagent-roles.md`, including labour/union, cargo/logistics, and local-language
  news — the recall-complete sweep and the actual edge over media-monitoring tools. Recency-bounded
  the same way, with a 10-hour fallback, but explicitly told not to treat that as a hard cutoff for
  slow-burn stories the ledger still shows as unresolved.

Both scripts share the same shape: each fans out one discovery agent per bucket (real
WebSearch/WebFetch, plus a best-effort `impact_estimate` per candidate), then a single
dedupe-and-classify agent that reads the running ledger and the current batch together and
returns `classified_events` (each with a reconciled `impact` block), `candidate_dispositions` (one
dedup verdict per raw candidate, keyed by `source_url`), and a `cycle_summary`. The classify step
is wrapped so a failure there can't silently lose discovery work — see checkpointing below. Invoke
either with `Workflow({ name: "airport-disruption-flash-pass", args: { regionScope, sinceTimestamp,
pendingCandidates } })` (all `args` fields optional; omit `regionScope` for unrestricted global
scope).

Discovery prompts in both scripts also: prefer official enumerable feeds (airport-authority
RSS/status pages, NOTAM portals) over generic search where one exists for the bucket; search
iteratively, generating follow-up queries from newly-found entities until two consecutive queries
surface nothing new, rather than stopping at a fixed batch; and move on after two failed attempts
at an unresponsive source rather than retrying indefinitely — a soft bound, since the Agent tool
exposes no hard per-agent timeout to enforce one.

**Why not a faster cadence.** The flash pass is capped at once per hour, not the originally
envisioned 15-20 minutes — that's a real platform floor, not a design choice. The durable
Routine/trigger mechanism (the only scheduling primitive that survives past this session and
doesn't expire) has a hard minimum interval of one hour. `CronCreate` can go sub-hourly but is
session-scoped, auto-expires after 7 days, and only fires while the session is idle — not viable
for standing production monitoring. The flash/deep split still earns its keep at equal cadence
ceilings: the fast-moving official buckets get checked up to 4-5x more often than the slow-recall
ones, at a fraction of the cost per check (4 buckets vs. 7).

- `data/signal-ledger.jsonl` (repo root) — the running ledger, one JSON object per line, shaped
  like `classified_event_output` and keyed by `canonical_event_id` (see
  `references/event-fingerprinting.md` for the ID convention). After each sweep, append the
  returned `classified_events` flagged `is_new_ledger_entry: true` so the next cycle can tell new
  events from repeats. This flag is set for `new_event`, `meaningful_update`, **and `monitor`** —
  a monitor item needs persistent memory too, so an unresolved dispute doesn't get rediscovered as
  "new" every cycle and can cleanly escalate to `meaningful_update` once it materializes; only
  `duplicate` and `noise` are left out of the ledger entirely. **When appending, stamp real
  timestamps** — read the current time with `date -u +"%Y-%m-%dT%H:%M:%SZ"` (never invent one):
  `last_updated_at` is always that current time; `first_detected_at` is copied forward from the
  most recent existing ledger line with the same `canonical_event_id`, or set to the current time
  if there is none.
- `data/raw-candidates.jsonl` (repo root) — the pre-dedup audit trail. Append every item in the
  workflow's returned `raw_candidates` array, one JSON object per line, tagging each with the
  cycle identifier — this is what lets the ledger/audit dashboard view show *why* a given title
  was or wasn't treated as a duplicate.
- `data/ops-log.jsonl` and `data/pending-classification.jsonl` (repo root) — see `data/README.md`
  for the full field list. In short: `ops-log.jsonl` is one line per cycle attempt (success,
  partial failure, or failure) and is what both the recency window (`sinceTimestamp` for the next
  same-`pass_type` cycle) and coverage-gap detection read from — if the most recent `success` for
  a `pass_type` is older than `config.json`'s `reliability.coverage_gap_threshold_cycles` times
  that pass's cadence, **say so loudly at the top of the cycle summary**, don't stay quiet about
  it. `pending-classification.jsonl` is the deep-pass checkpoint: if `classification_failed` comes
  back true, write that cycle's `raw_candidates` there (overwriting, not appending) instead of
  discarding them, and pass them back in as `args.pendingCandidates` on the next deep-pass
  invocation; clear it once a cycle classifies the backlog successfully. The flash pass doesn't
  checkpoint — its own next cycle is at most an hour away, which is cheaper than the bookkeeping.
- **Idempotency guard.** Before appending a cycle's results to either ledger file, check
  `ops-log.jsonl` for an existing line with that same `cycle_id` (the Workflow run's own id)
  already marked appended — if found, skip re-appending. This is what keeps a retried
  orchestrator step from double-counting the same cycle's results.
- Recurring execution is driven by two scheduled Routines (cron triggers, one per pass type,
  each ≥ 1 hour per the floor above) that each fire into a session with a prompt to run their
  workflow, append qualifying events to both ledger files with real timestamps, write the
  ops-log entry, commit/push, and summarize (loudly, if there's a coverage gap) — the workflow
  scripts themselves have no scheduling, clock, or filesystem access of their own, so all of that
  happens as normal tool-using steps after the workflow returns, not inside the script. Once a
  dashboard-regeneration step exists (build-plan Batch 4), the same Routine prompts are where it
  gets added, as a further step after the ledger append — the dashboard is never a separate
  schedule of its own.

## Non-negotiables

- Don't stop after 3-4 sources, and don't rely only on English or international media.
- Don't classify from the title alone — use source credibility, operational-impact evidence, and
  cargo/logistics relevance.
- Don't suppress a weak-but-credible signal during discovery — capture it, classify later.
- Don't surface duplicates, and don't confuse a duplicate report with a meaningful update.
- Don't build this as a rigid keyword rule engine — reason from operational consequences.
- Don't invent a timestamp or an `impact` number to fill a field — leave it unset/`null` and let
  the confidence/evidence fields carry the uncertainty instead.
