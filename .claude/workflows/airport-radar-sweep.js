export const meta = {
  name: 'airport-radar-sweep',
  description: 'One sweep, two scopes: a narrow fast-source scope and a full recall-complete scope, chosen by args.scope. Discover -> Classify -> Council -> digest-ready output.',
  phases: [
    { title: 'Discover', detail: 'one agent per source bucket for the chosen scope' },
    { title: 'Classify', detail: 'dedupe against the ledger and assign an initial workflow status' },
    { title: 'Council', detail: 'independent re-check against the threshold rulebook, plus severity delta and dark-corner impact' },
  ],
}

const SKILL_DIR = '.claude/skills/airport-radar'
const LEDGER_PATH = 'data/signal-ledger.jsonl'
const scope = (args && args.scope === 'deep') ? 'deep' : 'flash'
const FALLBACK_WINDOW = scope === 'deep' ? '10 hours' : '3 hours'

const IMPACT_SCHEMA = {
  type: 'object',
  properties: {
    flights_cancelled: { type: ['number', 'null'] },
    flights_delayed: { type: ['number', 'null'] },
    passengers_affected: { type: ['number', 'null'] },
    duration_days: { type: ['number', 'null'] },
    cargo_confirmed: { type: 'boolean' },
    cargo_relevance_level: { type: 'string', enum: ['direct', 'possible', 'none'] },
  },
}

const DISCOVER_SCHEMA = {
  type: 'object',
  properties: {
    candidates: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          raw_title: { type: 'string' },
          translated_title: { type: 'string' },
          source_name: { type: 'string' },
          source_url: { type: 'string' },
          source_language: { type: 'string' },
          published_time: { type: 'string' },
          first_seen_time: { type: 'string' },
          airport_name_raw: { type: 'string' },
          airport_name_normalised: { type: 'string' },
          country: { type: 'string' },
          signal_type: { type: 'string' },
          evidence_summary: { type: 'string' },
          operational_impact_evidence: { type: 'string' },
          cargo_relevance_evidence: { type: 'string' },
          event_status: { type: 'string', enum: ['planned', 'ongoing', 'resolved', 'unclear'] },
          candidate_confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
          impact_estimate: IMPACT_SCHEMA,
        },
        required: ['raw_title', 'source_name', 'source_url', 'airport_name_raw', 'signal_type', 'evidence_summary', 'event_status', 'candidate_confidence'],
      },
    },
    queries_used: { type: 'array', items: { type: 'string' } },
    notes: { type: 'string' },
  },
  required: ['candidates'],
}

const CLASSIFY_SCHEMA = {
  type: 'object',
  properties: {
    classified_events: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          canonical_event_id: { type: 'string' },
          event_title: { type: 'string' },
          airport_name: { type: 'string' },
          country: { type: 'string' },
          signal_type: { type: 'string' },
          cause: { type: 'string' },
          affected_service: { type: 'string' },
          event_status: { type: 'string' },
          operational_impact: { type: 'string' },
          cargo_or_logistics_relevance: { type: 'string' },
          impact: {
            type: 'object',
            properties: { ...IMPACT_SCHEMA.properties, extraction_method: { type: 'string', enum: ['agent_reported', 'heuristic_backfill'] } },
            required: ['cargo_confirmed', 'cargo_relevance_level', 'extraction_method'],
          },
          sources: {
            type: 'array',
            items: {
              type: 'object',
              properties: { source_name: { type: 'string' }, source_url: { type: 'string' }, source_language: { type: 'string' } },
              required: ['source_url'],
            },
          },
          workflow_status: { type: 'string', enum: ['new_event', 'meaningful_update', 'duplicate', 'monitor', 'noise'] },
          confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
          reason: { type: 'string' },
          is_new_ledger_entry: { type: 'boolean' },
        },
        required: ['event_title', 'airport_name', 'country', 'signal_type', 'workflow_status', 'confidence', 'reason', 'impact'],
      },
    },
    candidate_dispositions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          source_url: { type: 'string' },
          verdict: { type: 'string', enum: ['new_cluster', 'matched_existing_event', 'duplicate_within_batch', 'noise'] },
          matched_canonical_event_id: { type: ['string', 'null'] },
          dedupe_reason: { type: 'string' },
        },
        required: ['source_url', 'verdict', 'dedupe_reason'],
      },
    },
    cycle_summary: {
      type: 'object',
      properties: {
        candidate_signals_found: { type: 'number' },
        new_events: { type: 'number' },
        meaningful_updates: { type: 'number' },
        duplicates: { type: 'number' },
        monitor_items: { type: 'number' },
        noise_items: { type: 'number' },
        notes: { type: 'string' },
      },
    },
  },
  required: ['classified_events', 'candidate_dispositions', 'cycle_summary'],
}

