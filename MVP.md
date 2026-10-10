# FacultyOS MVP Architecture & Execution Tracking

**Current Phase:** Phase 3 (Boundaries + AI Assistant) — Ready for Kickoff  
**Phase 0 (Bootstrap):** [x] Complete  
**Phase 1 (Foundation: Identity, Courses, NeuGlass Shell):** [x] Complete & Audited  
**Phase 2 (Request Engine):** [x] Complete & Audited (T2.1 – T2.13 Verified • docs/QA/phase2-qa.md)  
**Phase 3 (Boundaries + AI Assistant):** [ ] Pending  
**Phase 4 (Ledger, Reports, Billing, Launch):** [ ] Pending  

---

## Phase 2 Acceptance Criteria Sign-Off
- [x] Deterministic policy evaluation engine (T2.1, T2.2)
- [x] Visual policy builder UI with rule presets and live preview (T2.3, T2.4)
- [x] Student portal landing `/c/[token]` & multi-step intake forms with Hard Rule 1 medical protection (T2.5, T2.6)
- [x] Public intake API with IP/token sliding-window rate limiting & SHA-256 deduplication (T2.7)
- [x] Student read-only status page `/r/[token]` with explainability & zero AI mention guarantee (T2.8)
- [x] Professor triage inbox `/inbox` with 6 queues, pseudonymous student labels, and calm empty states (T2.9)
- [x] Three-pane request detail view `/requests/[requestId]` with immutable policy snapshot and timeline (T2.10)
- [x] Decision actions (`approve`, `deny`, `require_info`, `assign_to_ta`, `close`), IDOR check, audit trail, and bulk archival (T2.11)
- [x] Secure non-medical attachments with Cloudflare R2 upload, MIME/category allowlists, and plan size caps (T2.12)
- [x] Cloudflare Queue consumer for notifications with Resend email templates & Phase 2 Exit Proof (T2.13)

---

## Phase 1 Acceptance Criteria Sign-Off
- [x] Professor can sign up via Better Auth with calm error handling
- [x] Auto-provisioning of `professor_profiles`, default `boundaries`, and `usage_metrics`
- [x] Professor can create a course with secure, hashed portal access token
- [x] Plan limits strictly enforced (Free plan capped at 1 course, Pro allows 20, Department allows 200)
- [x] Token rotation invalidates old access link and generates fresh hashed token
- [x] NeuGlass design system implemented (cards, inset inputs, glass panels, buttons, badges)
- [x] Dashboard shell renders live KPI tiles and empty states with action CTAs
- [x] AppShell navigation with Lucide React icons, active state indicators, and keyboard accessibility
- [x] All Phase 1 gates pass (lint, typecheck, unit tests: 19/19)

---

# Architecture Proposal

## 1. Confirmed Product Scope

### FacultyOS MVP should solve

1. **Administrative overload**
   - Student emails
   - Extension requests
   - Regrade requests
   - Meeting requests
   - Missing-grade queries
   - Recommendation-letter requests

2. **Boundary protection**
   - Working hours
   - Response SLAs
   - After-hours deferral
   - Auto-acknowledgment
   - Professional policy-based replies

3. **Course policy enforcement**
   - Syllabus rules
   - Late penalties
   - Minimum notice periods
   - Required documentation
   - Regrade restrictions
   - Meeting prerequisites

4. **Career documentation**
   - Service entries
   - Committee work
   - Teaching evidence
   - Publications
   - Grants
   - Reports for annual review, tenure, accreditation

5. **Workload visibility**
   - Requests received
   - Requests auto-resolved
   - After-hours requests
   - Unresolved items
   - Meeting load
   - Service load

---

# 2. Recommended Tech Stack

I recommend staying with the Cloudflare-native stack you already defined, but with a clear separation between deterministic logic and AI-assisted logic.

## Frontend

| Layer | Recommendation | Why |
|---|---|---|
| Framework | **Next.js 15 App Router** | Best for dashboard, server components, rapid MVP, SEO pages |
| Language | **TypeScript** | Safety for policy logic, schema validation, API contracts |
| Styling | **Tailwind CSS v3** | Fast UI iteration |
| UI components | **shadcn/ui + Lucide React** | Clean, professional admin UI without heavy design cost |
| Forms | **React Hook Form + Zod** | Low-friction forms with strict validation |
| Data fetching | React Server Components + TanStack Query where needed | Simple, fast, scalable |

### Why this frontend stack?

Professors need a calm, low-friction dashboard. They do not need flashy UI. They need:

- Clear inbox
- Clear decisions
- Clear policy explanations
- Fast forms
- Easy exports
- Minimal cognitive load

Next.js + Tailwind + shadcn/ui is excellent for this.

---

## Backend / Application Layer

