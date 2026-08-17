# Multilingual Search Map

## Purpose

Search directly in local languages — don't just translate English articles after discovery. Many
airport disruption signals appear first in local-language sources: airport pages, regional news,
union announcements, and city-level alerts.

## Language selection rule

For each airport, search:

1. English
2. Official/local language of the airport country
3. Major regional language if relevant
4. Additional language if the airport serves a cross-border or multilingual region

## Search memory per country

Track, per country/language, what's worked so future hunts don't restart from zero:

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

## Initial language coverage suggestions

Starting map — expand based on search results:

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

## Important rule

This map isn't fixed. Adapt it dynamically when a local source, local airport name, union term,
or regional wording is discovered mid-hunt.
