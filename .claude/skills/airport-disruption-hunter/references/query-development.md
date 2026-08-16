# Query Development

## Purpose

Don't depend on a fixed keyword list. Create, expand, localize, and improve queries based on
source type, geography, airport, language, event signal, and prior results.

## What each query pack should include

For a given search cycle, generate:

1. English natural language queries
2. Local-language queries
3. Exact-match phrase queries
4. Source-specific queries
5. Google dork-style queries
6. Follow-up expansion queries
7. Negative/noise-reduction terms where useful

## Inputs to consider

For each search cycle:

- Airport name
- IATA code
- ICAO code
- City
- Country
- Local airport name variants
- Local language
- Event focus
- Source bucket
- Current signals found
- Recent noisy queries
- Successful previous queries
- Whether the search is broad discovery or follow-up verification

## Core query groups

### 1. Airport Closure and Operations

airport closed · airport closure · airport shutdown · operations suspended · departures
suspended · arrivals suspended · airport reopened · operations resumed

### 2. Runway and Airside Operations

runway closed · runway unavailable · runway inspection · runway damage · runway blocked ·
aircraft incident runway · airport capacity reduced

### 3. Labour and Strike Signals

airport strike · ground handling strike · refuelling strike · fuel workers strike · security
staff strike · cargo handlers strike · ATC strike · customs strike · walkout · industrial
action · union notice · labour dispute

### 4. Cargo and Freight Signals

cargo terminal disruption · cargo operations suspended · air cargo delays · freight operations
airport · cargo flights cancelled · customs cargo delay · cargo warehouse closed · cargo
acceptance suspended · air freight backlog

### 5. Technical, ATC, Radar, Cyber, and IT Signals

ATC failure · radar failure · airport IT outage · airport cyberattack · navigation system
failure · check-in outage causing disruption · airport systems failure

### 6. Security, Customs, and Emergency Signals

airport evacuated · suspicious package airport · security alert airport · customs disruption
airport · cargo screening delay · gas leak airport · fire at airport operations · explosion
airport

### 7. Weather Impact Signals

airport closed weather · flights suspended due to weather · fog disrupts airport operations ·
snow closes airport · storm disrupts airport · airport diversions weather

## Google dork-style query patterns

```text
"[airport name]" "airport closed"
"[airport name]" "flights suspended"
"[airport name]" "runway closed"
"[airport name]" "operations resumed"
"[airport name]" "cargo terminal"
"[airport name]" "ground handling strike"
"[airport name]" "refueling strike"
"[airport name]" "security staff strike"
site:[airport-domain] "operations"
site:[airport-domain] "closed"
site:[aviation-authority-domain] "[airport name]"
site:[union-domain] "airport" "strike"
site:[cargo-media-domain] "[airport name]"
```

## Follow-up expansion rule

When any signal is found, create follow-up queries from the extracted entities.

Example signal:

```text
Refuelling workers threaten strike at Gatwick.
```

Generate:

```text
Gatwick refuelling strike date
Gatwick fuel workers strike airlines affected
Gatwick airport warning strike
Gatwick flight cancellations refuelling strike
Gatwick cargo flights refuelling disruption
union Gatwick fuel workers strike
```

## Query learning rule

At the end of each cycle, note (in the search-cycle summary output):

- queries that found useful signals
- queries that found duplicate-heavy results
- queries that produced irrelevant passenger-only noise
- local-language terms that worked well
- new source domains discovered
- recommended query changes for next cycle