| Layer | Recommendation | Why |
|---|---|---|
| App runtime | **Cloudflare Workers** | Edge deployment, low cost, scales during exam periods |
| Next.js adapter | **@opennextjs/cloudflare** | Runs Next.js on Workers |
| Mutations | **Next.js Server Actions** | Good for dashboard workflows |
| Public/API endpoints | Next.js Route Handlers | REST API for requests, webhooks, integrations |
| Background jobs | **Cloudflare Queues** | Email, AI jobs, report generation, retries |
| Scheduled jobs | **Cloudflare Cron Triggers** | SLA checks, workload aggregation, reminders |
| Email ingestion | Separate Cloudflare Email Worker | Handles inbound email triage |

### Why Cloudflare Workers?

For FacultyOS, traffic is bursty:

- Assignment deadlines
- Exam weeks
- Result declaration periods
- End-of-semester reporting

Cloudflare Workers scale well for this pattern without managing servers.

---

## Database

| Layer | Recommendation | Why |
|---|---|---|
| Primary DB | **Cloudflare D1** for MVP | Serverless SQLite, simple, cheap, Cloudflare-native |
| ORM | **Drizzle ORM** | Type-safe schema and migrations |
| Migrations | **Drizzle Kit** | Good developer experience |

### Important caveat

D1 is excellent for MVP and individual professors.

If FacultyOS later becomes a university-wide system with thousands of concurrent writers, heavy audit requirements, and formal FERPA/institutional compliance, we may want to move to:

- **Cloudflare D1 with Hyperdrive**, or
- Managed Postgres such as Neon/Supabase/RDS, or
- A university-hosted Postgres instance

But for a 4-week MVP, **D1 is the right choice**.

---

## Authentication and Authorization

| Layer | Recommendation | Why |
|---|---|---|
| Auth | **Better Auth** | Sessions, password hashing, social login if needed |
| RBAC | Custom role layer on top of Better Auth | Professor, TA, Grader, Admin |
| Student access | Token-based course portal, no student accounts initially | Reduces PII and friction |

### Roles for MVP

1. **Professor / Owner**
   - Full access to courses, policies, requests, reports, billing

2. **Teaching Assistant**
   - Can review assigned requests
   - Cannot delete courses or change billing

3. **Grader**
   - Can review regrade requests only
   - Cannot see billing or private career ledger

4. **Student**
   - No permanent account initially
   - Accesses course portal via signed course token
   - Submits structured requests

This reduces onboarding friction and avoids storing unnecessary student accounts.

---

## Validation and Domain Logic

| Layer | Recommendation | Why |
|---|---|---|
| Schema validation | **Zod** | Every request, policy, AI output, and API payload must be validated |
| Policy engine | Deterministic TypeScript rules engine | Transparent, explainable, auditable |
| AI output validation | Zod-validated JSON | Prevents hallucinated structures from entering the system |

This is critical.

The policy engine should be deterministic.

AI should never be allowed to invent final decisions.

---

## AI / LLM Layer

Since you want an API-based LLM intelligence layer, I recommend a hybrid model.

### Recommended AI architecture

| Component | Recommendation | Why |
|---|---|---|
| Primary intelligence | Deterministic policy engine | Transparent, auditable, safe |
| Secondary assistant | LLM via API | Classification, drafting, summarization |
| MVP LLM provider | **Cloudflare Workers AI** or OpenAI/Anthropic via server-side proxy | Flexible, cost-controlled |
| Production LLM provider | OpenAI or Anthropic with strict data handling settings | Better quality for drafting/classification |
| AI gateway | Custom AI service layer | Allows swapping providers later |
| AI output format | Structured JSON only | Prevents free-text hallucinations |
| Human review | Required for high-stakes decisions | Protects professor and student |

### What AI should do

AI may assist with:

1. Classifying an incoming student message:
   - Extension
   - Regrade
   - Meeting
   - Absence
   - Missing grade
   - Recommendation letter
   - Other

2. Suggesting urgency:
   - Urgent
   - Standard
   - Low priority / can be auto-answered

3. Drafting a professional reply based on professor policy.

4. Extracting policy suggestions from a pasted syllabus.

5. Summarizing workload or tenure ledger data into a draft narrative.

### What AI must not do

AI must not autonomously:

1. Assign final grades.
2. Deny a student request if the rule is ambiguous.
3. Accuse a student of cheating.
4. Detect mental health conditions.
5. Make disciplinary recommendations.
6. Produce final legal or academic integrity findings.
7. Use protected attributes such as race, religion, gender, disability, or health status in decisions.

### AI decision model

Use this hierarchy:

```text
Professor-approved syllabus policy
        ↓
Deterministic policy engine
        ↓
AI suggestion layer
        ↓
Professor review / approval
        ↓
Final action
```

Never:

```text
AI → final adverse student decision
```

---

## File Storage

| Layer | Recommendation | Why |
|---|---|---|
| Files | **Cloudflare R2** | No egress fees, good for attachments and exports |
| Upload limits | Strict MIME type and size validation | Security |
| File categories | Non-medical documentation only | Avoid sensitive health data |

Allowed file categories:

- University-approved absence document
- Athletics schedule
- Religious observance document
- Civic duty document
- Technical issue evidence
- Academic integrity statement
- Committee/service evidence
- Teaching evidence
- Publication proof

Blocked categories:

