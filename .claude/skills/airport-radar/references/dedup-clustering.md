# Deduplication and Clustering

## Purpose

Exhaustive multilingual search creates duplicates. Capture many signals without flooding the
final report with redundant items — but do this *after* discovery, not before.

## Don't deduplicate by title alone

Titles vary across languages and source types. These titles may all refer to the same event:

- Ground handlers at Naples airport announce strike
- Strike to affect Capodichino airport operations
- Italian airport workers plan walkout in Naples
- Disagi in aeroporto per sciopero a Capodichino

They should cluster together if the airport, date, cause, and affected service match.

## Event fingerprint

Use a combined fingerprint:

```text
airport_name_normalised
+ country
+ approximate event date/time
+ cause
+ affected_service
+ signal_type
```

## Clustering status

Each signal becomes one of:

- `new_cluster`
- `belongs_to_existing_cluster`
- `possible_duplicate_needs_review`
- `conflicting_update`
- `recovery_update`

## Meaningful update vs. duplicate

A new source is a **meaningful update** if it adds material information such as:

- Closure started / extended
- Airport reopened
- Cargo operations suspended / resumed
- Strike date confirmed / called off
- Additional airports added
- Departures/arrivals suspended
- Runway reopened
- ATC/radar restored
- Cancellation/diversion scale materially increased
- Official source confirms an earlier local report

A new source is usually a **duplicate** if it only repeats: same event, same airport, same cause,
same status, no new operational impact, no new cargo/logistics evidence, no meaningful timing
change.

## Cross-language deduplication

Translate titles and summaries into English for comparison, but preserve the original title and
language in the ledger.

Match airport names using: official English name, local name, IATA code, ICAO code, city name,
known alternate airport names.

## Noise control

Don't surface duplicate reports unless they add meaningful new evidence or change the risk
picture.
