# Reference Examples

These examples are only for context — calibration, not rigid rules. Reason from operational
consequences, source credibility, cargo/logistics relevance, flight-count/operational scale, and
event status. Cargo/logistics relevance is one path to reportability, not a gate everything else
must pass through — a large-scale passenger-only disruption or an emerging pattern at one airport
can be just as reportable as a confirmed cargo impact.

## Strong candidate signals — `new_event` / `meaningful_update`

- Airport closed due to technical failure.
- Runway closed after aircraft incident, causing diversions.
- Ground handling workers announce confirmed airport strike.
- Cargo terminal suspends acceptance; customs cargo processing halted.
- Radar failure disrupts departures and arrivals.
- Airport evacuation stops terminal or flight operations.
- Severe weather causes airport-wide cancellations/diversions.
- **Passenger-only strike or disruption at real scale** — e.g. dozens or more flights cancelled
  across multiple bases, even with no cargo/freighter angle. Scale of operational impact is
  reportable on its own; it doesn't need a cargo angle to matter.
- **A materialized instance of a recurring pattern at the same airport** — e.g. a second or third
  weather ground-stop, runway closure, or ATC restriction at one airport within a short window.
  The individual instance may look routine, but the pattern itself is the signal worth tracking.

## Monitor-worthy signals — credible but not yet at reportable scale

- Strike ballot or strike threat with no confirmed date yet, but real underlying dispute
  (unresolved pay/staffing/safety dispute, union statements, escalating rhetoric).
- A single instance of a disruption type that could be the start of a pattern (e.g. one weather
  ground-stop at an airport that has a track record of them) — hold at `monitor` and watch for a
  second instance or escalation.
- Reports pending official confirmation (unconfirmed closures, disputed resolution status,
  stale-looking advisories where currency is unclear).

## Weak or usually non-reportable signals — `noise`

- Baggage delays only, with no flight-level impact.
- Passenger queues only, no operational consequence.
- Airport parking fire or similar incident with normal flight operations continuing throughout.
- A single flight cancellation/incident with no pattern, no escalation risk, and no material
  operational impact beyond that one flight (e.g. one detained-passenger incident, one hoax
  threat with no ground stop, one accidental equipment discharge at a screening checkpoint).
- Minor incident resolved quickly with no lasting operational effect and no sign of recurrence.

## Important reminder

A weak signal can still be captured in discovery if credible — it may later resolve to `monitor`,
`duplicate`, or `noise` once classified. Capturing it isn't the same as reporting it. But don't
default to `noise` just because a signal lacks a cargo angle or isn't yet officially confirmed —
check it against the operational-scale and pattern criteria above first.
