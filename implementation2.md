Understood. From here on, I act as **architect and planner**, not coder. Below is the complete, agent-executable implementation plan. Save it at the repo root as **`IMPLEMENTATION_PLAN.md`**, next to `AGENTS.md`, `MVP.md`, `PRD-BRD-TRD.md`, and `UI.md`.

---

# IMPLEMENTATION_PLAN.md — FacultyOS Agent Execution Plan

## 0. How This Plan Works

### 0.1 Session protocol (mandatory for every agent session)

1. Read, in order: `AGENTS.md` → `IMPLEMENTATION_PLAN.md` (this file) → the doc sections listed in the task's **Refs**.
2. Run `docs inventory`: check which deliverables of the current task already exist. **Never rebuild existing, passing code.** Extend or fix it instead.
3. Execute exactly **one task ID** per session unless the human explicitly batches tasks.
4. Run the task's **Gates** before finishing.
5. Tick the task checkbox in this file AND the matching checkbox in `MVP.md`.
6. Append a session record to `docs/AGENT_LOG.md`:
   `date | task ID | files touched | gates result | notes`.
7. Commit with the task's suggested commit message.

### 0.2 Task state

`[ ]` = not started · `[~]` = in progress · `[x]` = done and gated.

### 0.3 Change control (stop-and-ask triggers)

The agent MUST stop and ask the human before:

- Adding any npm dependency.
- Changing the D1 schema beyond `PRD-BRD-TRD.md §TRD-2` (write a proposal in `docs/ADRs/` first).
- Changing pricing, plan limits, or payment provider.
- Adding any AI capability not listed in Phase 3.
- Touching anything that could collect medical/mental-health data.
- Any ambiguity where `MVP.md`, `PRD-BRD-TRD.md`, and `UI.md` disagree.

### 0.4 Global gates (run after every task)

```bash
pnpm lint && pnpm typecheck && pnpm test
```

Phase-exit gates additionally run:

```bash
pnpm build && pnpm preview     # verify on Workers runtime
pnpm db:migrate:local          # when schema changed
```

---

## 1. Phase 0 — Bootstrap & Inventory

**Goal:** repo is toolchain-complete, infra-bound, CI-green, and the agent knows exactly what already exists.

- [x] **T0.1 Repo inventory & gap analysis**
  - Goal: produce `docs/GAP.md` listing existing files vs. this plan's deliverables.
  - Refs: this plan §2 repo map; `PRD-BRD-TRD.md §TRD`.
  - Deliverable: `docs/GAP.md` only. No code changes.
  - Acceptance: every task deliverable in Phases 1–4 is marked `exists | partial | missing`.
  - Commit: `docs: add gap analysis`.

- [x] **T0.2 Toolchain verification**
  - Goal: Next.js 15 App Router + `@opennextjs/cloudflare`, TS strict, Tailwind v3, ESLint, Vitest configured; `package.json` scripts match TRD (`dev/build/preview/deploy/lint/typecheck/test/db:*`).
  - Refs: `PRD-BRD-TRD.md §TRD-1, §TRD-7`.
  - Acceptance: `pnpm preview` boots locally on Workers runtime; `tsc --noEmit` clean.
  - Commit: `chore: verify toolchain`.

- [x] **T0.3 Cloudflare bindings & secrets contract**
  - Goal: `wrangler.toml` declares D1, KV, R2, Queues (`notifications`, `ai-jobs`), AI binding; create `.dev.vars.example` and `docs/SECRETS.md` listing every secret name (no values).
  - Refs: `PRD-BRD-TRD.md §TRD-1, §TRD-5`.
  - Acceptance: `wrangler dev` starts with all bindings resolvable locally.
  - Commit: `chore(infra): bindings and secrets contract`.

- [x] **T0.4 Database baseline**
  - Goal: `src/server/db/schema.ts` contains ALL tables from TRD §2 (domain + Better Auth tables); migration generated and applied locally.
  - Refs: `PRD-BRD-TRD.md §TRD-2`.
  - Acceptance: `pnpm db:generate && pnpm db:migrate:local` succeeds; `wrangler d1 execute` shows all tables.
  - Tests: none (schema only).
  - Commit: `feat(db): baseline schema and migration`.

