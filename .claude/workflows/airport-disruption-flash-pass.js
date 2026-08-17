export const meta = {
  name: 'airport-disruption-flash-pass',
  description: 'Fast, narrow sweep of official/fast-moving airport-disruption sources since the last successful flash pass - the minutes-level catch, not the recall-complete one',
  phases: [
    { title: 'Discover', detail: 'airport authority, civil aviation/NOTAM, airline ops, weather/emergency' },
    { title: 'Classify', detail: 'dedupe against the ledger and assign workflow status' },
  ],
}

const SKILL_DIR = '.claude/skills/airport-disruption-hunter'
const LEDGER_PATH = 'data/signal-ledger.jsonl'
const PASS_TYPE = 'flash'
const FALLBACK_WINDOW = '2 hours'

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

const BUCKETS = [
  { key: 'airport_authority', focus: 'official airport websites, newsroom pages, operational alerts, and airport social channels' },
  { key: 'civil_aviation_regulator', focus: 'civil aviation authorities, ATC/NOTAM sources, air navigation service providers, and regulator bulletins' },
  { key: 'airline_operations', focus: 'airline operational advisories, flight suspension pages, and network disruption notices' },
  { key: 'weather_emergency', focus: 'meteorological authorities, and police/fire/emergency/security sources for airport-affecting incidents' },
]

const regionScope = (args && args.regionScope && args.regionScope.mode === 'regions' && args.regionScope.include_regions && args.regionScope.include_regions.length)
  ? `Restrict this hunt to the following regions/countries/airport codes only - do not report signals outside them: ${args.regionScope.include_regions.join(', ')}. `
  : ''
const excludeScope = (args && args.regionScope && args.regionScope.exclude_regions && args.regionScope.exclude_regions.length)
  ? `Exclude the following regions/countries/airport codes even if otherwise in scope: ${args.regionScope.exclude_regions.join(', ')}. `
  : ''
const sinceTimestamp = args && args.sinceTimestamp
const recencyInstruction = sinceTimestamp
  ? `Restrict to signals first reported or materially updated since ${sinceTimestamp} (the last successful ${PASS_TYPE} pass) - a candidate whose evidence is entirely older than that, with nothing new since, is out of scope for THIS cycle even if it is a real disruption; older ground gets covered by the deep pass and is likely already in the ledger. `
  : `No confirmed last-successful-pass timestamp was supplied - fall back to the last ${FALLBACK_WINDOW} rather than a wider window. `
const pendingCandidates = (args && Array.isArray(args.pendingCandidates)) ? args.pendingCandidates : []

phase('Discover')
const discoveries = await parallel(BUCKETS.map(b => () => agent(
  `You are the ${b.key} discovery role for the FLASH pass of a recall-first global airport-disruption ` +
  `signal hunter - the fast, narrow pass, not the deep recall sweep. Read ${SKILL_DIR}/references/source-strategy.md ` +
  `and ${SKILL_DIR}/references/query-development.md for tactics. Your bucket focus: ${b.focus}. ` +
  `${regionScope}${excludeScope}${recencyInstruction}` +
  `Prefer enumerable official feeds over generic search where they exist for this bucket - airport-authority ` +
  `status/RSS pages, NOTAM portals, aviation-safety databases are exhaustive by construction; hit them directly ` +
  `before falling back to open WebSearch. Search iteratively: after your first batch of queries, generate ` +
  `follow-up queries from new entities/keywords you've found, and keep going until two consecutive new queries ` +
  `surface nothing you haven't already seen - don't stop at a fixed batch size. If a single source or page is ` +
  `unresponsive or a query yields nothing after two attempts, move on immediately rather than retrying it further ` +
  `- speed is this pass's whole purpose. Capture weak-but-credible signals; do not filter for relevance yourself, ` +
  `that happens in a later step. Return every candidate signal with full source attribution - a working ` +
  `source_url is required for each candidate - and fill impact_estimate from whatever the evidence actually ` +
  `states, leaving any field null rather than guessing a number.`,
  { label: `discover:${b.key}`, phase: 'Discover', schema: DISCOVER_SCHEMA }
)))

const merged = discoveries.flatMap((d, i) => (d && d.candidates ? d.candidates : []).map(c => ({ ...c, discovery_bucket: BUCKETS[i].key })))
  .concat(pendingCandidates)

log(`Discovery complete: ${merged.length} raw candidate signals across ${BUCKETS.length} flash buckets` + (pendingCandidates.length ? ` (including ${pendingCandidates.length} carried over from a prior failed cycle)` : ''))

phase('Classify')
let classification = null
let classificationError = null
try {
  classification = await agent(
    `You are the deduplication and classification stage for the FLASH pass of a recall-first airport-disruption ` +
    `signal hunter. Read ${SKILL_DIR}/references/dedup-clustering.md and ${SKILL_DIR}/references/reference-examples.md ` +
    `for the rules. Read the file ${LEDGER_PATH} in this repo - it is a JSON-Lines ledger of previously seen events ` +
    `(it may be empty on a first run). Here are this cycle's raw candidate signals as JSON:\n\n` +
    `${JSON.stringify(merged)}\n\n` +
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
    `pending official confirmation. noise = genuinely trivial - a single flight affected with no pattern or ` +
    `escalation risk, an incident resolved with no lasting operational effect, or a hoax/false alarm. ` +
    `Set is_new_ledger_entry to true for new_event, meaningful_update, AND monitor events not already in the ` +
    `ledger; leave it false for duplicate and noise. For every classified event, also set impact: reconcile ` +
    `the impact_estimate fields the candidates in its cluster reported (prefer the largest well-sourced figure ` +
    `over a smaller stale one, not a sum of possibly-overlapping counts), leaving a field null if no candidate ` +
    `had evidence for it; set cargo_confirmed true only when cargo_relevance_level is "direct"; set ` +
    `extraction_method to "agent_reported". Separately, return candidate_dispositions: exactly one entry per ` +
    `raw candidate signal in the input above (match by its source_url, every candidate must appear exactly ` +
    `once), recording verdict, matched_canonical_event_id (null if none), and a one-sentence dedupe_reason - ` +
    `this is the audit trail for verifying duplicate detection later, so be specific. Return the classified ` +
    `events, candidate_dispositions, and a cycle summary.`,
    { label: 'classify-and-dedupe', phase: 'Classify', schema: CLASSIFY_SCHEMA }
  )
} catch (err) {
  classificationError = String((err && err.message) || err)
}

if (classificationError) {
  log(`Classification failed this cycle: ${classificationError}. Returning ${merged.length} raw candidates unclassified.`)
  return {
    pass_type: PASS_TYPE,
    raw_candidate_count: merged.length,
    raw_candidates: merged.map(c => ({ ...c, dedup_verdict: 'unclassified', matched_canonical_event_id: null, dedupe_reason: 'classification_failed this cycle' })),
    classified_events: [],
    candidate_dispositions: [],
    cycle_summary: {},
    classification_failed: true,
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

return {
  pass_type: PASS_TYPE,
  raw_candidate_count: merged.length,
  raw_candidates: rawCandidates,
  classified_events: (classification && classification.classified_events) || [],
  cycle_summary: (classification && classification.cycle_summary) || {},
  classification_failed: false,
}
