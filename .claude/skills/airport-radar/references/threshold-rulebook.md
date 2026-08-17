# Threshold Rulebook

This is the Council's rulebook — the second, independent read applied *after* Classify has
already clustered candidates and assigned an initial `workflow_status`. Classify is deliberately
recall-leaning (capture anything that plausibly clears the bar); Council's job is precision:
catch what Classify over-triggered on before it reaches a customer, and measure how much an
event's severity actually changed since the ledger last saw it.

This file is a placeholder for EventWatch's own governance/threshold rulebook if one exists for
other event-type packs (`research-playbook.md` references `governance/threshold-rulebook.md`
from a broader repo not included here) — if that real document becomes available, it should
replace this file's rules, not sit alongside them as a second opinion.

## What Council actually does

For every event Classify marked `new_event`, `meaningful_update`, or `monitor` (not `duplicate`
or `noise` — those are already excluded, no need to re-litigate them):

1. Re-read the event's own evidence and `reason` field independently — don't just check whether
   Classify's stated status matches its own stated reason, actually ask "does this evidence, read
   cold, clear the bar for this status." Classify can talk itself into a status its own evidence
   doesn't support.
2. Decide `council_verdict`: `confirmed` (status stands), `downgraded_to_monitor`,
   `downgraded_to_noise`, or `escalated_to_new_event` (rare - Classify under-called something
   Council reads as clearing the bar).
3. Compute `severity_delta` against the most recent ledger line for the same
   `canonical_event_id` (read `data/signal-ledger.jsonl` directly): `new` (no prior line),
   `escalated_major`, `escalated_minor`, `unchanged`, `de_escalated`, or `resolved`.
4. Draft `dark_corner_impact` — see below.

## Noise patterns to actively hunt for (why titles get downgraded)

- **Scale inflation from a single incident.** One flight delayed, one gate closed briefly, one
  diverted aircraft with no cascading effect — described in dramatic language but not actually a
  pattern or an airport-level event. Downgrade to `noise` unless it's a genuinely novel incident
  type worth a first `monitor` entry (see `reference-examples.md`).
- **Unconfirmed rumor treated as fact.** A single social/local post with no corroboration,
  reporting something no official or aviation-specific source has touched yet. Not automatically
  noise — this is exactly the "early hint" case — but it should stay at `monitor` with the
  uncertainty stated plainly, not get promoted to `new_event` on Classify's optimism.
- **Resolved-with-no-lasting-effect dressed up as ongoing.** An incident that closed a runway for
  20 minutes three days ago and has produced zero further coverage since. If nothing in this
  cycle's evidence shows continuing operational effect, this is `noise` even if it was legitimately
  `new_event`-worthy at the time.
- **Rephrased duplicate treated as a new development.** A second outlet's write-up of the same
  facts already in the ledger, with no new number, no new date, no status change — regardless of
  how different the headline sounds. This is `duplicate`-shaped even if Classify called it
  `meaningful_update`; downgrade accordingly.
- **A pattern-of-one treated as a trend.** "Second labour dispute at this airport" needs an actual
  second dispute, not two articles about the same one.

## Severity delta — how to actually judge "how much did this change"

Compare the new evidence against the ledger's most recent line for this event, not against the
event's original first-ever entry — a slow multi-week escalation should read as a series of minor
escalations, not one enormous jump computed against day one.

- `escalated_major` — event_status crossed a real threshold (partial → full closure, threatened →
  confirmed strike with a date, single-airport → multi-airport), or a quantified figure roughly
  doubled or more (50 cancellations → 150+; one airport → three).
- `escalated_minor` — same shape of event, modestly worse (cancellation count crept up, closure
  extended by a day, one more carrier joined a suspension) — still worth surfacing, not worth
  sounding an alarm bell over.
- `unchanged` — this cycle's version doesn't materially move the needle either way; usually pairs
  with a `council_verdict` of `downgraded_to_noise` or `downgraded_to_monitor` unless there's a
  confidence/sourcing reason to keep it at its current status.
- `de_escalated` — real improvement short of full resolution (partial reopening, reduced
  restriction, strike called off for a subset of workers).
- `resolved` — operations back to normal, no further tracking needed unless recurrence risk is
  explicitly flagged.
- `new` — no prior ledger line for this `canonical_event_id` exists.

## Dark-corner impact — the "customer never knew" narrative

For every event Council confirms (any status except `noise`), draft one or two sentences
connecting the disruption to a second-order consequence the customer would not have derived
themselves from the headline. This is not restating the news - a customer can read the headline
themselves. It's the inference on top of it, grounded in real reference material, not invented:

- Use `assets/service-dependency-graph.json` to reason from the disrupted *service*
  (ground handling, refuelling, cargo handling, customs, ATC/radar, runway ops, IT/cyber) to what
  it actually propagates to (cargo backlog, customs clearance delay, turnaround capacity).
- Use `assets/cargo-hub-tiers.json` to weigh whether the airport is a tier-1/tier-2 cargo gateway -
  if it is, name what kind of traffic plausibly transits there (e.g. LEJ → DHL's primary European
  overnight air-cargo hub → time-sensitive/overnight parcel and freight).
- If there is no real basis for a second-order inference (a genuinely self-contained event with no
  plausible cargo/supply-chain propagation), leave `dark_corner_impact` null rather than inventing
  a generic line - a customer will notice a boilerplate sentence, and it costs the exact trust
  this whole rulebook exists to protect.
- Never state a specific company, shipment, or customer as affected unless the source evidence
  actually says so - reason about the *class* of cargo/traffic at risk, not a fabricated specific.