const COUNCIL_SCHEMA = {
  type: 'object',
  properties: {
    reviewed_events: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          event_index: { type: 'number' },
          council_verdict: { type: 'string', enum: ['confirmed', 'downgraded_to_monitor', 'downgraded_to_noise', 'escalated_to_new_event'] },
          final_workflow_status: { type: 'string', enum: ['new_event', 'meaningful_update', 'duplicate', 'monitor', 'noise'] },
          severity_delta: { type: 'string', enum: ['new', 'escalated_major', 'escalated_minor', 'unchanged', 'de_escalated', 'resolved'] },
          dark_corner_impact: { type: ['string', 'null'] },
          council_reason: { type: 'string' },
        },
        required: ['event_index', 'council_verdict', 'final_workflow_status', 'severity_delta', 'council_reason'],
      },
    },
  },
  required: ['reviewed_events'],
}

const FLASH_BUCKETS = [
  { key: 'flight_tracking_live_status', focus: 'public flight-tracker delay/cancellation views and airline live-status pages for the airport - often the earliest visible signal of all' },
  { key: 'social_eyewitness', focus: "the airport's own social accounts, aviation spotter accounts, and eyewitness/passenger posts - trades confidence for speed on purpose" },
  { key: 'airport_authority', focus: 'official airport websites, newsroom pages, operational alerts, and airport social channels' },
  { key: 'civil_aviation_regulator', focus: 'civil aviation authorities, ATC/NOTAM sources, air navigation service providers, and regulator bulletins' },
  { key: 'airline_operations', focus: 'airline operational advisories, flight suspension pages, and network disruption notices' },
  { key: 'weather_emergency', focus: 'meteorological authorities, and police/fire/emergency/security sources for airport-affecting incidents' },
]
const DEEP_ONLY_BUCKETS = [
  { key: 'labour_union', focus: 'union sites, strike calendars, industrial action bulletins, and labour federations covering ground handling, refuelling, cargo handling, security, ATC, and customs staff - often the earliest bucket of all for strike-type events, sometimes by days or weeks' },
  { key: 'cargo_logistics', focus: 'air cargo trade media, freight forwarders, express operators, cargo airline advisories, and customs broker updates - for a cargo/customs-only disruption this may be the only source that ever covers it, not merely the fastest one' },
  { key: 'local_language_news', focus: "local and regional news in the airport's local language(s), not just English coverage" },
]
const BUCKETS = scope === 'deep' ? [...FLASH_BUCKETS, ...DEEP_ONLY_BUCKETS] : FLASH_BUCKETS

const regionScope = (args && args.regionScope && args.regionScope.mode === 'regions' && args.regionScope.include_regions && args.regionScope.include_regions.length)
  ? `Restrict this hunt to the following regions/countries/airport codes only - do not report signals outside them: ${args.regionScope.include_regions.join(', ')}. `
  : ''
const excludeScope = (args && args.regionScope && args.regionScope.exclude_regions && args.regionScope.exclude_regions.length)
  ? `Exclude the following regions/countries/airport codes even if otherwise in scope: ${args.regionScope.exclude_regions.join(', ')}. `
  : ''
const sinceTimestamp = args && args.sinceTimestamp
const recencyInstruction = sinceTimestamp
  ? (scope === 'flash'
    ? `Restrict to signals first reported or materially updated since ${sinceTimestamp} (the last successful sweep) - a candidate whose evidence is entirely older than that, with nothing new since, is out of scope for THIS cycle even if it is a real disruption. `
    : `Focus on signals first reported or materially updated since ${sinceTimestamp} (the last successful full-scope sweep), but don't treat that as a hard cutoff: a slow-burn story (an unresolved dispute, a recurring pattern) that predates it is still in scope if it's not already accurately reflected in the ledger. `)
  : `No confirmed last-successful-sweep timestamp was supplied - fall back to the last ${FALLBACK_WINDOW} as your primary window. `
const pendingCandidates = (args && Array.isArray(args.pendingCandidates)) ? args.pendingCandidates : []

