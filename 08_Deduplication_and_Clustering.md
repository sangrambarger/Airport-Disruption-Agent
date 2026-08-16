# Deduplication and Clustering

## Purpose

Exhaustive multilingual search will create duplicates. Airport Disruption Signal Hunter Agent must capture many signals without flooding analysts.

Deduplication must happen after discovery, not before discovery.

## Do Not Deduplicate Only by Title

Titles vary across languages and source types.

Example titles may refer to the same event:

- Ground handlers at Naples airport announce strike
- Strike to affect Capodichino airport operations
- Italian airport workers plan walkout in Naples
- Disagi in aeroporto per sciopero a Capodichino

These should cluster together if the airport, date, cause, and affected service match.

## Event Fingerprint

Use a combined fingerprint:

```text
airport_name_normalised
+ country
+ approximate event date/time
+ cause
+ affected_service
+ signal_type
```

## Clustering Status

Each signal should become one of:

- `new_cluster`
- `belongs_to_existing_cluster`
- `possible_duplicate_needs_review`
- `conflicting_update`
- `recovery_update`

## Meaningful Update vs Duplicate

A new source is a meaningful update if it adds material information such as:

- Closure started
- Closure extended
- Airport reopened
- Cargo operations suspended
- Cargo operations resumed
- Strike date confirmed
- Strike called off
- Additional airports added
- Departures/arrivals suspended
- Runway reopened
- ATC/radar restored
- Cancellation/diversion scale materially increased
- Official source confirms earlier local report

A new source is usually a duplicate if it only repeats:

- same event
- same airport
- same cause
- same status
- no new operational impact
- no new cargo/logistics evidence
- no meaningful timing change

## Cross-Language Deduplication

Translate titles and summaries into English for comparison, but preserve original title and language in the ledger.

Match airport names using:

- official English name
- local name
- IATA code
- ICAO code
- city name
- known alternate airport names

## Analyst Noise Control

Do not push duplicate reports to analysts unless they add meaningful new evidence or change the risk picture.