- [x] **T0.5 CI pipeline**
  - Goal: GitHub Actions with `gates` job (lint/typecheck/test) and `deploy` job (migrate + deploy) gated on main.
  - Refs: `PRD-BRD-TRD.md §TRD-7`.
  - Acceptance: PR opens → gates run; merge to main → deploy runs (secrets may be placeholder until human adds them).
  - Commit: `ci: gates and deploy pipeline`.

- [x] **T0.6 Test harness**
  - Goal: Vitest configured with path aliases; one placeholder suite passing.
  - Acceptance: `pnpm test` green.
  - Commit: `test: harness`.

**Phase 0 exit:** all gates green on a clean checkout; `docs/GAP.md` published.

---

## 2. Phase 1 — Identity, Courses, Shell

**Goal:** a professor can sign up, exist as a profile, own courses, and see a calm dashboard in NeuGlass UI.

- [x] **T1.1 Auth server**
  - Goal: Better Auth configured for D1 (drizzle adapter, sqlite), route handler at `/api/auth/[...all]`, session cookie prefix `facultyos`.
  - Refs: `PRD-BRD-TRD.md §TRD-1, §TRD-5`.
  - Acceptance: signup/login API works against local D1.
  - Commit: `feat(auth): server config and route handler`.

- [x] **T1.2 Auth UI**
  - Goal: `/login` and `/signup` pages using glass card per `UI.md §Screen 2`; error states calm and non-alarming.
  - Refs: `UI.md` (signup/login, error states).
  - Acceptance: manual pass — signup creates session; wrong password shows inline error, no stack trace.
  - Commit: `feat(auth): login and signup UI`.

- [x] **T1.3 Profile bootstrap & session helper**
  - Goal: on user creation, auto-insert `professor_profiles` + default `boundaries`; add `requireProfile()` server helper that redirects unauthenticated users.
  - Refs: `PRD-BRD-TRD.md §TRD-2`.
  - Acceptance: new signup lands on dashboard with a profile row existing.
  - Commit: `feat(auth): profile provisioning`.

- [x] **T1.4 Plan limits service**
  - Goal: `PLAN_LIMITS` constant per BRD §4; `assertCanCreateCourse` + `PlanLimitError`.
  - Refs: `PRD-BRD-TRD.md §BRD-4`.
  - Tests: unit — free plan blocks 2nd active course; pro allows 20.
  - Commit: `feat(billing): plan limits service`.

- [x] **T1.5 Course actions**
  - Goal: `createCourse` and `rotateCourseToken` server actions; Zod input; hashed access token; ownership verified before mutation.
  - Refs: `PRD-BRD-TRD.md §TRD-3`; AGENTS Hard Rule 5.
  - Tests: unit — token rotation invalidates old hash; cross-profile access rejected.
  - Commit: `feat(courses): create and rotate actions`.

- [x] **T1.6 Courses pages**
  - Goal: `/courses` list and `/courses/[id]` overview (portal link display, copy button, rotate button, archive).
  - Refs: `UI.md §Screen 5`.
  - Acceptance: manual pass — rotate shows new link and old link 404s.
  - Commit: `feat(courses): list and detail pages`.

- [x] **T1.7 NeuGlass token layer**
  - Goal: Tailwind theme extension + `globals.css` CSS variables + component classes (`card-neu`, `input-neu`, `btn-primary`, `glass-panel`, `glass-badge`) exactly per `UI.md` tokens; reduced-motion support.
  - Refs: `UI.md §10–§15, §23`.
  - Acceptance: light + dark render correctly; no ad-hoc colors anywhere in components.
  - Commit: `feat(ui): neuglass token layer`.

- [x] **T1.8 AppShell**
  - Goal: neumorphic sidebar + floating glass topbar + theme toggle; active-route styling; aria-current.
  - Refs: `UI.md §10, §16`.
  - Acceptance: keyboard-navigable; focus rings visible.
  - Commit: `feat(ui): app shell`.

- [x] **T1.9 Dashboard**
  - Goal: `/dashboard` server page with KPI cards (needs decision, auto-resolved, active courses), empty state with CTA to `/courses/new`.
  - Refs: `UI.md §Screen 3, §21`.
  - Acceptance: counts match D1; empty state shows when zero courses.
  - Commit: `feat(dashboard): kpis and empty state`.

**Phase 1 exit (MVP.md Phase 1):** signup → profile → course → portal link → dashboard, all gated.

---

## 3. Phase 2 — Request Engine (the core)

**Goal:** students submit structured requests; deterministic policies decide; professors triage the remainder with full explainability.