phase('Discover')
const discoveries = await parallel(BUCKETS.map(b => () => agent(
  `You are the ${b.key} discovery role for a recall-first global airport-disruption signal hunter, running the ` +
  `${scope === 'deep' ? 'DEEP, recall-complete' : 'FLASH, fast-and-narrow'} scope this cycle. Read ` +
  `${SKILL_DIR}/references/source-strategy.md, ${SKILL_DIR}/references/query-development.md` +
  `${scope === 'deep' ? `, and ${SKILL_DIR}/references/multilingual-map.md` : ''} for tactics. Your bucket focus: ` +
  `${b.focus}. ${regionScope}${excludeScope}${recencyInstruction}` +
  `Prefer enumerable official feeds over generic search where they exist for this bucket - hit them directly ` +
  `before falling back to open WebSearch. Search iteratively: after your first batch of queries, generate ` +
  `follow-up queries from new entities/keywords you've found, and keep going until two consecutive new queries ` +
  `surface nothing you haven't already seen - do not stop at a fixed batch size, and do not cap your own depth; ` +
  `exhaustive recall is the point. If a single source or page is unresponsive or a query yields nothing after ` +
  `two attempts, move on immediately rather than retrying it further. Capture weak-but-credible signals; do not ` +
  `filter for relevance yourself, that happens in a later step. Return every candidate signal with full source ` +
  `attribution - a working source_url is required for each candidate - and fill impact_estimate from whatever ` +
  `the evidence actually states, leaving any field null rather than guessing a number.`,
  { label: `discover:${b.key}`, phase: 'Discover', schema: DISCOVER_SCHEMA }
)))

const merged = discoveries.flatMap((d, i) => (d && d.candidates ? d.candidates : []).map(c => ({ ...c, discovery_bucket: BUCKETS[i].key })))
  .concat(pendingCandidates)

log(`Discovery complete: ${merged.length} raw candidate signals across ${BUCKETS.length} ${scope} buckets` + (pendingCandidates.length ? ` (including ${pendingCandidates.length} carried over from a prior failed cycle)` : ''))

phase('Classify')
let classification = null
let classificationError = null
try {
  classification = await agent(
    `You are the deduplication and classification stage for a recall-first airport-disruption signal hunter ` +
    `(${scope} scope this cycle). Read ${SKILL_DIR}/references/dedup-clustering.md and ` +
    `${SKILL_DIR}/references/reference-examples.md for the rules. Read the file ${LEDGER_PATH} in this repo - it ` +
    `is a JSON-Lines ledger of previously seen events (it may be empty on a first run). Here are this cycle's ` +
    `raw candidate signals as JSON:\n\n${JSON.stringify(merged)}\n\n` +
    `Cluster candidates that describe the same underlying event across languages/sources (match by airport, ` +
    `approximate date, cause, and affected service - not by title text alone). For each resulting event, assign ` +
    `workflow_status by comparing against the ledger and against the other candidates in this batch. ` +
    `Cargo/logistics relevance is one path to reportability, not the only one - do not default an event to ` +
    `noise just because it lacks a cargo angle or isn't yet officially confirmed. new_event = not in the ledger ` +
    `at all, and it clears the bar on any of: confirmed cargo/logistics impact; real operational/flight-count ` +
    `impact at meaningful scale (dozens of flights cancelled/diverted/grounded, not a single flight); or a ` +
    `materialized instance of a recurring pattern at that airport worth tracking going forward. ` +
    `meaningful_update = already in the ledger but this adds material new evidence (status change, ` +
    `escalation/recovery, cargo impact confirmed, scale materially increased). duplicate = repeats a ledger ` +
    `entry with nothing new. monitor = not yet at reportable scale but worth tracking - an unresolved dispute ` +
    `or strike threat with no confirmed date, an early instance of a pattern that may be forming, or a report ` +
    `pending official confirmation (including a single uncorroborated social/eyewitness signal - capture it at ` +
    `monitor, don't discard it just because nothing else has confirmed it yet). noise = genuinely trivial - a ` +
    `single flight affected with no pattern or escalation risk, an incident resolved with no lasting operational ` +
    `effect, or a hoax/false alarm. Set is_new_ledger_entry to true for new_event, meaningful_update, AND ` +
    `monitor events not already in the ledger; leave it false for duplicate and noise. For every classified ` +
    `event, also set impact: reconcile the impact_estimate fields the candidates in its cluster reported (prefer ` +
    `the largest well-sourced figure over a smaller stale one, not a sum of possibly-overlapping counts), ` +
    `leaving a field null if no candidate had evidence for it; set cargo_confirmed true only when ` +
    `cargo_relevance_level is "direct"; set extraction_method to "agent_reported". Separately, return ` +
    `candidate_dispositions: exactly one entry per raw candidate signal in the input above (match by its ` +
    `source_url, every candidate must appear exactly once), recording verdict, matched_canonical_event_id (null ` +
    `if none), and a one-sentence dedupe_reason - this is the audit trail for verifying duplicate detection ` +
    `later, so be specific. Return the classified events, candidate_dispositions, and a cycle summary.`,
    { label: 'classify-and-dedupe', phase: 'Classify', schema: CLASSIFY_SCHEMA }
  )
} catch (err) {
  classificationError = String((err && err.message) || err)
}

