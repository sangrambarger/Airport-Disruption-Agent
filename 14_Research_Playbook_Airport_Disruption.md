# Research Playbook: Airport Disruption

Part of the EventWatch research playbook set. See `../research-playbooks.md` for the shared universal source classes and research rules that apply to every event type, and `../../governance/threshold-rulebook.md` for this event type's reportability rules (this file only covers how to research it, not whether it's reportable).

## Airport Disruption

### Research Objective

Determine whether airport operations, cargo movement, flight schedules, terminal operations, runway operations, airspace access, or logistics flows have been disrupted.

### Mandatory Fact Categories

- Airport name
- City, state/province, country
- Disruption cause
- Disruption start date and time
- Terminals, runways, cargo operations, passenger operations, or airspace affected
- Flight cancellations, diversions, suspensions, or delays
- Cargo/freight impact if reported
- Expected duration or recovery status
- Authority or operator confirmation

### Source Priority

#### Priority 1 Sources
- Airport authority or airport operations page
- Civil aviation authority
- NOTAM or aviation advisory source
- Airport social media/official advisory if it is the primary operational channel

#### Priority 2 Sources
- Airlines and cargo carriers
- Local government or emergency management agency
- Airport cargo terminal operator
- Logistics providers

#### Priority 3 Sources
- Local/native-language news
- Aviation trade media
- International news

### Local Language Strategy

Use local-language research when airport advisories, local government notices, flight disruption reports, or local coverage are not available in English. Local-language searches are especially important for non-English airport authorities and regional airports.

### Operational Verification Strategy

Verify whether the disruption affects flights, air cargo, runways, terminals, customs clearance, ground handling, freight movement, or access roads. Do not treat a minor passenger delay as cargo or supply-chain disruption unless cargo or freight impact is confirmed.

### Advanced Search Tactics

- **Check the airport authority's own operations/status page and NOTAMs before news coverage** —
  these are the actual Priority 1 source and update faster/more precisely than wire reports for
  runway closures, ground stops, and terminal status.
- **Separately verify cargo/freight impact, not just passenger disruption** — the threshold rule
  turns on cargo specifically ("passenger-only with no cargo impact" is Discard); a headline
  about flight delays doesn't tell you whether cargo operations are affected at all.
- **For a non-mapped airport, research whether it handles cargo at all** before spending more
  research time on it — `threshold-rulebook.md` discards non-mapped/no-cargo airports outright,
  so confirming cargo activity (or its absence) early avoids wasted research on a Discard case.
- **Check `reference/warroom/port-airport-criticality.md` early** for context on how critical
  this specific airport is to covered industries — useful for prioritizing which operational
  facts matter most to chase down.

### Verification Cross-Checks

- **Distinguish "disruption is passenger-only" from "cargo unconfirmed either way"** — the
  latter needs more research, not an assumption that no cargo mention means no cargo impact.
- **For a labor-related disruption, verify whether it actually disrupts airport operations**
  (flights, cargo, ground handling) or is confined to non-operational premises — a labor dispute
  with confirmed contingency plans holding stays classified as Labor Disruption at its own
  priority, not reclassified here; see `warroom-decision-and-geometry.md`'s initiating-cause
  principle and the real worked example in
  `examples/warroom-packages/airport_disruption_labor_strike.pdf`.

### Common Pitfalls for This Event Type

- Treating a hangar/parking-lot fire with no flight impact as reportable — `threshold-rulebook.md`
  discards this explicitly; confirm actual flight/cargo impact before treating any airport
  incident as this event type.
- Applying the >24h/<24h radius distinction before actually confirming whether the airport is
  mapped or not — the geometry rule branches on both dimensions (mapped vs. non-mapped, and
  duration), not duration alone.
- Missing a nationwide strike's requirement for **individual polygons over every mapped and
  cargo-bearing non-mapped airport**, not one country-wide polygon — a common shortcut that
  understates or overstates exposure depending on which airports actually matter.

### Escalation Triggers

- If a disruption crosses the 24-hour mark (or is expected to), escalate — this is the specific
  threshold that changes the WarRoom geometry from a manual polygon over the airport to a
  100 km radius, per `threshold-rulebook.md` and `warroom-decision-and-geometry.md`.
- If a strike ballot's status changes from unconfirmed to confirmed, or contingency plans that
  were holding stop holding, re-check whether this event should now be reclassified from Labor
  Disruption to Airport Disruption.

### Research Completion Criteria

Research is complete when the airport, disruption cause, operational status, affected operations, source confirmation, and recovery status are known or explicitly unavailable.

---

