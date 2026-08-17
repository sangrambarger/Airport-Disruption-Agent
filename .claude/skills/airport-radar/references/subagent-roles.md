# Discovery Roles (for Agent-tool parallelization)

## Parent role

The main hunt orchestrates discovery, receives findings, deduplicates signals, checks
already-surfaced status, classifies events, and decides what to report.

The parent shouldn't perform all searches itself when the hunt is broad — spawn one Agent per
role below and merge results before deduplication.

## Role philosophy

Each spawned agent is a discovery agent: its job is to find signals, not to decide final
reporting eligibility. When uncertain, it should return the signal with evidence and a confidence
level rather than dropping it.

## Recommended roles

### 1. Flight Tracking & Live Status

Searches public flight-tracker delay/cancellation views and airline live-status pages for the
airport. Often the earliest visible signal of all - a cancellation/delay spike is frequently
observable before any article exists explaining why. See `source-strategy.md` bucket 1.

Output focus: sudden cancellation/delay spikes (capture even with `event_status: unclear` if the
cause isn't yet known), ground-stop-shaped patterns, diversion clustering.

### 2. Social & Public Alert

Searches the airport's own social accounts, aviation spotter accounts, and eyewitness/passenger
posts. Trades confidence for speed on purpose - this is the "before mainstream media" bucket for
sudden incidents. See `source-strategy.md` bucket 2.

Output focus: first-person in-progress reports, official social posts that predate a formal press
release, local emergency-management posts for weather/security causes. Classify conservatively -
low confidence until corroborated, but capture regardless.

### 3. Airport Authority

Searches official airport sources and public airport channels.

Output focus: airport status, closure/reopening, runway restrictions, security alerts,
operational notices, cargo terminal notices.

### 4. Civil Aviation / Regulator

Searches aviation authorities, regulators, and air navigation sources.

Output focus: airport restrictions, ATC/radar/navigation issues, safety notices, airspace and
runway limitations.

### 5. Labour and Union

Searches airport labour, union, strike, and industrial action sources.

Output focus: strike threats, confirmed strike dates, worker category, affected airport services
(ground handling, security, ATC, customs, refuelling, cargo handling).

### 6. Cargo and Logistics

Searches cargo, air freight, logistics, courier, and freight forwarder sources.

Output focus: cargo terminal disruption, cargo acceptance changes, freight backlog, cargo flight
disruption, express operator disruption, logistics impact.

### 7. Airline Operations

Searches airline operational advisories and cargo updates.

Output focus: airport-specific flight suspensions, cargo flight disruption, route impact, mass
cancellations, strike impact on airline operations.

### 8. Local Language News

Searches local and regional sources in relevant local languages.

Output focus: early disruption signals, airport-area reports, local strike reports, regional
weather/incident reports, source language and title translation.

### 9. Weather and Emergency

Searches weather, police, fire, emergency, and security sources.

Output focus: airport weather disruption, evacuation, fire/explosion/gas leak, security incident,
airport access restrictions.

### 10. Verification

Takes candidate signals from the other roles and searches for confirming or contradictory
evidence.

Output focus: official confirmation, alternate source confirmation, outdated-or-resolved event
check, current status.

## Required output fields per role

Every role must return structured findings, not prose only:

```json
{
  "raw_title": "",
  "translated_title": "",
  "source_name": "",
  "source_url": "",
  "source_language": "",
  "published_time": "",
  "first_seen_time": "",
  "airport_name_raw": "",
  "airport_name_normalised": "",
  "country": "",
  "signal_type": "",
  "evidence_summary": "",
  "operational_impact_evidence": "",
  "cargo_relevance_evidence": "",
  "event_status": "planned/ongoing/resolved/unclear",
  "candidate_confidence": "high/medium/low"
}
```

This matches `candidate_signal_output` in `../assets/output-schemas.json` — return exactly this
shape so the parent can merge results without re-parsing prose.
