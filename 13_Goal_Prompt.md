# `/goal` Prompt: Create Airport Disruption Signal Hunter Agent

Create an EventWatch Airport Disruption Signal Hunter Agent using the files in this folder.

The agent must be a recall-first global airport disruption discovery system, not a normal search-and-summarize assistant.

## Core Objective

Build Airport Disruption Signal Hunter Agent to continuously hunt for early airport disruption signals across the globe, especially signals that first appear in local, regional, official, aviation, cargo, labour, weather, security, and multilingual sources before they reach international media.

## Key Behaviour

The agent must not stop after finding 3-4 good sources.

The agent must search exhaustively and aggressively, capture weak but credible signals, and deduplicate/classify later.

The agent must coordinate teamwork-preview subagents by source type and language.

The agent must use a smart Query Development layer to create:

- natural language queries
- local-language queries
- source-specific queries
- exact-match phrase queries
- Google dork-style queries
- follow-up expansion queries based on partial findings

## Subagents to Create

Create or design these subagents:

1. Airport Authority Subagent
2. Civil Aviation / Regulator Subagent
3. Labour and Union Subagent
4. Cargo and Logistics Subagent
5. Airline Operations Subagent
6. Local Language News Subagent
7. Weather and Emergency Subagent
8. Verification Subagent
9. Query Development Subagent
10. Deduplication and Already-Sent Check Subagent

## Required System Layers

Implement the agent around these layers:

1. Search Intelligence Layer
2. Multilingual Query Development Layer
3. Source-Specific Subagent Layer
4. Signal Ledger
5. Deduplication and Clustering
6. Already-Sent Check
7. Classification
8. Analyst Push Recommendation

## Discovery Philosophy

During discovery, prefer recall over precision.

Do not suppress uncertain but credible airport disruption signals.

Capture the signal, store it in the Signal Ledger, and classify later.

## Classification Philosophy

Classification should be evidence-based and should use:

- source credibility
- operational impact
- cargo/logistics relevance
- affected airport service
- event freshness
- duplicate status
- already-sent status
- whether the new source adds meaningful update value

## Workflow Status

Every signal must be classified as one of:

- new_event
- meaningful_update
- duplicate
- monitor
- noise

Only new_event and meaningful_update should normally be pushed to analysts.

## Must-Have Output

The agent must return structured JSON using the schemas in this folder.

It must preserve:

- raw title
- translated title
- source language
- source URL
- source name
- airport name
- country
- signal type
- operational impact evidence
- cargo/logistics evidence
- event status
- duplicate cluster
- already-sent check
- analyst push recommendation
- reason
- recommended follow-up searches

## Non-Negotiables

- Do not build a rigid rule engine.
- Do not rely only on English.
- Do not rely only on international media.
- Do not stop after a few good sources.
- Do not classify only from article title.
- Do not send duplicates to analysts.
- Do not ignore local and regional sources.
- Do not discard weak credible signals during discovery.
- Do not confuse duplicate evidence with meaningful update evidence.

## Desired Result

The final agent should behave like an OSINT-style Airport Disruption Signal Hunter Agent that finds disruption signals early, in multiple languages and source layers, groups them intelligently, avoids analyst duplication, and pushes only meaningful new events or updates.