- [x] **T2.1 Policy engine core**
  - Goal: pure engine module (`types`, `evaluate`, guardrails: high-stakes override, default manual-review fallback, priority ordering) with **100% unit coverage**.
  - Refs: `PRD-BRD-TRD.md §TRD-4`; AGENTS Hard Rules 2,3.
  - Tests: approve/deny/penalty/priority/fallback/inactive/high-stakes cases.
  - Commit: `feat(policy): deterministic engine`.

- [x] **T2.2 Policy schemas & CRUD**
  - Goal: Zod schemas for conditions/actions/policy; owner-scoped CRUD server actions; version increment on edit; `policySnapshotJson` stored per decision.
  - Refs: `PRD-BRD-TRD.md §TRD-2, §TRD-3`.
  - Tests: invalid condition JSON rejected; non-owner blocked.
  - Commit: `feat(policy): schemas and crud`.

- [x] **T2.3 Policy builder UI**
  - Goal: visual rule rows (When/Then), add/remove condition, priority, activate toggle, live preview panel (glass).
  - Refs: `UI.md §Screen 6`.
  - Acceptance: professor creates "48h extension" rule without reading docs.
  - Commit: `feat(policy): builder ui`.

- [x] **T2.4 Policy templates**
  - Goal: seed templates (extension, late, regrade, absence, meeting, missing grade) selectable at course creation.
  - Refs: `MVP.md` Phase 2.
  - Commit: `feat(policy): templates`.

- [ ] **T2.5 Student portal course page**
  - Goal: `/c/[courseToken]` mobile-first page: course header, request-type cards, policy summary, **medical-block banner** linking university support.
  - Refs: `UI.md §Screen 7`; AGENTS Hard Rule 1.
  - Acceptance: invalid/expired token → calm 404; banner visible on every request type.
  - Commit: `feat(portal): course landing`.

- [ ] **T2.6 Intake forms**
  - Goal: stepper forms per request type (extension first; then regrade with rubric mapping, absence, meeting, missing grade, other); Turnstile widget; reason taxonomy enum only (no medical values).
  - Refs: `UI.md §Screen 7`; `PRD-BRD-TRD.md §TRD-3`.
  - Tests: Zod rejects medical categories; regrade form requires rubric fields.
  - Commit: `feat(portal): intake forms`.

- [ ] **T2.7 Public intake API**
  - Goal: `POST /api/public/c/[courseToken]/requests`: rate limit (KV), Zod, course resolve by hash, engine evaluate, identity upsert (email hash), request + event insert, queue notify; response includes `requestToken` + status + plain-language message.
  - Refs: `PRD-BRD-TRD.md §TRD-3, §TRD-5`.
  - Tests: integration — auto-approve path, manual path, rate-limit 429 path.
  - Commit: `feat(requests): public intake api`.

- [ ] **T2.8 Request status page**
  - Goal: `/r/[requestToken]` read-only status + decision reason (policy-cited, student-safe language).
  - Refs: `UI.md §Screen 7 (submission result)`.
  - Commit: `feat(portal): status page`.

- [ ] **T2.9 Professor inbox**
  - Goal: `/inbox` with queues (Needs Decision, Needs Student Info, Urgent, Auto-Resolved, TA Review, Closed), list cards showing policy match + priority.
  - Refs: `UI.md §Screen 4`.
  - Commit: `feat(inbox): queues and list`.

- [ ] **T2.10 Request detail**
  - Goal: three-pane detail: payload, timeline (`request_events`), attachments metadata, policy explanation panel (matched rule, version, reasons).
  - Refs: `UI.md §Screen 4`.
  - Acceptance: every auto decision shows human-readable reason.
  - Commit: `feat(inbox): request detail`.

- [ ] **T2.11 Decision actions**
  - Goal: approve / deny / require-info / assign-to-TA / close with private notes; each writes audit event + optional template reply; bulk limited to low-risk close only.
  - Refs: `PRD-BRD-TRD.md §PRD FR3`; AGENTS Hard Rule 8.
  - Tests: decision on another profile's request rejected.
  - Commit: `feat(inbox): decision actions`.

- [ ] **T2.12 Attachments**
  - Goal: upload to R2 via server action; allowlist MIME (pdf/png/jpg) + size caps per plan; category allowlist only (non-medical); store metadata row.
  - Refs: `PRD-BRD-TRD.md §TRD-5`; AGENTS Hard Rule 1.
  - Tests: blocked MIME and blocked category rejected.
  - Commit: `feat(requests): attachments`.

