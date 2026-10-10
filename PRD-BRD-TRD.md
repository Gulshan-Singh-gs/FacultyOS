# 📄 PART 1: Business Requirements Document (BRD)

## 1. Executive Summary
**FacultyOS** is a B2C/B2B SaaS "Shadow IT" productivity layer for university professors. While universities invest in massive, clunky ERPs (like Academia/Serosoft) for institutional compliance, professors are left drowning in daily administrative friction: student emails, extension requests, grade disputes, and manual tenure reporting. FacultyOS automates administrative triage, enforces syllabus policies, protects work-life boundaries, and generates audit-ready career documentation.

## 2. Market Opportunity & Problem Statement
*   **The Problem:** Professors spend 10-15 hours a week on "trivial helplessness" (answering syllabus questions) and emotional labor (managing student entitlement and grade grubbing). Existing ERPs do not solve daily workflow friction.
*   **The Gap:** ERPs are built for the Vice-Chancellor/Admin. FacultyOS is built for the *Professor*.
*   **Target Market:** Assistant Professors, Adjuncts, and heavily loaded Associate Professors in India (starting pilot), expanding globally.

## 3. Value Proposition
*   **For Professors:** Reclaim 5-10 hours a week. Stop midnight WhatsApp messages. Auto-filter lazy regrade requests. Generate tenure/annual review reports in one click.
*   **For Students:** Clear, transparent, and immediate policy-based responses without needing to wait for the professor's office hours.
*   **For Departments:** Standardized triage, reduced faculty burnout, and easy aggregation of hidden service workloads.

## 4. Revenue Model & Pricing Strategy
**Model:** Freemium Subscription (SaaS).
**Payment Gateway:** Razorpay (India MVP), Stripe/Lemon Squeezy (Global Phase 2).

| Plan | Price | Target | Limits & Features |
| :--- | :--- | :--- | :--- |
| **Free** | ₹0 | Hook / PLG | 1 Course, 50 requests/mo, 5 policies, 7-day history, No AI. |
| **Pro (Monthly)** | ₹299/mo ($12) | Individual | Unlimited courses/requests, Advanced policies, AI Assistant, Workload/Ledger, 1-yr history. |
| **Pro (Semester)**| ₹1,499/sem ($59)| Individual | Same as Monthly, billed per academic semester (highly preferred by academics). |
| **Department** | ₹24,999/yr ($499)| B2B / Pilot | 10 Professor seats, Dept-wide analytics, Accreditation exports, Priority support. |

## 5. Business Success Metrics (First 90 Days)
1.  **Acquisition:** 100 Free tier signups.
2.  **Activation:** 40% of signups create at least 1 policy and share a student portal link.
3.  **Revenue:** 10 paying individual professors OR 1 Department License (Rayat Bahra University pilot or external).
4.  **Retention:** < 5% churn rate on semester passes.

## 6. Go-To-Market (GTM) Strategy
*   **Trojan Horse:** Launch a free "Syllabus Policy Generator" web tool in July/December (before semesters start) to capture emails.
*   **Academic Twitter/LinkedIn:** Share data-driven threads on "hidden academic service hours" and "boundary setting."
*   **Internal Pilot:** Run a closed beta with 3-5 sympathetic professors at Rayat Bahra University to gather testimonials and refine the UX.

## 7. Business Risks & Mitigations
| Risk | Impact | Mitigation |
| :--- | :--- | :--- |
| **University ERP Pushback** | High | Position as a *companion* tool, not a replacement. Export clean CSVs for the ERP. Do not store official university billing/grade data. |
| **Low Willingness to Pay** | Med | Price at ₹299/mo (cost of a few coffees). Emphasize time saved during high-stress exam/grading weeks. |
| **AI Hallucinations/Liability** | High | AI is strictly an *assistant*. Final adverse decisions (denials, grade changes) require human approval or deterministic policy execution. |

---

# 📱 PART 2: Product Requirements Document (PRD)

## 1. Product Overview
FacultyOS is a web-based SaaS application featuring a "NeuGlass Premium" UI. It provides professors with a command center to manage student requests via deterministic rules, assisted by an AI copilot, while tracking their career ledger.

## 2. User Personas
1.  **Dr. Sharma (The Professor - Primary):** Overworked Assistant Professor. Hates repetitive emails. Needs to protect his weekends and compile his annual review dossier.
2.  **Rahul (The Student - Secondary):** Wants quick answers. Will try to bend rules if allowed, but respects clear, immediate, policy-backed boundaries.
3.  **Priya (The TA - Secondary):** Needs to handle routine regrade requests and extension approvals without bothering the professor.

## 3. Core User Journeys
### Journey A: Professor Onboarding (Time to Value: < 5 mins)
1. Sign up via Email/Google.
2. Set Boundaries (Working hours: 9 AM - 5 PM, M-F).
3. Create Course (e.g., "CS301 - Database Systems").
4. Select Policy Templates (e.g., "Extensions need 48h notice").
5. Copy the generated Student Portal Link and paste it into the syllabus/LMS.

