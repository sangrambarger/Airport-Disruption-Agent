# Source Strategy

## Purpose

Airport disruptions often appear first in local, official, regional, labour, aviation, cargo,
flight-tracking, or social sources before they reach international media. Search where early
signals actually appear — and know that "where early signals appear" depends on *what kind* of
disruption it is, not one universal ranking.

## Which source wins the race, by disruption type

There is no single "earliest" bucket. Use this to decide where to search hardest and fastest for
a given signal, and to calibrate how surprised to be if a bucket finds nothing — silence from the
wrong bucket for a given disruption type is not evidence of nothing happening.

| Disruption type | Realistically first | Why |
|---|---|---|
| Weather/natural disaster, sudden security incident | Flight-tracking anomalies, social/eyewitness posts, NOTAM | No advance warning exists for these - speed is entirely about catching the immediate aftermath before anyone writes an article |
| Labour action (strike/walkout) | Union bulletins, strike notices | Often public *days or weeks* before any actual disruption - this is where we can be ahead of mainstream media by the widest margin, and it is literally what "notify of potential events" means |
| ATC/technical/cyber failure | NOTAM, flight-tracking, airport authority | An official record usually exists before general press picks it up |
| Cargo/customs-only disruption | Cargo/logistics trade press | Often invisible to passengers and to general news entirely - may **never** be covered by mainstream media at all, which makes this bucket not "faster" but sometimes the *only* source that will ever exist for the event |

Every bucket below carries an "earliness role" note reflecting where it sits in this table for the
disruption types it's most relevant to.

## Source Buckets

### 1. Flight Tracking & Live Status

**Earliness role: usually first, for anything that produces an immediate operational effect.**
This bucket did not have a dedicated search role before - it should. A cancellation/delay spike is
frequently visible before any article exists about *why* it's happening.

Sources:

- Public flight-tracker delay/cancellation views for the airport (FlightAware, FlightRadar24,
  Flightview, or equivalent)
- Airport-published live departures/arrivals boards where accessible
- Airline live status/ops pages

Look for:

- A sudden spike in cancellations/delays with no obvious published cause yet (the spike itself is
  the candidate signal - capture it even before you know why, and flag `event_status: unclear`)
- Ground-stop-shaped patterns (near-total suspension of departures/arrivals for a window)
- Diversions clustering around one airport

### 2. Social & Public Alert Sources

**Earliness role: usually first or tied-first for sudden incidents, and often the only advance
signal for something not yet officially confirmed.** Use cautiously - this bucket trades
confidence for speed, which is the correct trade for a first hint, not for a final answer.

Sources:

- Airport's own official social accounts (fastest official channel, faster than their newsroom
  page in practice)
- Aviation spotter/enthusiast accounts known for airport-specific reporting
- Local eyewitness/passenger posts describing an in-progress situation
- Local government/emergency-management social accounts, when the cause is weather/security/
  natural-disaster and the airport link isn't explicit yet

Look for:

- First-person "stuck at the airport," "runway closed," "everything cancelled" reports
- Airport or airline accounts posting real-time advisories before a formal press release exists
- Must be corroborated by a stronger source before promotion past `monitor`/`low confidence` where
  possible - capture it either way, classify conservatively.

### 3. Airport Authority Sources

**Earliness role: fast and authoritative once something is already happening; not usually first
for sudden incidents, but the fastest *confirming* source.**

Search official airport websites and public channels:

- Airport websites, newsroom pages, operational/advisory pages
- Airport X/Twitter, Facebook, LinkedIn (also covered faster in bucket 2 - check there too)
- Airport app/news pages where available

Look for: closure, reopening, operational restrictions, evacuations, security alerts, weather
notices, runway closures, cargo terminal notices, passenger warnings implying airport-wide
disruption.

### 4. Civil Aviation Authority / ATC / NOTAM Sources

**Earliness role: often the first *official record* for anything involving airspace, runway, or
ATC/radar - frequently exists before any journalist has written about it.**

Search national/regional aviation authorities and aviation operations sources:

- FAA-style aviation authority pages, CAA pages, DGCA equivalents
- NOTAM-style notices, ATC authority notices, air navigation service provider updates
- Airspace restriction notices, airport operational status feeds
- Aviation incident bulletins, regulator announcements

Look for: airport restrictions, safety orders, ATC disruption, runway restrictions/closure,
airport operating limitations, flight suspension notices, aerodrome-closed notices, navigation
issues.

### 5. Labour and Union Sources

**Earliness role: often first by days or weeks for strike-type events - a fresh strike notice
IS a candidate signal on its own, before any actual disruption has occurred.** Don't wait for
flights to actually be cancelled before treating a credible strike notice as worth capturing.

Sources: union websites and social pages, labour federations, strike calendars, industrial action
bulletins, collective bargaining updates, worker association notices.

Look for workers related to: ground handling, cargo handling, refuelling, airport security, ATC,
customs, ramp operations, aircraft maintenance, baggage handling when it may affect turnaround.

### 6. Cargo and Logistics Sources

**Earliness role: for cargo/customs-only disruption, this may be the only source that ever
covers it - not "faster than mainstream media" but potentially "instead of" mainstream media
entirely.** This is where the dark-corner-impact mission lives most directly - treat a real
signal here as high-value even with no corroborating passenger-media coverage at all.

Sources: air cargo trade media, freight forwarding media, express parcel operators, cargo airline
advisories, logistics company service alerts, airport cargo terminal notices, customs broker
updates.

Look for: cargo acceptance suspended, cargo terminal closed, freight backlog, cargo flight
cancellations, express operator disruption, customs cargo clearance delay, air freight capacity
reduction.

### 7. Airline Sources

**Earliness role: fast confirming source once a disruption is underway; rarely first.**

Search airline operational pages and advisories: airline travel alerts, airline cargo notices,
flight suspension pages, network disruption notices, operational statements, strike impact
advisories.

Look for: flights cancelled due to airport issue, cargo flights suspended, airport-specific
service disruption, route suspensions linked to operational disruption.

### 8. Local and Regional News

**Earliness role: a genuine competitive advantage area - local outlets in the local language are
frequently faster than international media, sometimes faster than official channels for
weather/incident-driven events.**

Search local city, regional, and airport-area media in local languages. Prioritize sources near
the airport city/region, industrial/logistics zones, and national aviation hubs. Use direct
local-language terms, not only English terms.

### 9. Weather Authority Sources

**Earliness role: fast for the cause, not always fast for the airport-specific effect** - a
severe-weather alert can exist well before anyone connects it explicitly to a specific airport's
operations; that connection is often first made in bucket 1 or 2.

Search official meteorological services and severe weather alerts. Look for airport warnings,
visibility disruption, snow/ice closures, wind/fog/ash/storm/flooding affecting runway/airport
operations.

## Police, Security, Emergency, and Customs

Folded into the weather/emergency bucket's remit rather than a separate search role: when an
incident involves evacuation, suspicious package, fire, explosion, accident, protest, or customs/
security disruption, the same bucket that watches weather authorities should also watch official
public-safety sources for these triggers.