- [ ] **T2.13 Notification consumer**
  - Goal: queue consumer sends Resend emails (student confirmation, professor new-request); templates in `src/emails/`.
  - Refs: `PRD-BRD-TRD.md §TRD-6`.
  - Acceptance: local queue run delivers both emails in sandbox.
  - Commit: `feat(notifications): consumer and templates`.

**Phase 2 exit:** end-to-end manual test — student submits extension → auto-resolved OR queued → professor decides → student status page updates → audit trail complete.

---

## 4. Phase 3 — Boundaries & AI Assistant

**Goal:** protect professor time; add advisory AI with strict guardrails.

- [ ] **T3.1 Boundaries settings**
  - Goal: `/boundaries` page + service: work days/hours, SLA hours, weekend defer, vacation mode, auto-reply template.
  - Refs: `UI.md §Screen 9`; `PRD-BRD-TRD.md §PRD FR4`.
  - Commit: `feat(boundaries): settings`.

- [ ] **T3.2 Deferral logic**
  - Goal: notification consumer checks boundaries; after-hours requests flagged (`after_hours`), professor notified at next work window; students get boundary auto-acknowledgment.
  - Tests: unit — 2 AM Saturday request defers; vacation mode defers all non-urgent.
  - Commit: `feat(boundaries): deferral`.

- [ ] **T3.3 Cron worker**
  - Goal: separate lightweight Worker: daily workload snapshot, SLA-due reminders, trial-ending emails, orphan attachment cleanup, D1→R2 backup export.
  - Refs: `PRD-BRD-TRD.md §TRD-6`.
  - Commit: `feat(cron): scheduled worker`.

- [ ] **T3.4 AI service core**
  - Goal: redaction utility (strip names/emails/IDs/health keywords), Workers AI client, Zod-validated JSON outputs for `classify` and `draft`; confidence threshold 80; failure → manual fallback.
  - Refs: `PRD-BRD-TRD.md §TRD-4`; AGENTS Hard Rule 2.
  - Tests: redaction unit tests; malformed AI JSON → fallback path.
  - Commit: `feat(ai): service core`.

- [ ] **T3.5 AI job ledger**
  - Goal: persist every AI call to `ai_jobs` (purpose, vendor, redacted hash, output, confidence, status); AI never writes to `requests.status`.
  - Acceptance: code review confirms no write path from AI to request status.
  - Commit: `feat(ai): job ledger`.

- [ ] **T3.6 AI panel UI**
  - Goal: glass drawer on request detail: suggestion card (type, priority, confidence bar, editable draft) with Accept / Edit / Reject; permanent advisory footer.
  - Refs: `UI.md §Screen 8, §AI transparency`.
  - Acceptance: Accept inserts draft into reply box only; send remains a separate professor action.
  - Commit: `feat(ai): assistant panel`.

- [ ] **T3.7 Consent & notice**
  - Goal: settings toggle `aiEnabled` (default off); student portal notice line when AI active; consent recorded.
  - Refs: `PRD-BRD-TRD.md §TRD-4`.
  - Commit: `feat(ai): consent and notice`.

- [ ] **T3.8 Workload dashboard**
  - Goal: `/dashboard` extension or `/workload`: weekly KPIs from snapshots (received, auto-resolved, manual, after-hours) + category breakdown; calm chart styling.
  - Refs: `UI.md §Screen 10`.
  - Commit: `feat(workload): dashboard`.

**Phase 3 exit:** AI suggestions visible and editable, zero auto-sends; after-hours deferral verified; cron jobs running locally.

---

## 5. Phase 4 — Ledger, Reports, Billing, Launch

**Goal:** monetize and ship.

- [ ] **T4.1 Career ledger**
  - Goal: CRUD + tabs for service/publications/grants/teaching/advising; evidence upload to R2.
  - Refs: `UI.md §Screen 11`; `PRD-BRD-TRD.md §PRD FR5`.
  - Commit: `feat(ledger): crud and ui`.

- [ ] **T4.2 Report generator**
  - Goal: queue-based generation of weekly workload, monthly service, annual review; output Markdown/HTML to R2; download via signed URL.
  - Refs: `UI.md §Screen 12`.
  - Commit: `feat(reports): generator`.

