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

## Output contract

Always structure findings using the schemas in `assets/output-schemas.json`:

- `candidate_signal_output` — one per raw finding during discovery
- `classified_event_output` — one per clustered event after classification
- `search_cycle_summary` — one per hunt, summarizing what was searched and found

When maintaining a running ledger across multiple hunts/cycles, persist entries using
`assets/signal-ledger-schema.json`. Use `assets/service-dependency-graph.json` to judge how a
disrupted airport service (ground handling, refuelling, cargo handling, customs, ATC/radar,
runway ops, IT/cyber) propagates to operational and cargo impact.

## Classification statuses

Assign exactly one workflow status per clustered event:

- `new_event` — disruption not previously captured
- `meaningful_update` — existing event, but new evidence changes the risk picture (status change,
  duration change, cargo impact confirmed, escalation/de-escalation)
- `duplicate` — repeats a known event with no material new information
- `monitor` — credible but too incomplete to push yet
- `noise` — irrelevant, passenger-only, or resolved with no operational/cargo impact

Only `new_event` and `meaningful_update` are normally worth surfacing prominently; `monitor` is
held pending more evidence; `duplicate` and `noise` are not surfaced as new items.

## Non-negotiables

- Don't stop after 3-4 sources, and don't rely only on English or international media.
- Don't classify from the title alone — use source credibility, operational-impact evidence, and
  cargo/logistics relevance.
- Don't suppress a weak-but-credible signal during discovery — capture it, classify later.
- Don't surface duplicates, and don't confuse a duplicate report with a meaningful update.
- Don't build this as a rigid keyword rule engine — reason from operational consequences.
