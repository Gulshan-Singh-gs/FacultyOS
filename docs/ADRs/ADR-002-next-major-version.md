# ADR-002: Next.js Major Version (16.4.0) Compatibility on Cloudflare Workers

## Context
`PRD-BRD-TRD.md §TRD-1` initially referenced Next.js 15. The workspace initialized with Next.js 16 (`16.4.0`) running Turbopack, React 19 (`19.3.0`), and `@opennextjs/cloudflare` (`1.20.9`).

## Decision & Evidence
We confirm Next.js 16.4.0 operates cleanly on the Workers runtime using `@opennextjs/cloudflare`.
- Evidence: Full build compilation (`npx next build`) succeeds with clean static/dynamic prerender splits.
- D1 and edge bindings resolve cleanly with `@cloudflare/workers-types` and local migration execution.
- Rollback pin: In the event of unforeseen edge runtime regressions, dependencies can be pinned to `next@15.2.x` and `react@19.0.x`.

## Status
Accepted. `PRD-BRD-TRD.md §TRD-1` amended accordingly.
