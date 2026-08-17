# Data files

## `signal-ledger.jsonl`

One JSON object per line, append-only, one line per `classified_event_output`
(schema in `.claude/skills/airport-disruption-hunter/assets/output-schemas.json`).
Multiple lines can share a `canonical_event_id` - each is a snapshot at the time it
was appended (`workflow_status: new_event` the first time, `meaningful_update` for
each later revision). Schema v2 (current): every line carries
`ledger_schema_version`, `first_detected_at`/`last_updated_at`, and a typed `impact`
block alongside the narrative fields. Lines written before schema v2 existed were
migrated in place by `scripts/migrate_ledger_v2.py`, which backfilled timestamps from
real git commit history and `impact` by best-effort extraction from the existing
narrative text (`impact.extraction_method: "heuristic_backfill"`) - those numbers are
a reasonable estimate, not a guarantee; lines written by a post-v2 cycle instead carry
`extraction_method: "agent_reported"`.

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

One JSON object per line, one per sweep attempt (flash or deep), appended by the Routine that
fires each pass - never by the workflow script itself, which has no clock or filesystem access.
Fields: `cycle_id` (the Workflow run's own id, used as an idempotency key so a retried
orchestrator step can't double-append the same cycle's results), `pass_type` (`flash`/`deep`),
`started_at`/`completed_at`, `status` (`success`/`partial_failure`/`failed`),
`raw_candidate_count`, `classified_count`, `ledger_appended_count`, `error` (null on success).

Two things read this file: the next same-`pass_type` cycle (to get `sinceTimestamp` for
recency-bounded search - the timestamp of the most recent `status: success` line for that
pass_type), and coverage-gap detection (`config.json`'s `reliability.coverage_gap_threshold_cycles`
- if the most recent success for a pass_type is older than that many cadence intervals, say so
loudly in the cycle summary rather than staying silent about it).

## `pending-classification.jsonl`

Checkpoint file for the deep pass only. If a deep-pass cycle's classify step fails after
discovery already succeeded, its raw candidates are written here (overwriting whatever was here
before) instead of being discarded. The next deep-pass invocation reads this file, passes its
contents as `args.pendingCandidates`, and the workflow folds them back into that cycle's own
fresh candidates for classification. Cleared (emptied) once a cycle successfully classifies the
backlog. The flash pass doesn't use this - a lost flash cycle's finds are, at most, an hour
stale by the time the next one runs.
