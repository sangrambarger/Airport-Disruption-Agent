# Airport Disruption Signal Hunter Agent Pack

This folder is designed to be used with Google Antigravity `/goal` to create an EventWatch-style Airport Disruption Signal Hunter Agent.

The core design is intentionally **search-first and recall-first**. The Airport Disruption Signal Hunter Agent should not behave like a normal AI search assistant that finds 3-4 good sources and stops. Its job is to hunt exhaustively for early airport disruption signals across official, local, regional, aviation, cargo, labour, weather, security, social/public-alert, and multilingual sources.


## Agent Name and Role

**Agent Name:** Airport Disruption Signal Hunter Agent

**Role:** A recall-first EventWatch discovery agent that hunts globally for early airport disruption signals across official, local, regional, cargo, labour, aviation, weather, security, and multilingual sources, then deduplicates and classifies signals before analyst push.

## Folder Purpose

Use this pack to create an Airport Disruption Signal Hunter Agent that can:

1. Search aggressively for early airport disruption signals.
2. Generate smart multilingual queries and Google dork-style searches.
3. Coordinate teamwork-preview subagents by source type and language.
4. Capture weak but credible disruption signals without prematurely suppressing them.
5. Deduplicate titles, URLs, airports, and events across languages.
6. Track whether a story was already sent to analysts.
7. Classify findings as New Event, Meaningful Update, Duplicate, Monitor, or Noise.
8. Push only useful signals to analysts while preserving recall.

## Recommended Use in Antigravity

Paste `13_Goal_Prompt.md` into `/goal` first.
Then provide the full folder as the instruction workspace.

The most important files are:

- `01_Airport_Disruption_Signal_Hunter_Agent.md`
- `02_Search_Intelligence.md`
- `03_Source_Strategy.md`
- `04_Query_Development.md`
- `06_Subagent_Roles.md`
- `07_Signal_Ledger_Schema.json`
- `08_Deduplication_and_Clustering.md`
- `09_Classification_Already_Sent_Check.md`

## Key Philosophy

Hunters are recall-first.
Decision/classification is precision-first.
The ledger and deduplication layer prevent analyst noise.
The Search Intelligence layer prevents weak, shallow, English-only searching.
