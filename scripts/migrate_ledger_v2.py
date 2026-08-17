#!/usr/bin/env python3
"""
One-time migration: data/signal-ledger.jsonl v1 -> v2 (schema in
.claude/skills/airport-disruption-hunter/assets/output-schemas.json).

Adds, per line, without touching any existing field:
  - ledger_schema_version: 2
  - first_detected_at / last_updated_at, backfilled from real git commit
    timestamps (the commit that actually added each line), not invented.
  - impact{...}, backfilled by best-effort regex extraction from the existing
    operational_impact/cargo_or_logistics_relevance text, tagged
    extraction_method="heuristic_backfill" so it's never confused with a
    real agent-reported figure from a post-v2 cycle.

Rerunnable: skips any line that already has ledger_schema_version >= 2.
Must be run with the repo root as the working directory (uses relative git
paths and `git show <commit>:<path>`).
"""
import json
import re
import subprocess
import sys

LEDGER_PATH = "data/signal-ledger.jsonl"


def sh(cmd):
    return subprocess.run(cmd, shell=True, capture_output=True, text=True, check=True).stdout


def commit_line_ranges(path):
    """Return [(start_line, end_line_inclusive, commit_iso_timestamp), ...] in
    chronological order, derived from real git history (append-only file)."""
    log = sh(f"git log --format='%H|%aI' --follow -- {path}").strip().splitlines()
    commits = [line.split("|") for line in log][::-1]  # oldest first
    ranges = []
    prev_count = 0
    for commit_hash, ts in commits:
        try:
            content = sh(f"git show {commit_hash}:{path}")
        except subprocess.CalledProcessError:
            continue
        count = len([l for l in content.split("\n") if l.strip()]) if content.strip() else 0
        if count > prev_count:
            ranges.append((prev_count + 1, count, ts))
        prev_count = count
    return ranges


def timestamp_for_line(line_no, ranges, fallback):
    for start, end, ts in ranges:
        if start <= line_no <= end:
            return ts
    return fallback




def extract_count(text, keyword_pattern):
    if not text:
        return None
    best = None
    for m in re.finditer(r"([\d,]{2,7})\s*\+?\s*(\w[\w\s\-]{0,20})", text):
        num = m.group(1).replace(",", "")
        ctx = m.group(2).lower()
        if re.search(keyword_pattern, ctx):
            try:
                n = int(num)
            except ValueError:
                continue
            if best is None or n > best:
                best = n
    return best


def cargo_relevance_level(text):
    if not text:
        return "none"
    t = text.lower()
    if any(p in t for p in ["none", "no cargo", "not established", "no direct cargo", "low direct cargo", "not identified"]):
        return "none"
    if any(p in t for p in ["cargo hub", "cargo gateway", "freighter", "belly cargo", "cargo terminal", "cargo/export", "cargo workforce", "cargo-specific"]):
        return "direct"
    return "possible"


def backfill_impact(entry):
    op = entry.get("operational_impact", "") or ""
    cargo_text = entry.get("cargo_or_logistics_relevance", "") or ""
    level = cargo_relevance_level(cargo_text)
    return {
        "flights_cancelled": extract_count(op, r"cancell"),
        "flights_delayed": extract_count(op, r"delay"),
        "passengers_affected": extract_count(op, r"passenger"),
        "duration_days": None,
        "cargo_confirmed": level == "direct",
        "cargo_relevance_level": level,
        "extraction_method": "heuristic_backfill",
    }


def main():
    ranges = commit_line_ranges(LEDGER_PATH)
    if not ranges:
        print("No git history found for the ledger - refusing to guess timestamps.", file=sys.stderr)
        sys.exit(1)
    fallback_ts = ranges[-1][2]

    with open(LEDGER_PATH, "r", encoding="utf-8") as f:
        lines = [l for l in f.read().split("\n") if l.strip()]

    first_seen = {}
    migrated = 0
    out_lines = []
    for i, line in enumerate(lines, start=1):
        entry = json.loads(line)
        if entry.get("ledger_schema_version", 1) >= 2:
            out_lines.append(json.dumps(entry, ensure_ascii=False))
            continue

        ts = timestamp_for_line(i, ranges, fallback_ts)
        cid = entry.get("canonical_event_id")
        if cid not in first_seen:
            first_seen[cid] = ts

        entry["ledger_schema_version"] = 2
        entry["first_detected_at"] = first_seen[cid]
        entry["last_updated_at"] = ts
        entry["impact"] = backfill_impact(entry)
        migrated += 1
        out_lines.append(json.dumps(entry, ensure_ascii=False))

    with open(LEDGER_PATH, "w", encoding="utf-8") as f:
        f.write("\n".join(out_lines) + "\n")

    print(f"Migrated {migrated} of {len(lines)} lines to schema v2 ({len(lines) - migrated} already at v2).")


if __name__ == "__main__":
    main()
