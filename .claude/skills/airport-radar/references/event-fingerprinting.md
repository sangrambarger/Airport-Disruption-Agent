# Event fingerprinting & timestamps

How `canonical_event_id` is assigned, and who is responsible for stamping
`first_detected_at` / `last_updated_at` on ledger entries (schema v2). Load this when
generating a `canonical_event_id` during classification, or when appending to the ledger.

## `canonical_event_id` pattern

```
{AIRPORT_CODE_OR_REGION}-{YYYY}-{MM}-{cause-slug}
```

- `AIRPORT_CODE_OR_REGION` - the IATA code if the event is centered on one airport
  (`BCN`, `LEJ`). For a multi-airport or country-level event, use a short region/country
  slug instead (`CO` for the Colombia earthquake closures, `ME` for the Middle East
  airspace situation) - don't force a single IATA code onto an event that isn't
  airport-specific.
- `YYYY-MM` - the year and month the event *started*, not the month of the cycle that
  first captured it. A strike that began in July and is first ledgered in August still
  gets `-07-`.
- `cause-slug` - a short, lowercase, hyphenated description of the cause (`groundforce-strike`,
  `drone-explosive`, `etna-ash`), not the outcome. Two different causes at the same
  airport in the same month are two different IDs; the same cause continuing is one ID
  with multiple ledger lines.

Worked examples from the live ledger: `BCN-2026-08-groundforce-strike`,
`LEJ-2026-08-drone-explosive`, `CTA-2026-08-etna-ash`.

**Stability matters more than elegance.** Once an ID is assigned, every later
`meaningful_update` for that event must reuse it exactly - the classify step's dedup
match against the ledger depends on exact-string comparison, not fuzzy matching. When in
doubt, search the ledger for the airport code and cause keywords before minting a new ID.

## Timestamps (schema v2)

The workflow script cannot generate a real timestamp - it has no `Date.now()`/`new
Date()` access, by design (it would break resumability). **The step that appends to
`data/signal-ledger.jsonl` is responsible for stamping timestamps**, not the classify
subagent and not the script:

- Get the real current time with `date -u +"%Y-%m-%dT%H:%M:%SZ"` (via Bash) immediately
  before writing.
- `last_updated_at` - always set to that current timestamp, for every line written this
  cycle.
- `first_detected_at` - if a ledger line for this `canonical_event_id` already exists,
  copy its `first_detected_at` forward unchanged. If this is the first line ever written
  for this ID, set it to the same current timestamp.

This mirrors the file's git history for anything migrated before schema v2 existed: the
migration script (`scripts/migrate_ledger_v2.py`) backfilled `first_detected_at` /
`last_updated_at` from the git commit that actually introduced each line, not a guess.