- Medical note
- Doctor note
- Hospital record
- Therapy record
- Mental health record
- Disability diagnosis unless handled through official university office and not stored by FacultyOS

---

## Background Processing

| Purpose | Tool |
|---|---|
| Outbound email | Cloudflare Queue + Resend/Brevo |
| AI jobs | Cloudflare Queue |
| Report generation | Cloudflare Queue |
| Retry failed operations | Cloudflare Queue |
| Scheduled reminders | Cron Trigger |
| Workload aggregation | Cron Trigger |

---

## Observability

| Purpose | Recommendation |
|---|---|
| Error tracking | Sentry |
| Product analytics | PostHog or Cloudflare Web Analytics |
| Logs | Cloudflare Logs + Axiom free tier |
| Audit logs | Internal D1 table |
| AI job logs | Separate AI job table with redaction metadata |

---

## Payments

| Purpose | Recommendation |
|---|---|
| Individual professor subscriptions | Stripe, Paddle, or Lemon Squeezy |
| Department licensing | Stripe with manual invoicing later |
| Metering | Usage metrics table |

For MVP, I recommend:

- **Stripe** if you want flexibility.
- **Paddle or Lemon Squeezy** if you want less tax complexity.

---

# 3. Proposed MVP Architecture Diagram

```text
Professor Dashboard
        |
        v
Next.js 15 App
Server Components / Server Actions / API Routes
        |
        +-----------------------------+
        |                             |
        v                             v
Deterministic Policy Engine      AI Assistant Layer
        |                             |
        |                             +--> LLM API
        |                                  OpenAI / Anthropic /
        |                                  Cloudflare Workers AI
        |
        v
Cloudflare D1
Drizzle ORM
        |
        +--> Courses
        +--> Policies
        +--> Requests
        +--> Tasks
        +--> Ledger
        +--> Workload Metrics
        +--> Audit Logs

Cloudflare Services:
KV         -> rate limits, tokens, cache
R2         -> attachments, exports
Queue      -> email, AI jobs, reports
Cron       -> reminders, aggregation, expirations
Email Worker -> inbound email triage
```

---

# 4. Database Schema / ERD Proposal

Below is the proposed core schema.

I am intentionally modeling “Emotional Wellbeing Metrics” as **Workload & Boundary Metrics**, not clinical or mental-health metrics.

This is important for privacy, legal safety, and product trust.

---

## A. Identity and Access

### users

Core authentication user.

| Field | Purpose |
|---|---|
| id | Primary key |
| email | Login email |
| name | Display name |
| auth_provider | Better Auth provider |
| status | active, suspended, deleted |
| created_at | Timestamp |
| updated_at | Timestamp |

---

### professor_profiles

Profile for a professor account.

| Field | Purpose |
|---|---|
| id | Primary key |
| user_id | FK to users |
| institution | Optional |
| faculty_title | Assistant Professor, Associate Professor, etc. |
| timezone | For working hours and SLAs |
| plan | free, pro, department |
| ai_enabled | Boolean |
| privacy_mode | strict, standard |
| billing_customer_id | Payment provider ID |
| trial_ends_at | Trial timestamp |
| created_at | Timestamp |
| updated_at | Timestamp |

---

### course_members

For TAs, co-instructors, graders.

| Field | Purpose |
|---|---|
| id | Primary key |
| course_id | FK to courses |
| user_id | FK to users |
| role | owner, ta, grader, viewer |
| invited_email | Optional invitation email |
| status | active, invited, removed |
| created_at | Timestamp |

---

## B. Courses and Policies

### courses

| Field | Purpose |
|---|---|
| id | Primary key |
| profile_id | FK to professor_profiles |
| course_code | Example: CSE-301 |
| course_name | Example: Database Systems |
| term | Semester term |
| syllabus_text | Optional raw syllabus text |
| syllabus_version | Version number |
| access_token_hash | Hashed token for student portal |
| is_active | Boolean |
| settings_json | Course-level settings |
| created_at | Timestamp |
| updated_at | Timestamp |

---

### policies

Professor-defined rules.

| Field | Purpose |
|---|---|
| id | Primary key |
| course_id | FK to courses |
| policy_type | extension, regrade, absence, meeting, recommendation, late_assignment, other |
| name | Human-readable name |
| priority | Rule priority |
| conditions_json | Structured conditions |
| actions_json | Structured actions |
| version | Policy version |
| is_active | Boolean |
| created_at | Timestamp |
| updated_at | Timestamp |

Example policy types:

```text
extension
absence
regrade
recommendation_letter
meeting
missing_grade
late_assignment
academic_integrity
```

Example actions:

```text
auto_approve
auto_deny
manual_review
require_attachment
apply_penalty
send_template
route_to_ta
```

Important: store policy version so every decision can be traced to the exact policy in force at that time.

---

### policy_snapshots

Optional but recommended for auditability.

| Field | Purpose |
|---|---|
| id | Primary key |
| policy_id | FK to policies |
| version | Version |
| conditions_json | Snapshot |
| actions_json | Snapshot |
| created_at | Timestamp |

This helps if a student challenges a decision later.

---

## C. Student Interactions

