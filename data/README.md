# Data files

## `signal-ledger.jsonl`

One JSON object per line, append-only, one line per `classified_event_output`
(schema in `.claude/skills/airport-radar/assets/output-schemas.json`).
Multiple lines can share a `canonical_event_id` - each is a snapshot at the time it
was appended (`workflow_status: new_event` the first time, `meaningful_update` for
each later revision, subject to Council's final call - see below). Schema v3
(current): every line carries `ledger_schema_version`, `first_detected_at`/
`last_updated_at`, a typed `impact` block, and three Council-produced fields:

- `council_verdict` - `confirmed` / `downgraded_to_monitor` / `downgraded_to_noise` /
  `escalated_to_new_event` / `not_reviewed`. Kept distinct from `workflow_status` (which
  always reflects the *final* call) so Classify-vs-Council disagreement is itself a
  measurable signal over time - a rising downgrade rate means Classify is drifting
  loose, not that Council is being difficult.
- `severity_delta` - `new` / `escalated_major` / `escalated_minor` / `unchanged` /
  `de_escalated` / `resolved`, computed against the ledger's previous line for the same
  `canonical_event_id`, not the event's original entry.
- `dark_corner_impact` - a nullable supply-chain-propagation narrative (using
  `service-dependency-graph.json` + `cargo-hub-tiers.json`), null whenever there's no
  real non-generic inference to draw rather than filled with boilerplate.

Lines written before schema v2 existed were migrated by `scripts/migrate_ledger_v2.py`
(timestamps backfilled from real git commit history, `impact` by best-effort text
extraction, `impact.extraction_method: "heuristic_backfill"`). Lines before schema v3
were migrated by `scripts/migrate_ledger_v3.py`: `council_verdict` is honestly set to
`not_reviewed` (there is no real Council judgment to backfill) and `dark_corner_impact`
is left `null` for the same reason; `severity_delta` is mechanically inferred from each
line's own (heuristically-backfilled) impact numbers versus the previous line for that
event - a reasonable approximation, not equivalent to a real Council read of the
evidence text. Lines written by a post-v3 cycle carry real values for all three.

This is the file the analyst-facing dashboard's triage view reads.

## `raw-candidates.jsonl`

One JSON object per line, one per raw candidate signal a discovery agent found *before*
deduplication/classification (schema: `candidate_signal_output`, same schema file),
enriched with `dedup_verdict` / `matched_canonical_event_id` / `dedupe_reason` from the
classify stage. This is the audit trail: it's what lets you check *why* a given title
was (or wasn't) treated as a duplicate of something already in `signal-ledger.jsonl`.

Starts empty - nothing before this file existed persisted raw candidates, so there's no
history to backfill here the way there was for the ledger. It fills in from the first
cycle run after this file was introduced.

This is the file the dashboard's ledger/audit view reads.

## `ops-log.jsonl`

One JSON object per line, one per sweep attempt, appended by the Routine that fires each
sweep - never by the workflow script itself, which has no clock or filesystem access.
Fields: `cycle_id` (the Workflow run's own id, used as an idempotency key so a retried
orchestrator step can't double-append the same cycle's results), `scope` (`flash`/`deep`
- which bucket list actually ran this cycle), `started_at`/`completed_at`, `status`
(`success`/`partial_failure`/`failed`), `raw_candidate_count`, `classified_count`,
`ledger_appended_count`, `council_failed` (bool - Classify succeeded but Council's
re-check didn't run), `error` (null on success).

Three things read this file: the Routine's own hourly check-in (to decide whether a
deep-scope or flash-scope sweep - or neither - is due, per `config.json`'s
`cadence.flash_hours`/`deep_hours`), the recency window (`sinceTimestamp` = the most
recent `status: success` line's `completed_at`), and coverage-gap detection
(`config.json`'s `reliability.coverage_gap_threshold_cycles` - if the most recent
success for a scope is older than that many cadence intervals, say so loudly in the
cycle summary rather than staying silent about it).

## `pending-classification.jsonl`

Checkpoint file for deep-scope cycles only. If a deep-scope cycle's classify step fails
after discovery already succeeded, its raw candidates are written here (overwriting
whatever was here before) instead of being discarded. The next deep-scope invocation
reads this file, passes its contents as `args.pendingCandidates`, and the workflow
folds them back into that cycle's own fresh candidates for classification. Cleared
(emptied) once a cycle successfully classifies the backlog. A flash-scope failure
doesn't bother checkpointing - its own next opportunity is at most `flash_hours` away.
