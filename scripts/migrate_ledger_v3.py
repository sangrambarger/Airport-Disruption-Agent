#!/usr/bin/env python3
"""
One-time migration: data/signal-ledger.jsonl v2 -> v3 (schema in
.claude/skills/airport-radar/assets/output-schemas.json).

Adds, per line, without touching any existing field:
  - ledger_schema_version: 3
  - council_verdict: "not_reviewed" - these lines predate the Council pass; there is
    no real Council judgment to backfill, so this is honest rather than invented.
  - dark_corner_impact: null - same reasoning; a real supply-chain-propagation
    narrative needs actual reasoning against the dependency graph, not a mechanical
    backfill, so it's left null rather than fabricated.
  - severity_delta: mechanically inferred from each line's own impact numbers versus
    the previous ledger line (in file order) sharing the same canonical_event_id -
    "new" if there is no previous line, otherwise a coarse escalated/unchanged/
    de_escalated/resolved call from the numbers already present. This is a real
    inference from real data, not a guess, but it is not the same thing as a Council
    read of the actual evidence text - treat it as a reasonable approximation for
    historical lines, not as equivalent to what Council produces going forward.

Rerunnable: skips any line that already has ledger_schema_version >= 3.
Must be run with the repo root as the working directory.
"""
import json

LEDGER_PATH = "data/signal-ledger.jsonl"


def infer_severity_delta(entry, prior):
    if prior is None:
        return "new"

    status = (entry.get("event_status") or "").lower()
    prior_status = (prior.get("event_status") or "").lower()
    if "resolved" in status and "resolved" not in prior_status:
        return "resolved"

    impact = entry.get("impact") or {}
    prior_impact = prior.get("impact") or {}
    best_ratio = None
    for field in ("flights_cancelled", "flights_delayed", "passengers_affected"):
        cur = impact.get(field)
        prev = prior_impact.get(field)
        if cur is None or prev is None:
            continue
        if prev == 0:
            continue
        ratio = cur / prev
        if best_ratio is None or abs(ratio - 1) > abs(best_ratio - 1):
            best_ratio = ratio

    if best_ratio is None:
        return "unchanged"
    if best_ratio >= 1.5:
        return "escalated_major"
    if best_ratio > 1.05:
        return "escalated_minor"
    if best_ratio < 0.67:
        return "de_escalated"
    return "unchanged"


def main():
    with open(LEDGER_PATH, "r", encoding="utf-8") as f:
        lines = [l for l in f.read().split("\n") if l.strip()]

    last_by_id = {}
    migrated = 0
    out_lines = []
    for line in lines:
        entry = json.loads(line)
        cid = entry.get("canonical_event_id")

        if entry.get("ledger_schema_version", 1) >= 3:
            last_by_id[cid] = entry
            out_lines.append(json.dumps(entry, ensure_ascii=False))
            continue

        prior = last_by_id.get(cid)
        entry["ledger_schema_version"] = 3
        entry["council_verdict"] = "not_reviewed"
        entry["dark_corner_impact"] = None
        entry["severity_delta"] = infer_severity_delta(entry, prior)
        migrated += 1

        last_by_id[cid] = entry
        out_lines.append(json.dumps(entry, ensure_ascii=False))

    with open(LEDGER_PATH, "w", encoding="utf-8") as f:
        f.write("\n".join(out_lines) + "\n")

    print(f"Migrated {migrated} of {len(lines)} lines to schema v3 ({len(lines) - migrated} already at v3).")


if __name__ == "__main__":
    main()