### student_identities

This table should minimize PII.

| Field | Purpose |
|---|---|
| id | Primary key |
| course_id | FK to courses |
| display_label | Example: Student #104 or name if professor chooses |
| email_hash | Hashed email for deduplication |
| email_domain | Example: university domain |
| external_student_id_encrypted | Optional encrypted university ID |
| is_active | Boolean |
| created_at | Timestamp |
| last_interaction_at | Timestamp |

### Privacy recommendation

For MVP, do not store full student email addresses unless necessary.

Use:

```text
email_hash
```

If the professor needs to reply, use a tokenized request link or send through a controlled email workflow.

If full email is required, store it encrypted and restrict access.

---

### requests

The core “student interaction” entity.

| Field | Purpose |
|---|---|
| id | Primary key |
| course_id | FK to courses |
| student_identity_id | FK to student_identities |
| request_type | extension, regrade, meeting, absence, etc. |
| status | submitted, auto_approved, auto_denied, pending_review, needs_info, resolved, closed |
| priority | urgent, standard, low |
| source | portal, email, api, ta_created |
| intake_payload_json | Structured request data |
| policy_version_id | Policy used |
| decision_status | Final decision state |
| decision_reason_json | Explainable reason |
| penalty_json | Penalty details if applied |
| assigned_to_user_id | Optional TA/grader/professor |
| due_at | Response or resolution due time |
| resolved_at | Timestamp |
| created_at | Timestamp |
| updated_at | Timestamp |

This is the central operational entity.

---

### request_messages

Messages between student, system, TA, professor.

| Field | Purpose |
|---|---|
| id | Primary key |
| request_id | FK to requests |
| sender_type | student, professor, ta, system, ai_draft |
| body_redacted | Message body after redaction |
| metadata_json | Optional |
| created_at | Timestamp |

Important: store redacted text where possible.

---

### request_events

Audit trail for every request.

| Field | Purpose |
|---|---|
| id | Primary key |
| request_id | FK to requests |
| course_id | FK to courses |
| event_type | created, policy_matched, ai_suggested, professor_approved, student_replied, email_sent |
| actor_type | student, professor, ta, system, ai |
| payload_json | Event metadata |
| created_at | Timestamp |

This is essential for trust and disputes.

---

### attachments

Files uploaded by students or professors.

| Field | Purpose |
|---|---|
| id | Primary key |
| request_id | FK to requests |
| course_id | FK to courses |
| r2_key | Storage key |
| file_name | Original name |
| mime_type | MIME type |
| file_size | Size |
| category | university_document, athletics, technical_issue, etc. |
| scan_status | pending, clean, failed |
| uploaded_at | Timestamp |

Blocked categories:

```text
medical_note
doctor_note
mental_health_record
disability_diagnosis
hospital_record
```

---

## D. Admin Tasks

### admin_tasks

Tasks for professor or TA.

| Field | Purpose |
|---|---|
| id | Primary key |
| profile_id | FK to professor_profiles |
| course_id | Optional FK to courses |
| request_id | Optional FK to requests |
| title | Task title |
| category | student_request, committee, grading, accreditation, research, advising, other |
| priority | urgent, standard, low |
| status | open, in_progress, waiting, done, cancelled |
| due_at | Due date |
| estimated_minutes | Estimated effort |
| actual_minutes | Actual effort |
| source | manual, request, ai_suggested, cron |
| notes | Optional private notes |
| created_at | Timestamp |
| updated_at | Timestamp |

This helps model administrative burden.

---

### task_events

Optional audit table.

| Field | Purpose |
|---|---|
| id | Primary key |
| task_id | FK to admin_tasks |
| event_type | created, assigned, completed, snoozed |
| actor_user_id | User |
| payload_json | Metadata |
| created_at | Timestamp |

---

## E. Career Ledger

These tables support tenure, annual review, accreditation, and workload reporting.

### service_entries

| Field | Purpose |
|---|---|
| id | Primary key |
| profile_id | FK to professor_profiles |
| category | committee, accreditation, advising, peer_review, department_service, university_service |
| title | Committee or service name |
| role | Member, chair, reviewer |
| start_date | Date |
| end_date | Optional |
| estimated_hours_per_month | Workload estimate |
| evidence_r2_key | Optional proof |
| notes | Optional |
| created_at | Timestamp |
| updated_at | Timestamp |

---

### publications

| Field | Purpose |
|---|---|
| id | Primary key |
| profile_id | FK to professor_profiles |
| title | Paper title |
| venue | Journal/conference |
| year | Year |
| doi | DOI |
| url | URL |
| authors_json | Authors |
| citation_count | Optional |
| status | draft, submitted, accepted, published |
| evidence_r2_key | Optional |
| created_at | Timestamp |
| updated_at | Timestamp |

---

### grants

| Field | Purpose |
|---|---|
| id | Primary key |
| profile_id | FK to professor_profiles |
| title | Grant title |
| funder | Funding agency |
| amount | Amount |
| currency | Currency |
| role | PI, co-PI, collaborator |
| status | proposed, submitted, awarded, active, closed |
| start_date | Date |
| end_date | Date |
| evidence_r2_key | Optional |
| created_at | Timestamp |
| updated_at | Timestamp |