### Journey B: Student Request Triage
1. Student clicks portal link, selects "Request Extension".
2. System shows policy summary. Student fills structured form.
3. **Deterministic Engine** evaluates: *Submitted 12h before deadline. Rule: Needs 48h.* -> Status: `Manual Review Required`.
4. **AI Assistant** suggests: *Draft a polite denial citing Section 4.2 of the syllabus.*
5. Professor reviews in Inbox, clicks "Approve AI Draft & Send".

## 4. Functional Requirements & Acceptance Criteria

### Module 1: Course & Policy Engine
*   **FR1.1:** Professors can create courses with unique, rotatable access tokens.
*   **FR1.2:** Professors can build deterministic rules using `When [Condition] Then [Action]` logic.
*   *Acceptance Criteria:* A student submitting a request matching a rule instantly receives the programmed outcome (e.g., Auto-Approved) without professor intervention.

### Module 2: Student Portal & Intake
*   **FR2.1:** Students access the portal via a secure URL (no account creation required).
*   **FR2.2:** Forms enforce strict Zod validation. "Medical/Mental Health" options are blocked and redirect to university support resources.
*   *Acceptance Criteria:* A student cannot submit an extension request without specifying the assignment name and current deadline.

### Module 3: Triage Inbox & AI Assistant
*   **FR3.1:** Inbox groups requests into queues: `Needs Decision`, `Urgent`, `Auto-Resolved`, `TA Review`.
*   **FR3.2:** AI Assistant suggests classification, priority, and drafts responses based on redacted request data.
*   *Acceptance Criteria:* AI drafts are clearly marked as "AI Suggestion" and require a manual click to send. AI never auto-sends adverse decisions.

### Module 4: Boundaries & Workload
*   **FR4.1:** System defers non-urgent notifications outside of configured working hours.
*   **FR4.2:** Dashboard visualizes requests received, auto-resolved vs. manual, and after-hours volume.
*   *Acceptance Criteria:* A request submitted at 2 AM on a Saturday does not trigger a push/email notification to the professor until 9 AM Monday.

### Module 5: Career Ledger & Reporting
*   **FR5.1:** Professors can log service, publications, and teaching entries.
*   **FR5.2:** System generates a structured Markdown/CSV export for Annual Reviews.
*   *Acceptance Criteria:* Exported report includes all logged entries within the selected date range, formatted cleanly for university submission.

## 5. UI/UX Requirements (NeuGlass Premium)
*   **Design Language:** Neumorphism for stable, persistent surfaces (Sidebar, KPI Cards, Inputs). Liquid Glassmorphism for intelligent, temporary overlays (AI Assistant Drawer, Modals, Command Palette).
*   **Color Palette:** Light mode (Soft Porcelain `#F4F6FB`, Indigo/Cyan accents). Dark mode (Deep Navy `#0B1020`, Electric Indigo/Aqua accents).
*   **Accessibility:** WCAG AA compliant. High contrast text on glass surfaces. Visible focus rings. Support for `prefers-reduced-motion`.
*   **Empty States:** Calm, non-alarming illustrations with clear next-step CTAs.

## 6. Analytics & Tracking Events
*   `signup_completed`
*   `course_created`
*   `policy_activated`
*   `student_portal_viewed`
*   `request_submitted` (Track auto-resolved vs manual)
*   `ai_draft_accepted` vs `ai_draft_rejected`
*   `report_exported`
*   `checkout_started` / `subscription_created`

---

# ⚙️ PART 3: Technical Requirements Document (TRD)

## 1. System Architecture
FacultyOS is a **Modular Monolith** deployed on the Edge.
*   **Frontend / API:** Next.js 15 (App Router) running on Cloudflare Workers via `@opennextjs/cloudflare`.
*   **Database:** Cloudflare D1 (Serverless SQLite).
*   **ORM:** Drizzle ORM with Drizzle Kit for migrations.
*   **Auth:** Better Auth (Cookie-based sessions, RBAC).
*   **Storage:** Cloudflare R2 (Attachments, PDF Exports).
*   **Caching/Rate Limiting:** Cloudflare KV.
*   **Background Jobs:** Cloudflare Queues (Email sending, AI processing).
*   **Cron Jobs:** Cloudflare Cron Triggers (SLA checks, workload aggregation).

### Architecture Diagram (Data Flow)
```text
[Browser] <--> [Cloudflare Edge (WAF/Turnstile)]
                     |
                     v
          [Next.js 15 on Workers]
           /      |       \
          v       v        v
    [Server    [REST     [Email
     Actions]   API]     Worker]
          \       |       /
           v      v      v
      [Deterministic Policy Engine] <--> [AI Service (Workers AI)]
           |
           v
   [Cloudflare D1] <---> [Cloudflare R2]
```

## 2. Database Schema (Core Entities - Drizzle ORM)
*Note: SQLite dialect for D1.*

