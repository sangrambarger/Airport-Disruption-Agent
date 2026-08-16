# Search Intelligence

## Purpose

The Search Intelligence layer is the most important part of Airport Disruption Signal Hunter Agent.

Normal AI search tools are optimized to retrieve a few high-quality answers. Airport Disruption Signal Hunter Agent is different. It must discover the earliest and widest possible set of credible airport disruption signals.

## Operating Principle

The goal is not:

```text
Find 3-4 good stories and stop.
```

The goal is:

```text
Find all credible early signals.
Find local-language signals.
Find official notices.
Find regional stories before international media.
Find weak but credible signals and deduplicate later.
```

## Search Intelligence Responsibilities

Airport Disruption Signal Hunter Agent must:

1. Generate search queries dynamically.
2. Search in English and relevant local languages.
3. Use source-specific discovery tactics.
4. Use natural language queries and exact-match queries.
5. Use Google dork-style queries when helpful.
6. Expand queries based on partial findings.
7. Track successful and poor queries.
8. Learn which language terms work for each country.
9. Promote sources that repeatedly break early airport stories.
10. Downgrade noisy queries that return passenger-only or irrelevant content.

## Search Cycle Behaviour

Every search cycle should produce:

- New candidate signals
- Duplicate candidates
- Updated evidence for existing events
- Failed/noisy queries
- New useful search terms
- New useful sources
- Suggested query improvements for the next cycle

## Recall-First Instruction

If a source is credible and the signal may involve airport operations, cargo movement, critical services, or future disruption, capture it.

Do not reject it during search only because notification eligibility is unclear.

Classification happens later.
