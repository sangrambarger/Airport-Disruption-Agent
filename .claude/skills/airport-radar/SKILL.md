---
name: airport-radar
description: Recall-first OSINT researcher for airport operational disruptions — closures, runway/ATC/radar failures, strikes and labour action, cargo terminal disruption, security incidents, customs delays, and weather impact — with a focus on cargo/supply-chain relevance. Use whenever the user asks to check, monitor, hunt, or research airport disruptions or operational risk, strikes/industrial action affecting an airport or cargo, "what's going on at [airport/IATA code]", or wants an EventWatch-style exhaustive signal hunt across official, regional, labour, aviation, cargo, and multilingual sources — even if they never say "disruption" and just name an airport and ask if there are issues. Do not use for general flight-status/delay lookups for a single passenger itinerary with no operational or cargo angle.
---

# Airport Radar

Successor to the earlier "airport-disruption-hunter" skill (renamed and restructured, not just
relabeled — see "What changed" below). Ancestor design docs (`00`-`14` at the repo root) are
Google Antigravity `/goal` instructions this pack was originally ported from; this skill
re-expresses that design as Claude Code tool usage, since extended well past the original port.

## Mission

Hunt for early global airport disruption signals that may affect cargo movement, logistics
continuity, airport operations, aviation infrastructure, or supply-chain flow — for EventWatch to
notify customers before mainstream media covers it, including disruptions that mainstream media
may never cover at all (a cargo-only or customs-only disruption often has no passenger-facing
angle for general news to pick up). This is a signal-discovery task, not an answer-generation
one: the goal is to find every credible early signal, not to stop once a plausible answer exists.

A found event is worth more than a well-written summary of one already known. Freshness is not
a nice-to-have: resurfacing the same disruption cycle after cycle erodes analyst and customer
trust in the whole feed, which is why deduplication and the Council pass (below) both exist.

## Core philosophy

- **Discovery is recall-first, and deliberately uncapped.** Capture weak-but-credible signals
  rather than filtering them out early — local reports, union notices, live flight-tracker
  anomalies, and eyewitness posts often surface a disruption before any article exists about it.
  Don't stop after finding 3-4 good sources, and don't stop at a fixed query count either — see
  "Search depth" below for exactly how far to push this and why there's no ceiling on it.
- **Classification is precision-first — and checked twice.** Classify clusters candidates and
  makes an initial call; Council (below) independently re-reads that call before anything reaches
  a customer. Reason from operational consequences (does availability, cargo throughput, or
  customs clearance actually drop?), not from keyword matches — a radar failure, a storm, a
  ground-handling strike, and a security evacuation can all produce the same operational outcome.
- **Don't rely on English or international media alone, and don't assume one source type is
  always earliest.** Which source gets there first depends on the disruption type — see
  `references/source-strategy.md`'s race table before assuming local news or official channels
  are always the fast path.

## Workflow

1. **Scope the hunt.** Identify the airport(s)/region, IATA/ICAO codes, local name variants,
   relevant languages, and whether this is a fresh sweep or a follow-up on an existing signal.
2. **Discovery.** Search across all ten source buckets using both English and local-language
   queries, iteratively and without a depth ceiling (see "Search depth"). See
   `references/source-strategy.md` and `references/query-development.md`.
3. **Record every candidate signal** in the shape defined by `assets/output-schemas.json`'s
   `candidate_signal_output` — even ones you're not sure matter yet.
4. **Deduplicate and cluster.** Match signals across languages/titles by airport, approximate
   date, cause, and affected service — not by title text alone. See
   `references/dedup-clustering.md` and `references/event-fingerprinting.md`.
5. **Classify.** Assign an initial workflow status. See "Classification statuses" below and
   `references/reference-examples.md` for calibration.
6. **Council.** Independently re-check Classify's call against `references/threshold-rulebook.md`
   before anything is finalized — see "Council" below. This step is not optional and not skippable
   just because Classify seems confident.
7. **Report.** Return structured output per `assets/output-schemas.json` — never prose-only.

