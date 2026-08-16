export const meta = {
  name: 'airport-disruption-hourly-sweep',
  description: 'Global multilingual sweep for airport operational disruption signals, fanned out across source-bucket subagents, then deduped/classified against the running signal ledger',
  phases: [
    { title: 'Discover', detail: 'one agent per source bucket, global + multilingual queries' },
    { title: 'Classify', detail: 'dedupe against the ledger and assign workflow status' },
  ],
}

const SKILL_DIR = '.claude/skills/airport-disruption-hunter'
const LEDGER_PATH = 'data/signal-ledger.jsonl'

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
          sources: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                source_name: { type: 'string' },
                source_url: { type: 'string' },
                source_language: { type: 'string' },
              },
              required: ['source_url'],
            },
          },
          workflow_status: { type: 'string', enum: ['new_event', 'meaningful_update', 'duplicate', 'monitor', 'noise'] },
          confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
          reason: { type: 'string' },
          is_new_ledger_entry: { type: 'boolean' },
        },
        required: ['event_title', 'airport_name', 'country', 'signal_type', 'workflow_status', 'confidence', 'reason'],
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
  required: ['classified_events', 'cycle_summary'],
}

const BUCKETS = [
  { key: 'airport_authority', focus: 'official airport websites, newsroom pages, operational alerts, and airport social channels' },
  { key: 'civil_aviation_regulator', focus: 'civil aviation authorities, ATC/NOTAM sources, air navigation service providers, and regulator bulletins' },
  { key: 'labour_union', focus: 'union sites, strike calendars, industrial action bulletins, and labour federations covering ground handling, refuelling, cargo handling, security, ATC, and customs staff' },
  { key: 'cargo_logistics', focus: 'air cargo trade media, freight forwarders, express operators, cargo airline advisories, and customs broker updates' },
  { key: 'airline_operations', focus: 'airline operational advisories, flight suspension pages, and network disruption notices' },
  { key: 'local_language_news', focus: "local and regional news in the airport's local language(s), not just English coverage" },
  { key: 'weather_emergency', focus: 'meteorological authorities, and police/fire/emergency/security sources for airport-affecting incidents' },
]

phase('Discover')
const discoveries = await parallel(BUCKETS.map(b => () => agent(
  `You are the ${b.key} discovery role for a recall-first global airport-disruption signal hunter. ` +
  `Read ${SKILL_DIR}/references/source-strategy.md, ${SKILL_DIR}/references/query-development.md, and ` +
  `${SKILL_DIR}/references/multilingual-map.md for the search tactics and query patterns for your bucket. ` +
  `Your bucket focus: ${b.focus}. ` +
  `Use WebSearch (and WebFetch to verify specific pages) to hunt globally, in English and relevant local ` +
  `languages, for credible signals of airport operational disruption from roughly the last 24-48 hours: ` +
  `closures, runway/ATC/radar/cyber issues, strikes or labour action, cargo terminal or customs disruption, ` +
  `security incidents, weather impact, or reopening/recovery updates. Do not stop after 2-3 sources - search ` +
  `exhaustively across this bucket. Capture weak-but-credible signals; do not filter for relevance yourself, ` +
  `that happens in a later step. Return every candidate signal you find with full source attribution - a ` +
  `working source_url is required for each candidate.`,
  { label: `discover:${b.key}`, phase: 'Discover', schema: DISCOVER_SCHEMA }
)))

const merged = discoveries.flatMap((d, i) => (d && d.candidates ? d.candidates : []).map(c => ({ ...c, discovery_bucket: BUCKETS[i].key })))

log(`Discovery complete: ${merged.length} raw candidate signals across ${BUCKETS.length} buckets`)

phase('Classify')
const classification = await agent(
  `You are the deduplication and classification stage for a recall-first airport-disruption signal hunter. ` +
  `Read ${SKILL_DIR}/references/dedup-clustering.md and ${SKILL_DIR}/references/reference-examples.md for the ` +
  `rules. Read the file ${LEDGER_PATH} in this repo - it is a JSON-Lines ledger of previously seen events from ` +
  `earlier cycles (it may be empty on a first run). Here are this cycle's raw candidate signals as JSON:\n\n` +
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
  `or strike threat with no confirmed date, an early instance of a pattern that may be forming (e.g. one ` +
  `weather ground-stop at an airport that could see more), or a report pending official confirmation. ` +
  `noise = genuinely trivial - a single flight affected with no pattern or escalation risk, an incident ` +
  `resolved with no lasting operational effect, or a hoax/false alarm with no measurable disruption. ` +
  `Set is_new_ledger_entry to true only for events that should be appended to the ledger (new_event and ` +
  `meaningful_update). Return the classified events and a cycle summary.`,
  { label: 'classify-and-dedupe', phase: 'Classify', schema: CLASSIFY_SCHEMA }
)

return {
  raw_candidate_count: merged.length,
  classified_events: (classification && classification.classified_events) || [],
  cycle_summary: (classification && classification.cycle_summary) || {},
}