---

### teaching_entries

| Field | Purpose |
|---|---|
| id | Primary key |
| profile_id | FK to professor_profiles |
| course_id | Optional FK to courses |
| course_code | Course code |
| course_name | Course name |
| term | Term |
| role | instructor, co-instructor, lab instructor |
| enrollment | Student count |
| evaluation_summary | Non-sensitive summary |
| evidence_r2_key | Optional |
| notes | Optional |
| created_at | Timestamp |
| updated_at | Timestamp |

---

### reports

Generated exports.

| Field | Purpose |
|---|---|
| id | Primary key |
| profile_id | FK to professor_profiles |
| report_type | annual_review, tenure_dossier, service_workload, teaching_summary, research_impact |
| period_start | Start date |
| period_end | End date |
| output_r2_key | Generated file |
| status | pending, completed, failed |
| created_at | Timestamp |

---

## F. Workload / Wellbeing Metrics

Important: I recommend not calling this “Emotional Wellbeing Metrics” in the database.

Instead, use:

> **Workload & Boundary Metrics**

This avoids medical/mental-health data and reduces legal risk.

### workload_snapshots

Daily aggregate metrics.

| Field | Purpose |
|---|---|
| id | Primary key |
| profile_id | FK to professor_profiles |
| snapshot_date | Date |
| requests_received | Count |
| requests_auto_resolved | Count |
| requests_manual_review | Count |
| after_hours_requests | Count |
| weekend_requests | Count |
| unresolved_requests | Count |
| urgent_requests | Count |
| meetings_scheduled | Count |
| tasks_completed | Count |
| estimated_admin_minutes | Estimated time |
| boundary_violations | After-hours notifications sent, etc. |
| self_reported_workload_pressure | Optional 1-5 non-clinical scale |
| created_at | Timestamp |

### Important safety rule

`self_reported_workload_pressure` should be:

- Optional
- Private
- Non-clinical
- Not used for AI decisions
- Not shown to students
- Not used for employment evaluation
- Deletable by the professor

If a professor indicates high workload pressure, FacultyOS should show workload management suggestions and institutional resources, not mental-health advice.

---

## G. AI Jobs and Guardrails

### ai_jobs

Every AI call should be logged for auditability.

| Field | Purpose |
|---|---|
| id | Primary key |
| profile_id | FK to professor_profiles |
| request_id | Optional FK |
| course_id | Optional FK |
| purpose | classify_request, draft_reply, extract_policy, summarize_report |
| vendor | openai, anthropic, cloudflare_workers_ai |
| prompt_hash | Hash of prompt for audit |
| redaction_status | redacted, failed_redaction, not_required |
| input_summary | Non-sensitive summary |
| output_json | Structured AI output |
| confidence_score | Optional |
| status | pending, completed, failed, rejected_by_user |
| human_reviewed_by | User ID |
| human_reviewed_at | Timestamp |
| created_at | Timestamp |

Important: do not store raw prompts containing unnecessary PII unless required for audit and consented.

---

## H. Audit and Compliance

### audit_logs

| Field | Purpose |
|---|---|
| id | Primary key |
| actor_user_id | User performing action |
| actor_role | professor, ta, grader, system |
| action | create, update, delete, export, approve, deny |
| entity_type | request, policy, course, report, task |
| entity_id | Entity ID |
| metadata_json | Safe metadata |
| ip_hash | Hashed IP for security |
| created_at | Timestamp |

---

### privacy_consents

| Field | Purpose |
|---|---|
| id | Primary key |
| profile_id | FK to professor_profiles |
| consent_type | ai_assistance, email_processing, analytics, report_generation |
| status | granted, denied, revoked |
| granted_at | Timestamp |
| revoked_at | Timestamp |

If FacultyOS is used by a university formally, we may also need:

- Data Processing Agreement
- Institutional consent
- Student notice
- Data retention schedule
- Right to export/delete workflow

---

# 5. Problem-to-Feature Mapping

Here is the mapping from researched professor problems to MVP features.

---

## Problem 1: Email Overload

> Professors are overwhelmed by constant emails from students, colleagues, and administrators.

### FacultyOS Feature

**Triage Inbox + Structured Request Portal**

Instead of raw email, students submit structured requests.

Examples:

- Extension request
- Regrade request
- Meeting request
- Absence notification
- Missing grade
- Recommendation letter

### Technical Entities

- requests
- request_messages
- request_events
- ai_jobs
- policies

### Outcome

Professor sees:

```text
Urgent
Standard
Auto-resolved
Needs decision
Needs student info
```

Instead of a messy inbox.

---

## Problem 2: Trivial Helplessness

> Professors waste time answering questions already present in the syllabus or website.

### FacultyOS Feature

**Syllabus Gate + Policy Auto-Answers**

Before submitting certain requests, the student must:

1. Confirm they read the relevant syllabus section.
2. Answer a short policy question.
3. Provide required details.

The system can auto-answer common questions using professor-approved templates.