## Search depth — no ceiling, by decision

There is deliberately no hard query limit per discovery agent. Loop-until-dry (keep issuing
follow-up queries — generated from entities/keywords the last round turned up — until two
consecutive queries surface nothing new) is the actual mechanism, and it stays uncapped because
the output quality it produces is the thing not to be traded away for a token ceiling. Reliability
is instead handled by decomposing into more, narrower parallel discovery agents (ten roles now,
see `references/subagent-roles.md`, versus the seven the earlier version had) so no single agent
call is the long pole, plus checkpointing (see "Scheduled operation") so a failure never discards
completed work. Move on after two failed attempts at any one unresponsive source rather than
retrying it further — that's a real bound, just not a depth one.

## Tool mapping

- **WebSearch** is the primary discovery tool for each search cycle — run both natural-language
  and exact-phrase/dork-style queries (`references/query-development.md`).
- **WebFetch** verifies specific pages surfaced by search (airport authority status pages,
  NOTAMs, union bulletins, live flight-tracker views) rather than trusting a headline alone.
- **Agent tool**, when available, parallelizes discovery: spawn one agent per source-bucket (see
  `references/subagent-roles.md` for the ten roles and required output fields), then merge their
  findings before deduplication. If subagents aren't available or the hunt is narrow (one airport,
  one language), work the buckets sequentially instead — the discipline matters more than the
  parallelism.
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
("operations resumed", "strike called off") · an unexplained flight-tracker cancellation/delay
spike with no published cause yet.

There is no authoritative customer-contracted subtype list beyond this one today — if EventWatch
has a formal list elsewhere, this should be validated against it, not treated as independently
authoritative.

## Reference files

Load only what the current step needs:

| File | Load when... |
|---|---|
| `references/source-strategy.md` | building the source list for a hunt — the ten source buckets, what to look for in each, and which bucket is realistically earliest for a given disruption type |
| `references/query-development.md` | generating search queries — natural-language, exact-match, dork-style, and follow-up-expansion patterns |
| `references/multilingual-map.md` | deciding which languages to search per country/region |
| `references/subagent-roles.md` | parallelizing discovery with the Agent tool — the ten roles and required output fields |
| `references/dedup-clustering.md` | merging findings — event-fingerprint matching and meaningful-update vs. duplicate calls |
| `references/event-fingerprinting.md` | assigning a stable `canonical_event_id`, or stamping `first_detected_at`/`last_updated_at` when appending to the ledger |
| `references/reference-examples.md` | calibrating whether a signal is strong or weak |
| `references/threshold-rulebook.md` | **the Council step** — noise patterns to hunt for, how to judge `severity_delta`, and how to draft `dark_corner_impact` |
| `references/research-playbook.md` | deeper EventWatch-style research/escalation guidance — note: cross-references files from a broader EventWatch repo not included here, so some pointers won't resolve |

## Configuration

This skill is scope-agnostic by design — a new deployment should only ever need to edit
`assets/config.json`, never the skill or workflow logic itself:

- `assets/config.json` — region scope (global or a specific list), cadence (`flash_hours`/
  `deep_hours`), delivery destination(s) and digest-firing rule, feature flags, and a pointer to
  `assets/cargo-hub-tiers.json`.
- `assets/cargo-hub-tiers.json` — airport criticality tiers (by cargo throughput/role, not
  passenger volume), used both for scoring and for the Council's `dark_corner_impact` reasoning.
  Not exhaustive; extend freely — an airport missing from it is treated as the lowest tier.

If `config.json`'s `scope.mode` is `"regions"`, pass its `scope` object as
`Workflow({ name: "airport-radar-sweep", args: { scope: "flash"|"deep", regionScope: config.scope } })`
— the workflow script reads `args.regionScope` and restricts every discovery bucket's prompt to
it. Leaving `scope.mode` as `"global"` (the default) or omitting it entirely searches unrestricted.
`args.scope` (`"flash"` or `"deep"`) is a *different* thing from `config.scope` — it selects the
bucket list for this invocation, see "Scheduled operation".

