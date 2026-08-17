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
