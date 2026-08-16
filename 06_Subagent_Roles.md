# Teamwork Preview Subagent Roles

## Parent Agent: Airport Disruption Signal Hunter Agent

Airport Disruption Signal Hunter Agent orchestrates subagents, receives findings, deduplicates signals, checks already-sent status, classifies events, and decides whether to push to analysts.

The parent agent should not perform all searches itself.

## Subagent Philosophy

Subagents are discovery agents.

Their job is to find signals, not to decide final notification eligibility.

When uncertain, return the signal with evidence and confidence.

## Recommended Subagents

### 1. Airport Authority Subagent

Searches official airport sources and public airport channels.

Output focus:

- airport status
- closure/reopening
- runway restrictions
- security alerts
- operational notices
- cargo terminal notices

### 2. Civil Aviation / Regulator Subagent

Searches aviation authorities, regulators, and air navigation sources.

Output focus:

- airport restrictions
- ATC/radar/navigation issues
- safety notices
- airspace and runway limitations

### 3. Labour and Union Subagent

Searches airport labour, union, strike, and industrial action sources.

Output focus:

- strike threats
- confirmed strike dates
- worker category
- affected airport services
- ground handling, security, ATC, customs, refuelling, cargo handling

### 4. Cargo and Logistics Subagent

Searches cargo, air freight, logistics, courier, and freight forwarder sources.

Output focus:

- cargo terminal disruption
- cargo acceptance changes
- freight backlog
- cargo flight disruption
- express operator disruption
- logistics impact

### 5. Airline Operations Subagent

Searches airline operational advisories and cargo updates.

Output focus:

- airport-specific flight suspensions
- cargo flight disruption
- route impact
- mass cancellations
- strike impact on airline operations

### 6. Local Language News Subagent

Searches local and regional sources in relevant local languages.

Output focus:

- early disruption signals
- airport-area reports
- local strike reports
- regional weather/incident reports
- source language and title translation

### 7. Weather and Emergency Subagent

Searches weather, police, fire, emergency, and security sources.

Output focus:

- airport weather disruption
- evacuation
- fire/explosion/gas leak
- security incident
- airport access restrictions

### 8. Verification Subagent

Takes candidate signals and searches for confirming or contradictory evidence.

Output focus:

- official confirmation
- alternate source confirmation
- outdated or resolved event check
- current status

## Subagent Output Requirements

Every subagent must return structured findings, not prose only.

Required fields:

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