## Output contract

Always structure findings using the schemas in `assets/output-schemas.json`:

- `candidate_signal_output` — one per raw finding during discovery
- `classified_event_output` — one per clustered event after Classify and Council
- `search_cycle_summary` — one per hunt, summarizing what was searched and found

Use `assets/service-dependency-graph.json` to judge how a disrupted airport service (ground
handling, refuelling, cargo handling, customs, ATC/radar, runway ops, IT/cyber) propagates to
operational and cargo impact — this is also the Council's raw material for `dark_corner_impact`.

`classified_event_output` (schema v3) carries:

- A typed `impact` block — `flights_cancelled`, `flights_delayed`, `passengers_affected`,
  `duration_days`, `cargo_confirmed`, `cargo_relevance_level` — alongside the narrative
  `operational_impact` and `cargo_or_logistics_relevance` fields. Populate from real evidence
  only, leaving a field `null` rather than guessing; set `extraction_method: "agent_reported"` (a
  migration backfilling older entries from text is the only place `"heuristic_backfill"` belongs).
  `cargo_relevance_level` drives the cargo-first triage sort downstream — get it right: `"direct"`
  only for explicit freighter/belly-cargo/cargo-terminal/cargo-workforce involvement, `"possible"`
  for plausible-but-unconfirmed exposure, `"none"` otherwise.
- Three Council-produced fields — `council_verdict`, `severity_delta`, `dark_corner_impact` — see
  "Council" below. Never set these yourself in Classify; they belong to the Council step alone.

## Classification statuses

Assign exactly one workflow status per clustered event (Classify's initial call — Council may
change it). **Cargo/logistics relevance is one lens, not the only one that makes an event
reportable.** An event also clears the bar on real operational/flight-count impact, on a
recurring pattern at the same airport, or (at `monitor` level) on credible-but-unconfirmed risk —
don't discard something as noise just because it's passenger-only or not yet officially confirmed:

- `new_event` — a disruption not previously captured that clears the bar on any of: confirmed
  cargo/logistics impact; real operational/flight-count impact at meaningful scale (dozens of
  flights cancelled/diverted/grounded, not a single flight); or a materialized instance of a
  recurring pattern at an airport worth tracking going forward.
- `meaningful_update` — existing event, but new evidence changes the risk picture (status change,
  duration change, cargo impact confirmed, escalation/de-escalation, scale materially increased)
- `duplicate` — repeats a known event with no material new information
- `monitor` — not yet at reportable scale, but worth tracking: an unresolved dispute or strike
  threat with no confirmed date, a single uncorroborated social/eyewitness signal, an early
  instance of a pattern that may be forming, or a report pending official confirmation
- `noise` — genuinely trivial: a single flight affected with no pattern or escalation risk, an
  incident resolved with no lasting operational effect, or a hoax/false alarm with no measurable
  disruption

Only `new_event` and `meaningful_update` are normally worth surfacing prominently; `monitor` is
held pending more evidence or escalation; `duplicate` and `noise` are not surfaced as new items,
and are not sent to Council either — there's nothing to gain from a second read of something
already excluded.

## Council

A second, independent pass after Classify, applied to every event Classify marked `new_event`,
`meaningful_update`, or `monitor`. This is not a rename of Classify and not optional — it exists
specifically to catch what a recall-leaning Classify step over-triggers on, which is what protects
analyst/customer trust in the feed over time. Full rules in `references/threshold-rulebook.md`;
in short, Council:

1. Re-reads each event's evidence and `reason` cold — not "does the stated reason match the
   stated status" but "does the evidence actually support this status."
2. Sets `council_verdict` (`confirmed` / `downgraded_to_monitor` / `downgraded_to_noise` /
   `escalated_to_new_event`) and, correspondingly, the *final* `workflow_status`.