### Technical Entities

- courses
- policies
- requests
- request_events

### Outcome

Reduced repetitive questions.

Students are guided to policy before contacting the professor.

---

## Problem 3: Grade Grubbing

> Students frequently ask for grade bumps or special treatment they have not earned.

### FacultyOS Feature

**Structured Regrade Workflow**

Student must submit:

- Assignment name
- Specific rubric item
- Their submitted text or answer
- Professor feedback
- Specific justification

If the request is incomplete, it is not sent to the professor.

### Technical Entities

- requests
- rubrics
- request_events
- policies

### Outcome

Lazy or entitled regrade requests are filtered out.

Serious regrade requests become structured and reviewable.

---

## Problem 4: Work-Life Imbalance

> Job demands bleed into personal time, causing burnout and strained relationships.

### FacultyOS Feature

**Boundary Engine**

Professor defines:

- Working hours
- Working days
- Response SLA
- Weekend deferral
- Auto-acknowledgment
- Emergency routing

System behavior:

- After-hours requests are queued.
- Student receives boundary message.
- Professor is not immediately notified unless truly urgent.

### Technical Entities

- professor_profiles
- boundaries
- requests
- workload_snapshots

### Outcome

Reduces the “virtual leash” feeling.

---

## Problem 5: Excessive Committee Service and Tenure Pressure

> Early-career faculty are drowning in service, threatening research time needed for tenure.

### FacultyOS Feature

**Service Ledger + Tenure Report Generator**

Professor logs:

- Committees
- Advising
- Accreditation work
- Peer review
- Department service
- Publications
- Grants
- Teaching evidence

FacultyOS generates:

- Annual review summary
- Service workload report
- Tenure dossier outline
- Research impact summary

### Technical Entities

- service_entries
- publications
- grants
- teaching_entries
- reports
- workload_snapshots

### Outcome

Professors can prove hidden labor and prepare reports faster.

---

## Problem 6: AI and Cheating Anxiety

> AI tools make cheating harder to detect and create stress for professors.

### FacultyOS Feature

**Academic Integrity Workflow, not AI Detection**

I strongly recommend not building an AI cheating detector in MVP.

Reasons:

- High false-positive risk
- Legal liability
- Student harm
- Professor distrust
- No reliable technical guarantee

Instead, build:

- Integrity pledge workflow
- Draft history collection
- Incident log
- Evidence vault
- Human review workflow
- Exportable case file

### Technical Entities

- requests
- attachments
- request_events
- admin_tasks
- audit_logs

### Outcome

Professor has a defensible process without relying on unreliable AI detection.

---

# 6. Proposed MVP Feature Priority

For a 4-week MVP, I recommend this priority order.

## Must-have

1. Professor authentication
2. Course creation
3. Student request portal
4. Request types:
   - Extension
   - Regrade
   - Meeting
   - Absence
   - Other
5. Policy engine:
   - Auto-approve
   - Auto-deny
   - Manual review
   - Require more info
   - Apply penalty
6. Professor triage inbox
7. Request detail page
8. Audit trail
9. Basic workload dashboard
10. Basic service ledger
11. CSV export
12. Billing/paywall

## Should-have

1. Email alias ingestion
2. AI classification
3. AI draft replies
4. Syllabus policy extraction
5. Report generation

## Could-have

1. TA delegation
2. Publication/grant tracker
3. Tenure narrative generator
4. Department dashboard

## Not in MVP

1. AI cheating detection
2. Mental health diagnosis
3. Full ERP integration
4. Mobile app
5. Real-time chat
6. LMS deep integration
7. Automated grade submission to university ERP

---

# 7. AI Usage Proposal

## AI Feature 1: Request Classification

Input:

```text
Student message:
"Sir, I could not submit the assignment because my laptop stopped working. Can I submit tomorrow?"
```

AI output must be structured:

```json
{
  "request_type": "extension",
  "urgency": "standard",
  "missing_fields": [
    "assignment_name",
    "current_deadline",
    "requested_new_deadline"
  ],
  "suggested_action": "ask_for_missing_information",
  "confidence": 0.87
}
```

This output is validated by Zod.

If confidence is low, route to manual review.

---

## AI Feature 2: Draft Response

AI drafts a reply using professor policy.

Example output:

```json
{
  "subject": "Extension Request Received",
  "body": "Your request has been received. According to the course policy, extensions require 48 hours notice. Please provide the missing assignment details.",
  "tone": "professional",
  "policy_references": [
    "Extension Policy v1"
  ]
}
```

Professor approves or edits before sending.

No automatic sending for high-stakes messages in MVP.

---

## AI Feature 3: Syllabus Policy Extraction

Professor pastes syllabus text.

AI suggests:

```json
{
  "policies": [
    {
      "policy_type": "extension",
      "name": "Extension requires 48 hours notice",
      "conditions": [
        {
          "field": "days_before_deadline",
          "operator": "greater_than_or_equal",
          "value": 2
        }
      ],
      "actions": [
        {
          "type": "auto_approve"
        }
      ]
    }
  ]
}
```

