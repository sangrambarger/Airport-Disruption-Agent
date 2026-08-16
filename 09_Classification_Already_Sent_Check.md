# Classification and Already-Sent Check

## Purpose

Airport Disruption Signal Hunter Agent must classify every candidate signal but only push useful items to analysts.

The system should classify before analyst push, then check already-sent status before sending.

## Workflow Statuses

### new_event

Use when the signal points to a disruption not previously captured in the ledger.

### meaningful_update

Use when the event already exists but the new signal changes the risk picture.

### duplicate

Use when the source repeats an already-known event without adding material information.

### monitor

Use when the signal is credible but too incomplete for analyst push.

### noise

Use when the signal is irrelevant, passenger-only, old/resolved with no impact, or unrelated to airport operations/cargo/logistics.

## Analyst Push Rule

Normally push only:

- `new_event`
- `meaningful_update`

Hold:

- `monitor`

Do not push:

- `duplicate`
- `noise`

## Already-Sent Check

Before sending anything to analysts, check:

1. Was the same airport/event already sent?
2. Was the same title or equivalent translated title already sent?
3. Is the new signal only a duplicate?
4. Does the new source add useful official confirmation?
5. Does it change status, impact, duration, cargo relevance, affected services, or recovery?

## Classification Evidence

Do not classify only from title.

Use:

- source credibility
- operational impact evidence
- cargo/logistics relevance
- airport/service affected
- event status
- timestamp/freshness
- duplicate cluster
- already-sent status

## Classification Output

Return:

```json
{
  "workflow_status": "new_event/meaningful_update/duplicate/monitor/noise",
  "analyst_push_recommendation": "push/hold/do_not_push",
  "already_sent_check": {
    "already_sent": "yes/no/unclear",
    "matched_event_id": "",
    "is_meaningful_update": "yes/no/unclear",
    "update_reason": ""
  },
  "reason": "",
  "evidence_used": []
}
```