3. Sets `severity_delta` by comparing this event's evidence against the ledger's most recent line
   for the same `canonical_event_id` (not the event's original entry) — `new` if there is no prior
   line. This is the mechanism for something like "9am: floods cause some flight cancellations" →
   "1am: airport declared fully shut down" landing as a loud `escalated_major` on the *same*
   event, not a quiet, easy-to-miss `meaningful_update` indistinguishable from a minor status note.
4. Drafts `dark_corner_impact` — one or two sentences connecting the disruption to a second-order
   supply-chain consequence the customer wouldn't derive from the headline alone, grounded in
   `assets/service-dependency-graph.json` and `assets/cargo-hub-tiers.json`. Left `null` when
   there's no real inference to draw — a generic sentence costs the trust this step exists to
   protect.

`council_verdict` is kept distinct from the final `workflow_status` specifically so
Classify-vs-Council disagreement is measurable over time — a rising downgrade rate is a real
signal that Classify's own bar has drifted loose.

If Council itself fails (the agent call errors), Classify's own verdicts still ship rather than
being discarded — `council_verdict: "not_reviewed"`, `severity_delta`/`dark_corner_impact: null`,
and the cycle's `council_failed: true` so this is visible in the ops log, not silent.

## Scheduled operation

For ad hoc hunts (a user asks about a specific airport or region right now), follow the workflow
above directly with WebSearch/WebFetch/Agent.

For **standing, recurring monitoring**, this repo ships one workflow with two scopes, run from one
Routine — not two workflows and two schedules. A prior version of this skill split flash/deep into
separate files and separate triggers; that added machinery without adding capability, since the
two scopes share nearly everything (same schemas, same Classify/Council logic, different bucket
list and recency window) and the durable scheduler already requires an hourly check-in regardless
of the target cadences (see below).

- `.claude/workflows/airport-radar-sweep.js` — takes `args.scope` (`"flash"` or `"deep"`).
  `"flash"` runs six buckets: flight-tracking/live-status, social/eyewitness, airport authority,
  civil aviation/NOTAM, airline operations, weather/emergency (the fast-moving/official ones).
  `"deep"` runs those six plus labour/union, cargo/logistics, and local-language news — the
  recall-complete sweep and the actual edge over media-monitoring tools. Both scopes: fan out one
  discovery agent per bucket (real WebSearch/WebFetch, plus a best-effort `impact_estimate` per
  candidate, searched without a depth ceiling — see "Search depth"), then Classify, then Council,
  returning `classified_events` (each with `impact`, `council_verdict`, `severity_delta`,
  `dark_corner_impact`), `candidate_dispositions` (one dedup verdict per raw candidate, keyed by
  `source_url`), and a `cycle_summary`. Classify is wrapped so a failure there can't silently lose
  discovery work; Council is wrapped so a failure there can't silently lose Classify's work either
  — see checkpointing below. Invoke with
  `Workflow({ name: "airport-radar-sweep", args: { scope, regionScope, sinceTimestamp, pendingCandidates } })`
  (all `args` fields but `scope` are optional; omit `regionScope` for unrestricted global scope).

Discovery prompts: prefer official enumerable feeds (airport-authority RSS/status pages, NOTAM
portals, flight-tracker views) over generic search where one exists for the bucket; search
iteratively, generating follow-up queries from newly-found entities until two consecutive queries
surface nothing new; move on after two failed attempts at an unresponsive source rather than
retrying indefinitely — a soft bound, since the Agent tool exposes no hard per-agent timeout to
enforce one.

**One Routine, hourly check-in, `config.json`'s `cadence.flash_hours`/`deep_hours` as the actual
target cadences.** The durable Routine/trigger mechanism (the only scheduler that survives past a
session and doesn't expire) has a hard minimum interval of one hour — `CronCreate` can go
sub-hourly but is session-scoped, auto-expires after 7 days, and only fires while a session is
idle, not viable for standing production monitoring. So the Routine fires hourly regardless of
what `flash_hours`/`deep_hours` are set to, and each firing decides its own scope by reading
`data/ops-log.jsonl`:

1. If it's been ≥ `deep_hours` since the most recent successful `scope: "deep"` line → run
   `scope: "deep"` this firing (its bucket list is a superset, so this also satisfies the flash
   requirement).
2. Else if it's been ≥ `flash_hours` since the most recent successful line of *either* scope →
   run `scope: "flash"` this firing.
3. Else → skip this firing entirely. No `Workflow()` call, just an ops-log read — effectively free.

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
  for the full field list. In short: `ops-log.jsonl` is one line per firing (including skipped
  ones) and is what the hourly scope decision, the recency window, and coverage-gap detection all
  read from — if the most recent success for a scope is older than `config.json`'s
  `reliability.coverage_gap_threshold_cycles` times that scope's cadence, **say so loudly at the
  top of the cycle summary**, don't stay quiet about it. `pending-classification.jsonl` is the
  deep-scope checkpoint: if `classification_failed` comes back true, write that cycle's
  `raw_candidates` there (overwriting, not appending) instead of discarding them, and pass them
  back in as `args.pendingCandidates` on the next deep-scope invocation; clear it once a cycle
  classifies the backlog successfully. A flash-scope failure doesn't checkpoint — its own next
  opportunity is at most `flash_hours` away.
- **Idempotency guard.** Before appending a cycle's results to either ledger file, check
  `ops-log.jsonl` for an existing line with that same `cycle_id` (the Workflow run's own id)
  already marked appended — if found, skip re-appending. This is what keeps a retried
  orchestrator step from double-counting the same cycle's results.
- Recurring execution is driven by one scheduled Routine (cron trigger, hourly) that fires into a
  session with a prompt to make the scope decision above, run the workflow, append qualifying
  events to both ledger files with real timestamps, write the ops-log entry, commit/push, and
  summarize (loudly, if there's a coverage gap) — the workflow script itself has no scheduling,
  clock, or filesystem access of its own, so all of that happens as normal tool-using steps after
  the workflow returns, not inside the script. Once a dashboard-regeneration step exists
  (build-plan Batch 4), the same Routine prompt is where it gets added, as a further step after
  the ledger append — the dashboard is never a separate schedule of its own.
- **Digest delivery is one design, two firing conditions, not two digests.** An event's urgency
  doesn't depend on which scope found it, so there is exactly one digest template. It fires
  immediately when a cycle (either scope) produces something matching `config.json`'s
  `delivery.email.immediate_alert_condition`, and on a fixed schedule
  (`delivery.email.scheduled_rollup_hours`) for everything else, skipping anything already sent as
  an immediate alert.

## What changed from the earlier "airport-disruption-hunter" version

- Renamed; the old skill directory is removed, not kept alongside this one.
- Two source-bucket roles added (flight-tracking/live-status, social/eyewitness) that were
  documented before but never actually searched — see `references/source-strategy.md`.
- `references/source-strategy.md` rewritten around "which source is realistically earliest for
  this disruption type," not one flat ranking.
- Two separate workflow files/Routines (flash-pass, deep-pass) collapsed into one workflow with an
  `args.scope` parameter and one hourly-check-in Routine.
- Council added as a real second pipeline stage, with its own reference file
  (`references/threshold-rulebook.md`) and three new ledger fields.
- Ledger schema bumped to v3 (`scripts/migrate_ledger_v3.py`); v1→v2 migration
  (`scripts/migrate_ledger_v2.py`) is unaffected and still applies first for anything not yet at
  v2.

## Non-negotiables

- Don't stop after 3-4 sources, and don't cap search depth at a fixed query count either.
- Don't classify from the title alone — use source credibility, operational-impact evidence, and
  cargo/logistics relevance.
- Don't suppress a weak-but-credible signal during discovery — capture it, classify later.
- Don't surface duplicates, and don't confuse a duplicate report with a meaningful update.
- Don't build this as a rigid keyword rule engine — reason from operational consequences.
- Don't invent a timestamp, an `impact` number, or a `dark_corner_impact` narrative to fill a
  field — leave it unset/`null` and let the confidence/evidence fields carry the uncertainty
  instead.
- Don't let Council rubber-stamp Classify — a `council_verdict` of `confirmed` should mean Council
  actually checked, not that it skipped the read.
