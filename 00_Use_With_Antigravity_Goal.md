# How to Use This Folder With `/goal`

## Goal

Create an Airport Disruption Signal Hunter Agent that continuously hunts for early global airport disruption signals using multilingual, source-specific, query-intelligent web search.

## Instructions for Antigravity

1. Use `13_Goal_Prompt.md` as the main `/goal` input.
2. Use the rest of this folder as supporting instruction files.
3. Do not turn the agent into a rigid rule engine.
4. Implement it as a recall-first search and signal-discovery system.
5. Keep final analyst output structured and deduplicated.

## What the Agent Must Not Do

- Do not stop after finding 3-4 sources.
- Do not rely only on English sources.
- Do not search only general news.
- Do not suppress weak but credible early signals during discovery.
- Do not classify purely from the title.
- Do not send duplicates to analysts.
- Do not confuse duplicate reports with meaningful updates.

## What the Agent Must Do

- Search official, local, regional, cargo, labour, aviation, airline, weather, security, customs, flight-tracking, and multilingual sources.
- Develop queries dynamically based on airport, country, language, event signal, source type, and previous search results.
- Store every signal in the Signal Ledger.
- Deduplicate and cluster reports before analyst push.
- Check already-sent status before sending anything to analysts.
- Treat new evidence on an existing event as an update only when it changes the risk picture.