- [ ] **T4.3 CSV exports**
  - Goal: requests + ledger CSV export actions (profile-scoped).
  - Commit: `feat(reports): csv export`.

- [ ] **T4.4 Razorpay billing**
  - Goal: checkout session creation, webhook route (signature-verified), `subscriptions` sync, plan upgrade/downgrade, customer portal link.
  - Refs: `PRD-BRD-TRD.md §BRD-4, §TRD-3`.
  - Tests: webhook replay idempotency; bad signature → 400.
  - Commit: `feat(billing): razorpay integration`.

- [ ] **T4.5 Usage metering & gating**
  - Goal: increment `usage_metrics` on intake; enforce free limits (requests, policies) with upgrade prompts; monthly reset cron.
  - Refs: `PRD-BRD-TRD.md §BRD-4`.
  - Commit: `feat(billing): metering and gating`.

- [ ] **T4.6 Billing UI**
  - Goal: `/settings/billing`: plan cards, usage meters (neumorphic bars), upgrade modal (glass), invoice list.
  - Refs: `UI.md §Screen 13, §29`.
  - Commit: `feat(billing): ui`.

- [ ] **T4.7 Marketing site**
  - Goal: landing + pricing pages per `UI.md §Screen 1`; hero, problem/solution, privacy section, pricing table.
  - Commit: `feat(marketing): landing and pricing`.

- [ ] **T4.8 Security hardening pass**
  - Goal: audit checklist — rate limits on all public routes, Turnstile on all public forms, IDOR scan (every query profile-scoped), secret scan, CORS/CSP headers, backup cron verified.
  - Refs: `PRD-BRD-TRD.md §TRD-5`; AGENTS Hard Rules 1,5.
  - Deliverable: `docs/SECURITY_AUDIT.md` with pass/fail per item.
  - Commit: `chore(security): hardening pass`.

- [ ] **T4.9 Accessibility pass**
  - Goal: WCAG AA verification per `UI.md §23`: contrast, focus rings, aria labels, reduced motion, keyboard triage shortcuts (J/K/A/D/I).
  - Deliverable: `docs/A11Y_AUDIT.md`.
  - Commit: `chore(a11y): pass`.

- [ ] **T4.10 E2E critical paths**
  - Goal: Playwright suites: (1) signup→course→policy→student request→auto-resolve; (2) manual decision flow; (3) sandbox upgrade flow.
  - Refs: `PRD-BRD-TRD.md §TRD-8`.
  - Commit: `test(e2e): critical paths`.

- [ ] **T4.11 Launch readiness**
  - Goal: README runbook, `.dev.vars.example` complete, `MVP.md` fully ticked, production migration applied, tag `v0.1.0`, PostHog events verified firing.
  - Commit: `chore(release): v0.1.0`.

**Phase 4 exit (launch):** a stranger can sign up, create a course, share a portal, receive requests, get auto-resolutions, upgrade in sandbox, and export a report — with zero medical data anywhere.

---

## 6. Prompt Starters (paste into your coding agent)

**First session (Phase 0):**
> You are the Lead Engineer for FacultyOS. Read `AGENTS.md`, then `IMPLEMENTATION_PLAN.md`, then produce `docs/GAP.md` per task T0.1. Do not write application code this session. End by listing the first missing deliverable.

**Each subsequent session:**
> Read `AGENTS.md` and `IMPLEMENTATION_PLAN.md`. Execute task **T<x.y>** exactly as specified: honor its Refs, Deliverables, Acceptance, and Tests. Run the global gates. Tick the checkbox in `IMPLEMENTATION_PLAN.md` and `MVP.md`, append to `docs/AGENT_LOG.md`, and commit with the suggested message. If any stop-and-ask trigger fires, stop and ask instead of guessing.

**Phase transition:**
> Verify Phase <N> exit criteria from `IMPLEMENTATION_PLAN.md` by running the phase-exit gates and the manual test script in `MVP.md`. Report pass/fail per criterion. Do not start Phase <N+1> tasks until all pass.

---

## 7. Definition of Done (per task, non-negotiable)

- Zod validates every new input surface.
- No PII in logs, analytics, or AI prompts.
- UI uses only `UI.md` tokens (no ad-hoc colors/shadows/radii).
- Schema changes shipped with a generated migration.
- Gates green; checkbox ticked; log appended; commit made.

---