```typescript
// 1. professor_profiles
// id, user_id, institution, timezone, plan, ai_enabled, boundary_settings_json

// 2. courses
// id, profile_id, course_code, course_name, access_token_hash, syllabus_text

// 3. policies
// id, course_id, policy_type (extension, regrade, etc.), priority, conditions_json, actions_json, is_active

// 4. requests
// id, course_id, student_email_hash, request_type, status (submitted, auto_approved, manual_review), 
// intake_payload_json, decision_reason_json, policy_version_id, created_at

// 5. ai_jobs
// id, request_id, purpose (classify, draft), vendor, redacted_prompt_hash, output_json, confidence_score, status

// 6. workload_snapshots
// id, profile_id, snapshot_date, requests_received, auto_resolved, after_hours_count

// 7. ledger_entries (Service, Publications, Grants)
// id, profile_id, category, title, role, start_date, end_date, evidence_r2_key
```

## 3. API Specification (REST & Server Actions)

### Public / Student Facing (REST)
*   `GET /api/public/c/:courseToken` -> Returns course info and active policy summaries.
*   `POST /api/public/c/:courseToken/requests` -> Submits a request. (Rate limited: 10/min per IP).
*   `GET /api/public/r/:requestToken` -> Returns status of a specific request.

### Professor Facing (Next.js Server Actions)
*   `createCourse(data)` -> Validates via Zod, generates access token, inserts to D1.
*   `updatePolicy(policyId, rules)` -> Updates `conditions_json` and `actions_json`.
*   `decideRequest(requestId, decision, notes)` -> Updates request status, triggers notification queue.
*   `generateReport(type, dateRange)` -> Queries ledger/requests, generates PDF/Markdown, uploads to R2, returns signed URL.

## 4. AI Service Design & Guardrails
*   **Provider:** Cloudflare Workers AI (Llama 3.1 8B or Mistral 7B) for MVP to keep costs at ₹0.
*   **Pipeline:**
    1.  **Redaction:** Strip names, emails, and IDs from student text before prompting.
    2.  **Prompting:** Inject professor's syllabus and active policies into the system prompt.
    3.  **Structured Output:** Force JSON output using Zod schemas.
    4.  **Validation:** If JSON parsing fails or confidence < 80%, fallback to `manual_review`.
*   **Strict Rule:** AI *never* writes directly to the `requests` table `status` column. It only writes to the `ai_jobs` table. The UI reads `ai_jobs` and presents it to the professor for a manual click.

## 5. Security & Privacy Model
*   **FERPA/DPDP Alignment:**
    *   No medical/mental health data collection. Hardcoded block in UI and API.
    *   Student PII is minimized. Emails are hashed (`SHA-256`) for deduplication. Full emails are only stored if explicitly required for the notification queue, and are purged after 30 days (Free) or 365 days (Pro).
*   **Authentication & RBAC:**
    *   Better Auth handles secure session cookies.
    *   Middleware checks `course_id` ownership on every API call to prevent Insecure Direct Object References (IDOR).
*   **Public Endpoints:**
    *   Protected by Cloudflare Turnstile (CAPTCHA).
    *   Rate-limited via Cloudflare KV (sliding window).
*   **File Uploads:**
    *   R2 presigned URLs used for direct browser-to-R2 uploads.
    *   Strict MIME type validation (PDF, JPG, PNG only). Max 5MB.

## 6. Background & Scheduled Jobs
*   **Cloudflare Queues:**
    *   `email-queue`: Processes Resend API calls for student notifications and professor digests.
    *   `ai-queue`: Processes heavy syllabus-parsing tasks asynchronously.
*   **Cloudflare Cron Triggers:**
    *   `0 0 * * *` (Daily): Aggregate daily workload snapshots.
    *   `0 8 * * 1` (Weekly Monday 8 AM): Send "Week Ahead" boundary digest to professors.
    *   `0 2 * * *` (Daily 2 AM): Purge expired free-tier request data and orphaned R2 attachments.

## 7. Deployment & CI/CD
*   **Repository:** GitHub.
*   **CI Pipeline (GitHub Actions):**
    1.  `pnpm install`
    2.  `pnpm lint && pnpm typecheck`
    3.  `pnpm test` (Vitest for Policy Engine logic)
    4.  `pnpm build` (OpenNext)
    5.  `wrangler d1 migrations apply` (Apply DB schema)
    6.  `wrangler deploy` (Push to Cloudflare Workers)
*   **Secrets:** Stored in Cloudflare Workers Secrets and GitHub Environments. Never in code.

## 8. Testing Strategy
*   **Unit Tests (Vitest):** 100% coverage on the **Deterministic Policy Engine**. This is the most critical business logic.
*   **Integration Tests:** Test Drizzle ORM queries and D1 interactions using a local Miniflare/D1 environment.
*   **E2E Tests (Playwright):** Critical paths only (Signup -> Create Course -> Submit Student Request -> Auto-Resolve).
*   **Security Tests:** OWASP ZAP or similar automated scan on public endpoints to verify rate limiting and IDOR protection.

---