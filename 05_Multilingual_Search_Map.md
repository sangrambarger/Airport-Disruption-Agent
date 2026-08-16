# Multilingual Search Map

## Purpose

Airport Disruption Signal Hunter Agent must search directly in local languages, not only translate English articles after discovery.

Many airport disruption signals appear first in local-language sources, including airport pages, regional news, union announcements, and city-level alerts.

## Language Selection Rule

For each airport, search:

1. English
2. Official/local language of the airport country
3. Major regional language if relevant
4. Additional language if the airport serves a cross-border or multilingual region

## Search Memory Per Country

Maintain search memory by country/language:

```json
{
  "country": "",
  "languages": [],
  "airport_terms": [],
  "closure_terms": [],
  "strike_terms": [],
  "cargo_terms": [],
  "operations_terms": [],
  "technical_terms": [],
  "security_terms": [],
  "high_value_sources": [],
  "successful_queries": [],
  "noisy_queries": []
}
```

## Initial Language Coverage Suggestions

Use this as a starting map. Expand based on search results.

- France: French + English
- Germany: German + English
- Spain: Spanish + Catalan where relevant + English
- Italy: Italian + English
- Portugal/Brazil: Portuguese + English
- Netherlands/Belgium: Dutch/French where relevant + English
- Japan: Japanese + English
- China/Hong Kong/Taiwan: Chinese + English
- South Korea: Korean + English
- Turkey: Turkish + English
- Middle East: Arabic + English, plus local official language when relevant
- India: English + Hindi + state language where useful
- Russia/CIS: Russian + English
- Thailand: Thai + English
- Vietnam: Vietnamese + English
- Indonesia: Indonesian + English
- Malaysia: Malay + English
- Philippines: English + Filipino where useful
- Latin America: Spanish or Portuguese + English
- Nordics: local language + English
- Central/Eastern Europe: local language + English

## Important Rule

The multilingual search map is not fixed. The Query Development Agent should adapt it dynamically when a local source, local airport name, union term, or regional wording is discovered.