if (classificationError) {
  log(`Classification failed this cycle: ${classificationError}. Returning ${merged.length} raw candidates unclassified for checkpointing.`)
  return {
    scope,
    raw_candidate_count: merged.length,
    raw_candidates: merged.map(c => ({ ...c, dedup_verdict: 'unclassified', matched_canonical_event_id: null, dedupe_reason: 'classification_failed this cycle' })),
    classified_events: [],
    candidate_dispositions: [],
    cycle_summary: {},
    classification_failed: true,
    council_failed: false,
    error: classificationError,
  }
}

const dispositionByUrl = new Map(((classification && classification.candidate_dispositions) || []).map(d => [d.source_url, d]))
const rawCandidates = merged.map(c => {
  const disposition = dispositionByUrl.get(c.source_url)
  return {
    ...c,
    dedup_verdict: disposition ? disposition.verdict : 'unclassified',
    matched_canonical_event_id: disposition ? disposition.matched_canonical_event_id : null,
    dedupe_reason: disposition ? disposition.dedupe_reason : 'classify stage did not return a disposition for this source_url',
  }
})

const classifiedEvents = (classification && classification.classified_events) || []

phase('Council')
const reviewableIndices = classifiedEvents
  .map((e, i) => ({ e, i }))
  .filter(({ e }) => ['new_event', 'meaningful_update', 'monitor'].includes(e.workflow_status))
  .map(({ i }) => i)

let councilFailed = false
let councilByIndex = new Map()
if (reviewableIndices.length) {
  try {
    const reviewable = reviewableIndices.map(i => ({ event_index: i, ...classifiedEvents[i] }))
    const council = await agent(
      `You are the Council - the independent second read for a recall-first airport-disruption signal hunter. ` +
      `Read ${SKILL_DIR}/references/threshold-rulebook.md (your actual rulebook), ` +
      `${SKILL_DIR}/references/dedup-clustering.md, and ${SKILL_DIR}/references/reference-examples.md. Read ` +
      `${SKILL_DIR}/assets/service-dependency-graph.json and ${SKILL_DIR}/assets/cargo-hub-tiers.json for the ` +
      `dark-corner-impact reasoning. Read ${LEDGER_PATH} to find the most recent prior line (if any) for each ` +
      `event's canonical_event_id, to judge severity_delta against - compare against the ledger's last entry, ` +
      `not the event's original first-ever entry. Here are this cycle's classified events that need review ` +
      `(events already excluded as duplicate/noise are not included - don't re-litigate them):\n\n` +
      `${JSON.stringify(reviewable)}\n\n` +
      `For each, independently re-read the evidence and reason cold - don't just check whether Classify's status ` +
      `matches its own stated reason, actually judge whether the evidence supports that status. Per ` +
      `threshold-rulebook.md, actively hunt for: scale inflation from a single incident, unconfirmed rumor ` +
      `treated as fact, resolved-with-no-lasting-effect dressed up as ongoing, a rephrased duplicate treated as ` +
      `a new development, and a pattern-of-one treated as a trend. Set council_verdict and final_workflow_status ` +
      `accordingly (confirmed events keep Classify's status as final_workflow_status; downgrades/escalations ` +
      `change it). Compute severity_delta against the ledger's most recent line for this event (new if none ` +
      `exists). Draft dark_corner_impact only when there's a real, non-generic supply-chain inference to draw ` +
      `from the dependency graph and cargo-hub tiers - leave it null rather than inventing a generic line, and ` +
      `never name a specific company or shipment unless the evidence actually says so. Return reviewed_events, ` +
      `one entry per event_index given above, every one accounted for.`,
      { label: 'council-review', phase: 'Council', schema: COUNCIL_SCHEMA }
    )
    councilByIndex = new Map((council.reviewed_events || []).map(r => [r.event_index, r]))
  } catch (err) {
    councilFailed = true
    log(`Council review failed this cycle: ${String((err && err.message) || err)}. Shipping Classify's own verdicts unreviewed.`)
  }
}

const finalClassifiedEvents = classifiedEvents.map((e, i) => {
  const review = councilByIndex.get(i)
  if (!review) {
    return { ...e, council_verdict: 'not_reviewed', severity_delta: null, dark_corner_impact: null }
  }
  return {
    ...e,
    workflow_status: review.final_workflow_status,
    council_verdict: review.council_verdict,
    severity_delta: review.severity_delta,
    dark_corner_impact: review.dark_corner_impact || null,
    reason: `${e.reason} | Council: ${review.council_reason}`,
  }
})

return {
  scope,
  raw_candidate_count: merged.length,
  raw_candidates: rawCandidates,
  classified_events: finalClassifiedEvents,
  cycle_summary: (classification && classification.cycle_summary) || {},
  classification_failed: false,
  council_failed: councilFailed,
}