Professor reviews and activates each policy.

AI does not silently create enforceable rules.

---

## AI Feature 4: Workload Summary

AI summarizes:

```text
This week you received 42 requests.
31 were auto-resolved.
8 require manual review.
14 arrived after working hours.
Your largest time burden is regrade requests.
```

This is advisory only.

No clinical language.

No diagnosis.

---

# 8. Privacy and FERPA-Aligned Data Flow

Even if your university is outside the United States, designing to FERPA-like principles is wise.

## Core principle

FacultyOS should minimize education records and avoid becoming the official system of record.

---

## Proposed privacy model

### 1. Student access without full accounts

Students access a course portal using a course token.

They do not create a full FacultyOS account initially.

This reduces PII.

---

### 2. Store only necessary student data

For MVP, store:

```text
student_identity_id
display_label
email_hash
request_data
request_events
```

Avoid storing:

```text
official student ID
date of birth
medical information
disability status
mental health information
financial information
```

---

### 3. Redact before AI

Before sending anything to an LLM:

- Remove student name
- Remove student ID
- Remove email
- Remove phone number
- Remove health-related text if detected
- Remove protected attributes if detected

Example:

```text
Original:
"My name is Rahul, ID 22CSE104, I have fever and cannot attend."

Redacted:
"Student reports inability to attend due to a health-related reason. Direct student to university support office and do not collect details."
```

---

### 4. AI is opt-in

Professor can disable AI.

If AI is disabled:

- No LLM calls
- Only deterministic policy engine
- Manual triage only

---

### 5. Data retention

Recommended defaults:

| Data type | Retention |
|---|---:|
| Free plan requests | 30 days |
| Pro plan requests | 365 days |
| Department plan requests | configurable |
| Audit logs | same as request retention or longer if required |
| AI job logs | 90 days |
| Attachments | same as request retention |
| Workload snapshots | 24 months |

Professor can export and delete course data.

---

### 6. Institutional deployment requirement

If a university formally adopts FacultyOS:

- Sign a Data Processing Agreement
- Define data controller/processor roles
- Provide admin export
- Provide deletion workflow
- Provide audit logs
- Disable AI by default if required
- Store data in approved region if required

---

# 9. Ethical AI Guardrails

## Rule 1: No autonomous adverse decisions

AI cannot independently:

- Deny an extension
- Reduce a grade
- Accuse a student
- Escalate disciplinary action
- Flag cheating
- Make a final recommendation affecting academic standing

Only professor-approved deterministic policies may produce automated outcomes.

Even then, high-stakes cases should go to human review.

---

## Rule 2: Explainability

Every decision must show:

```text
Decision: Denied
Reason: Course policy requires 48 hours notice for extensions.
Policy: Extension Policy v2
Submitted: 6 hours before deadline
Action: Request denied automatically per professor-approved rule.
```

Not:

```text
AI decided this request is invalid.
```

---

## Rule 3: Confidence thresholds

If AI classification confidence is below threshold:

```text
Do not auto-classify.
Route to professor with “Needs classification”.
```

Example threshold:

```text
confidence >= 0.80 -> accept suggestion
confidence < 0.80 -> manual review
```

---

## Rule 4: Structured outputs only

Do not allow free-form AI decisions.

AI must return JSON validated by Zod.

If validation fails:

```text
Mark AI job failed.
Do not use output.
Route to manual process.
```

---

## Rule 5: No protected attributes

AI prompts and decision inputs must not include:

- Race
- Religion
- Gender
- Sexual orientation
- Disability
- Health status
- Mental health status
- Political views
- Family background

If detected, redact or block.

---

## Rule 6: Human-in-the-loop UI

Every AI suggestion should appear as:

```text
AI Suggestion: Classify as Extension
Confidence: 86%
Suggested Reply: [draft]

[Accept] [Edit] [Reject]
```

Never:

```text
AI has already sent this decision to the student.
```

For MVP, avoid automatic sending of AI-drafted messages.

---

# 10. Proposed Core API Endpoints

These are proposed, not implemented yet.

## Auth and Profile

```text
POST   /api/auth/signup
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/profile
PATCH  /api/profile
GET    /api/billing/usage
POST   /api/billing/checkout
POST   /api/webhooks/billing
```

---

## Courses

```text
POST   /api/courses
GET    /api/courses
GET    /api/courses/:courseId
PATCH  /api/courses/:courseId
DELETE /api/courses/:courseId
POST   /api/courses/:courseId/access-token/rotate
```

---

## Policies

```text
POST   /api/courses/:courseId/policies
GET    /api/courses/:courseId/policies
PATCH  /api/policies/:policyId
DELETE /api/policies/:policyId
POST   /api/policies/:policyId/activate
POST   /api/policies/:policyId/deactivate
```

---

## Student Requests

Public/student-facing:

```text
GET    /api/public/courses/:courseToken
POST   /api/public/courses/:courseToken/requests
GET    /api/public/requests/:requestToken
POST   /api/public/requests/:requestToken/messages
```

Professor-facing:

```text
GET    /api/requests
GET    /api/requests/:requestId
POST   /api/requests/:requestId/decision
POST   /api/requests/:requestId/message
POST   /api/requests/:requestId/assign
POST   /api/requests/:requestId/resolve
POST   /api/requests/:requestId/close
```

---

## AI Assistant

```text
POST   /api/ai/classify-request
POST   /api/ai/draft-response
POST   /api/ai/extract-policies
POST   /api/ai/summarize-workload
```

All AI endpoints should be internal/authenticated and subject to consent checks.

---

## Tasks

```text
POST   /api/tasks
GET    /api/tasks
PATCH  /api/tasks/:taskId
POST   /api/tasks/:taskId/complete
DELETE /api/tasks/:taskId
```

---

## Career Ledger

```text
POST   /api/ledger/service
GET    /api/ledger/service
PATCH  /api/ledger/service/:entryId

POST   /api/ledger/publications
GET    /api/ledger/publications
PATCH  /api/ledger/publications/:entryId

POST   /api/ledger/grants
GET    /api/ledger/grants
PATCH  /api/ledger/grants/:entryId

POST   /api/ledger/teaching
GET    /api/ledger/teaching
PATCH  /api/ledger/teaching/:entryId
```

---

## Reports and Workload

```text
GET    /api/workload/dashboard
GET    /api/workload/snapshots
POST   /api/reports/generate
GET    /api/reports
GET    /api/reports/:reportId/download
```

---

## Inbound Email Triage

```text
POST   /api/inbound/email
```

This endpoint will be called by the Cloudflare Email Worker after redaction and initial parsing.

---

# 11. Proposed Folder Structure After Approval

Once you approve the architecture, I propose a clean structure like this:

```text
src/
  app/
    (marketing)/
    (auth)/
    (dashboard)/
    api/
  components/
    ui/
    courses/
    requests/
    policies/
    ledger/
    reports/
    workload/
    billing/
  server/
    auth/
    db/
    services/
    policy-engine/
    ai/
    privacy/
    actions/
  lib/
    validations/
    utils/
    constants/
  workers/
    email-worker/
    cron/
    queue-consumers/
  emails/
  tests/
```

But I will not generate code until you approve the architecture.

---

# 12. Recommended MVP Timeline: 4 Weeks

Assuming a 4-week timeline:

## Week 1: Foundation

- Auth
- Profile
- Course creation
- Database schema
- Basic dashboard
- Cloudflare deployment

## Week 2: Request Engine

- Student portal
- Request forms
- Request storage
- Professor inbox
- Request detail page
- Basic audit events

## Week 3: Policy Engine + Boundaries

- Policy builder
- Rule evaluation
- Auto approve/deny/manual review
- Penalty application
- Boundary settings
- Auto-reply templates

## Week 4: AI Assistant + Reports + Billing

- AI classification optional
- AI draft reply optional
- Workload dashboard
- Basic service ledger
- CSV export
- Billing/paywall
- Deploy and test

---

# 13. Key Architectural Decisions Requiring Your Approval

Please approve or modify the following:

## Decision 1: Core stack

Use:

```text
Next.js 15
Cloudflare Workers
OpenNext Cloudflare Adapter
Cloudflare D1
Drizzle ORM
Better Auth
Zod
Tailwind CSS
```

Do you approve?

---

## Decision 2: Deterministic policy engine first

Use deterministic rules for final policy decisions.

Use AI only for:

- Classification
- Drafting
- Summarization
- Policy suggestion

Do you approve?

---

## Decision 3: No AI cheating detection in MVP

Replace with academic integrity workflow.

Do you approve?

---

## Decision 4: No clinical wellbeing metrics

Replace “Emotional Wellbeing Metrics” with:

```text
Workload & Boundary Metrics
```

Optional self-reported workload pressure is non-clinical and private.

Do you approve?

---

## Decision 5: Student data minimization

Students do not create full accounts in MVP.

Use course token and pseudonymous student identity where possible.

Do you approve?

---

## Decision 6: AI provider

Choose one:

### Option A: Cloudflare Workers AI only

Pros:

- Free/generous
- Inside Cloudflare
- Simpler privacy boundary

Cons:

- May have lower drafting quality than frontier models

### Option B: OpenAI/Anthropic API

Pros:

- Better quality
- Better structured outputs

Cons:

- Cost
- Requires careful data handling
- Requires privacy consent

### Option C: Hybrid

- Cloudflare Workers AI for MVP/dev
- Optional OpenAI/Anthropic for paid plans

My recommendation:

> **Option C: Hybrid**, with AI disabled by default for sensitive workflows and enabled only with professor consent.

Which option do you prefer?

---

# 14. My Recommendation

For a safe, fundable, professor-trusting MVP, I recommend:

```text
FacultyOS = Deterministic Policy Engine + AI Assistant + Workload Ledger
```

Not:

```text
FacultyOS = Autonomous AI decision system
```

This gives you:

- Faster MVP
- Lower legal risk
- Higher professor trust
- Better FERPA-aligned privacy
- Clear explainability
- Lower AI cost
- Easier adoption inside universities

---

