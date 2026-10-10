# ADR-003: Dynamic OpenGraph Image Generation via Next.js ImageResponse (Satori)

## Context
A high-converting, professional marketing surface requires dynamic, brand-consistent OpenGraph and Twitter card previews (1200×630). Static raster assets create maintenance overhead and lack theme fidelity.

## Decision
We utilize Next.js's built-in `ImageResponse` (backed by `@vercel/og` and the Satori JSX-to-SVG/PNG rendering engine) in `src/app/opengraph-image.tsx` and `/api/og`. 

- **Rationale:** `next/og` is bundled into Next.js core, requiring zero new external npm runtime dependencies while leveraging Satori's deterministic SVG layout engine.
- **Visual Style:** Renders the NeuGlass brand mark ("F" gradient crest), primary headline, and trust badge row ("Zero Medical Data • Deterministic Engine") directly at 1200×630.
- **Rollback / Fallback:** Should edge image generation ever encounter runtime constraints, a static fallback image at `public/og-default.png` is provided.

## Status
Accepted.
