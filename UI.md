# **NeuGlass Premium**
## A balanced fusion of **Neumorphism** and **Liquid Glassmorphism**

The goal is to make FacultyOS feel:

- Calm
- Premium
- Trustworthy
- Fast
- Explainable
- Low-stress for professors
- Visually modern without sacrificing accessibility

---

# 1. High-Level Product Workflow

FacultyOS has two main user sides:

1. **Professor side**
   - Configure courses
   - Define policies
   - Triage requests
   - Protect time
   - Track workload
   - Generate reports

2. **Student side**
   - Submit structured requests
   - Read policy guidance
   - Provide required details
   - Receive policy-based responses

---

## Core FacultyOS Loop

```text
Student submits request
        ↓
FacultyOS validates request
        ↓
Syllabus gate / policy quiz
        ↓
Deterministic policy engine evaluates request
        ↓
AI assistant suggests classification, priority, and draft reply
        ↓
Professor reviews if needed
        ↓
Decision is recorded with explanation
        ↓
Student receives response
        ↓
Event is logged for audit and workload analytics
```

---

# 2. Main User Workflows

## Workflow A: Professor Onboarding

### Goal
Get a professor from signup to a working course portal in under 10 minutes.

### Steps

1. **Sign up**
   - Email/password or institutional OAuth if available.

2. **Create profile**
   - Name
   - Institution
   - Faculty title
   - Timezone
   - Privacy preferences
   - AI consent

3. **Set boundaries**
   - Working hours
   - Working days
   - Response SLA
   - Weekend deferral
   - Auto-reply message

4. **Create first course**
   - Course code
   - Course name
   - Term
   - Syllabus paste/upload optional

5. **Choose policy templates**
   - Extension policy
   - Regrade policy
   - Meeting policy
   - Recommendation letter policy
   - Absence policy

6. **Review AI-suggested policies**
   - If syllabus is pasted, AI suggests rules.
   - Professor approves or edits each rule.

7. **Publish course portal**
   - Generate secure course link.
   - Share with students.

8. **Start trial**
   - Free plan or Pro trial.

---

## Workflow B: Student Submits Extension Request

### Student journey

1. Student opens course portal link.
2. Student selects:
   ```text
   Request Extension
   ```
3. Student sees policy summary:
   ```text
   Extensions require 48 hours notice.
   Late submissions may receive a 10% penalty.
   Medical documentation is not collected here.
   ```
4. Student fills structured form:
   - Assignment name
   - Current deadline
   - Requested new deadline
   - Reason category
   - Details
   - Supporting document if required

5. Student submits.

### System journey

1. Validate with Zod.
2. Rate-limit and Turnstile check.
3. Create pseudonymous student identity if needed.
4. Policy engine evaluates request.
5. AI suggests:
   - Category
   - Priority
   - Missing information
   - Draft response
6. Decision outcome:
   - Auto-approved
   - Auto-denied
   - Needs professor review
   - Needs more student information

7. Professor inbox updates if manual review is required.

---

## Workflow C: Professor Triage Inbox

### Goal
Reduce cognitive load.

Professor sees grouped queues:

```text
Needs Decision
Needs Student Info
Auto-Resolved
Urgent
TA Review
Closed
```

Each request card shows:

- Request type
- Course
- Student alias
- Priority
- Policy matched
- AI suggestion
- Deadline
- One-click actions

### Professor actions

- Approve
- Deny
- Request more info
- Apply penalty
- Assign to TA
- Add private note
- Send response
- Escalate
- Close

Every action creates an audit event.

---

## Workflow D: Regrade Request Defense

### Student journey

Student must complete:

- Assignment name
- Current grade
- Specific rubric item
- Their submitted answer/text
- Professor feedback
- Why the rubric was not met

If incomplete:

```text
Your request cannot be reviewed until all required rubric details are provided.
```

### System journey

1. Check assignment weight.
2. Check regrade deadline.
3. Check if regrades are allowed.
4. Route to professor/grader.
5. Show rubric comparison view.
6. Record final decision.

---

## Workflow E: Meeting Request Filtering

Student or colleague requests a meeting.

Required fields:

- Purpose
- Agenda
- Desired outcome
- Can this be handled asynchronously?
- Preferred time slots

System checks:

- Is it within office hours?
- Is it a regrade disguised as a meeting?
- Is it a request already handled by policy?
- Is the meeting necessary?

Possible outcomes:

- Offer async portal request
- Offer office hours
- Allow meeting booking
- Route to professor for approval

---

## Workflow F: Workload and Career Reporting

FacultyOS continuously aggregates:

- Requests received
- Requests auto-resolved
- Manual decisions
- After-hours requests
- Meetings
- Committee entries
- Publications
- Grants
- Teaching entries
- Service entries

Professor can generate:

- Weekly workload summary
- Monthly service report
- Annual review summary
- Tenure dossier outline
- Accreditation evidence list

---

# 3. Application Architecture

## Architectural Style

FacultyOS should use a **modular service-oriented architecture inside a Next.js/Cloudflare Workers app**.

Not microservices overkill.

Instead:

```text
Modular monolith for MVP
+
Worker-based background services
```

This gives speed of development and clean future separation.

---

# 4. High-Level System Architecture

```text
                        Browser
                          |
                          v
                 Next.js 15 Application
        Professor Dashboard / Student Portal / API
                          |
                          v
              Cloudflare Workers Runtime
                          |
        +-----------------+-----------------+
        |                 |                 |
        v                 v                 v
Application Services  Domain Services   Integration Services
        |                 |                 |
        |                 v                 |
        |         Deterministic             |
        |         Policy Engine             |
        |                 |                 |
        |                 v                 |
        |           AI Assistant            |
        |                 |                 |
        +-----------------+-----------------+
                          |
                          v
                  Cloudflare Platform
                          |
        +--------+--------+--------+--------+
        |        |        |        |        |
        v        v        v        v        v
       D1       KV       R2     Queues    Cron
     Database Cache    Files   Jobs      Scheduler
```

---

# 5. Core Application Modules

## 1. Identity Module

Handles:

- Professor login
- TA invitations
- Grader roles
- Session management
- Role-based access control

Entities:

```text
users
professor_profiles
course_members
roles
permissions
```

---

## 2. Course Module

Handles:

- Courses
- Terms
- Course access tokens
- Syllabus metadata
- Course settings

Entities:

```text
courses
course_access_links
syllabus_sections
course_members
```

---

## 3. Policy Module

Handles:

- Policy creation
- Policy templates
- Policy versioning
- Rule evaluation
- Policy preview/testing

Entities:

```text
policies
policy_versions
policy_snapshots
```

---

## 4. Request Module

Handles:

- Student requests
- Request status
- Request events
- Messages
- Attachments
- Decisions

Entities:

```text
student_identities
requests
request_messages
request_events
attachments
```

---

## 5. AI Assistant Module

Handles:

- Request classification
- Draft response generation
- Syllabus policy extraction
- Workload summarization
- AI audit logging

Entities:

```text
ai_jobs
ai_suggestions
ai_consent_logs
```

Important:

AI suggestions are always advisory.

---

## 6. Boundary Module

Handles:

- Working hours
- Response SLAs
- After-hours deferral
- Vacation mode
- Emergency resource routing

Entities:

```text
boundaries
boundary_overrides
workload_snapshots
```

---

## 7. Career Ledger Module

Handles:

- Service entries
- Committee work
- Publications
- Grants
- Teaching evidence
- Advising records

Entities:

```text
service_entries
publications
grants
teaching_entries
advising_entries
evidence_items
```

---

## 8. Reporting Module

Handles:

- Workload reports
- Service reports
- Annual review exports
- Tenure dossier outline
- CSV/PDF/HTML exports

Entities:

```text
reports
report_exports
```

---

## 9. Billing Module

Handles:

- Plans
- Usage metering
- Checkout
- Webhooks
- Plan limits

Entities:

```text
subscriptions
usage_metrics
billing_events
```

---

## 10. Privacy and Audit Module

Handles:

- Audit logs
- Consent
- Redaction status
- Data export
- Data deletion
- Retention rules

Entities:

```text
audit_logs
privacy_consents
data_retention_rules
deletion_requests
```

---

# 6. Request Processing Pipeline

This is the most important backend workflow.

```text
Incoming request
      ↓
Input validation
      ↓
Rate limiting / Turnstile
      ↓
Course token validation
      ↓
Student identity resolution
      ↓
PII redaction
      ↓
Policy engine evaluation
      ↓
AI suggestion generation
      ↓
Decision routing
      ↓
Audit event creation
      ↓
Notification queue
      ↓
Workload metric update
```

---

# 7. AI Workflow with Guardrails

```text
Raw request text
      ↓
Redaction layer
      ↓
Prompt builder
      ↓
LLM API
      ↓
Structured JSON output
      ↓
Zod validation
      ↓
Confidence check
      ↓
Human review if needed
      ↓
Store AI suggestion
      ↓
Professor accepts / edits / rejects
```

---

## AI Output UI Rules

Every AI suggestion must show:

```text
AI Suggestion
Purpose: Classify request
Confidence: 86%
Suggested type: Extension
Suggested priority: Standard

[Accept] [Edit] [Reject]
```

Never show:

```text
AI has decided.
```

Always show:

```text
AI suggests. Professor decides.
```

---

# 8. UI/UX Vision: NeuGlass Premium

## Design Philosophy

FacultyOS must feel like a calm, premium operating system for professors.

Not flashy.

Not noisy.

Not intimidating.

It should feel like:

> “A quiet, intelligent command center.”

---

## Visual Fusion Strategy

We will use:

### Neumorphism for structure

Neumorphism will define:

- Cards
- Sidebar items
- Buttons
- Input fields
- Toggles
- KPI tiles
- Stable dashboard surfaces

Why?

Neumorphism gives a soft, tactile, low-glare experience.

---

### Liquid Glassmorphism for intelligence and overlays

Liquid glass will define:

- Modals
- AI assistant panel
- Command palette
- Notifications
- Dropdowns
- Slide-over drawers
- Policy preview panels
- Premium upgrade surfaces

Why?

Glassmorphism gives a modern, intelligent, floating feel.

---

## Design Rule

Use this hierarchy:

```text
Persistent surfaces = Neumorphic
Temporary/intelligent surfaces = Liquid Glass
```

This prevents the UI from becoming visually noisy or inaccessible.

---

# 9. NeuGlass Design Principles

## 1. Calm over clever

Professors are stressed. The UI must reduce cognitive load.

---

## 2. Explainability is UX

Every automated decision must show why.

Example:

```text
Denied because extension was requested 6 hours before deadline.
Policy requires 48 hours notice.
```

---

## 3. AI is visible but not dominant

AI appears as a helper panel, not the main decision-maker.

---

## 4. Premium but readable

Glass effects must never reduce text contrast.

---

## 5. Fast keyboard workflows

Professors should triage with keyboard shortcuts.

---

## 6. Privacy visible

Show redaction, consent, and data controls clearly.

---

# 10. UI Layout System

## App Shell

```text
+-------------------------------------------------------------+
| Sidebar | Top Bar                                           |
|         |---------------------------------------------------|
|         |                                                   |
|         | Main Content                                      |
|         |                                                   |
|         |                                                   |
|         |                                                   |
+-------------------------------------------------------------+
```

---

## Sidebar

Neumorphic vertical sidebar.

Items:

```text
Dashboard
Inbox
Courses
Requests
Meetings
Boundaries
Ledger
Reports
Settings
Billing
```

Active item:

- Soft inset background
- Glass pill highlight
- Accent icon glow

---

## Top Bar

Floating glass top bar.

Contains:

- Search / Command palette
- Course switcher
- Notification bell
- AI assistant toggle
- Profile menu
- Upgrade button

---

# 11. Color System

## Light Mode

### Base background

```text
Soft Porcelain
#F4F6FB
```

### Surface

```text
#EDF1F7
```

### Elevated surface

```text
#F7F9FC
```

### Primary text

```text
#111827
```

### Secondary text

```text
#6B7280
```

### Accent gradient

```text
Indigo to Cyan
#6366F1 → #22D3EE
```

### Success

```text
#10B981
```

### Warning

```text
#F59E0B
```

### Danger

```text
#EF4444
```

### Info

```text
#3B82F6
```

---

## Dark Mode

### Base background

```text
Deep Navy
#0B1020
```

### Surface

```text
#111827
```

### Glass surface

```text
rgba(255,255,255,0.06)
```

### Primary text

```text
#F9FAFB
```

### Secondary text

```text
#9CA3AF
```

### Accent gradient

```text
Electric Indigo to Aqua
#818CF8 → #2DD4BF
```

---

# 12. Typography

Use clean, modern, readable fonts.

## Recommended font pairing

### Headings

```text
Sora or Manrope
```

### Body

```text
Inter
```

### Mono / data

```text
JetBrains Mono
```

---

## Type scale

| Usage | Size |
|---|---:|
| Large dashboard heading | 28px |
| Section heading | 20px |
| Card title | 16px |
| Body | 14px |
| Small label | 12px |
| Tiny badge | 11px |

---

# 13. Depth System

FacultyOS should have clear depth levels.

| Level | Usage | Style |
|---|---|---|
| Level 0 | Page background | Soft matte |
| Level 1 | Cards | Neumorphic raised |
| Level 2 | Inputs | Neumorphic inset |
| Level 3 | Glass panels | Liquid glass |
| Level 4 | Modals | Heavy glass blur |
| Level 5 | Toasts/command palette | Floating glass |

---

# 14. Shadow and Glass Specifications

## Light Mode Neumorphic Card

```text
background: #EDF1F7
border-radius: 20px
border: 1px solid rgba(255,255,255,0.6)
shadow:
  10px 10px 24px rgba(163,177,198,0.45),
  -10px -10px 24px rgba(255,255,255,0.9)
```

---

## Light Mode Inset Input

```text
background: #E9EDF4
border-radius: 12px
shadow:
  inset 4px 4px 8px rgba(163,177,198,0.35),
  inset -4px -4px 8px rgba(255,255,255,0.9)
border: 1px solid transparent
focus border: rgba(99,102,241,0.35)
```

---

## Light Mode Liquid Glass Panel

```text
background: rgba(255,255,255,0.55)
backdrop-filter: blur(24px) saturate(140%)
border: 1px solid rgba(255,255,255,0.45)
border-radius: 24px
shadow: 0 20px 50px rgba(15,23,42,0.12)
```

---

## Dark Mode Neumorphic Card

```text
background: #121826
border-radius: 20px
border: 1px solid rgba(255,255,255,0.06)
shadow:
  10px 10px 28px rgba(0,0,0,0.45),
  -10px -10px 28px rgba(255,255,255,0.03)
```

---

## Dark Mode Liquid Glass Panel

```text
background: rgba(17,24,39,0.55)
backdrop-filter: blur(24px) saturate(140%)
border: 1px solid rgba(255,255,255,0.08)
border-radius: 24px
shadow: 0 20px 60px rgba(0,0,0,0.45)
```

---

# 15. Component Design System

## Primary Button

### Structure

- Neumorphic raised base
- Subtle gradient glow on hover
- Glassy inner highlight

### Visual

```text
background: linear-gradient(135deg, #6366F1, #4F46E5)
text: white
border-radius: 14px
shadow:
  0 10px 24px rgba(79,70,229,0.25),
  inset 0 1px 0 rgba(255,255,255,0.25)
```

### Hover

```text
translateY(-1px)
glow intensity +10%
```

---

## Secondary Button

```text
background: neumorphic surface
text: primary text
border-radius: 14px
soft raised shadow
```

Hover:

```text
slight inset shadow
```

---

## Ghost Button

```text
transparent background
text: secondary
hover: soft glass background
```

---

## Cards

Used for:

- KPI tiles
- Course cards
- Request cards
- Policy cards
- Ledger entries

Card structure:

```text
+--------------------------------------+
| Icon       Title            Badge    |
|                                      |
| Main content                         |
|                                      |
| Footer actions                       |
+--------------------------------------+
```

---

## Badges

Use glass pills.

Examples:

```text
Urgent
Standard
Auto-Resolved
Needs Decision
Policy Matched
AI Suggestion
```

Badge style:

```text
background: rgba(99,102,241,0.12)
border: 1px solid rgba(99,102,241,0.25)
backdrop-filter: blur(12px)
border-radius: 999px
```

---

## Input Fields

Neumorphic inset.

Focus state:

```text
accent ring
subtle glass glow
```

Important:

Do not rely only on shadow. Add visible border/focus ring for accessibility.

---

## Toggle Switch

Neumorphic track with glass knob.

Enabled state:

```text
track: subtle accent gradient
knob: raised glass
```

---

## Modal

Liquid glass.

Modal structure:

```text
+--------------------------------+
| Title                   Close  |
|                                |
| Content                        |
|                                |
| Footer actions                 |
+--------------------------------+
```

Background:

```text
blur page
darken slightly
```

---

## Toast Notifications

Floating glass.

Examples:

```text
Request approved
Policy updated
AI suggestion ready
Report exported
```

Toast style:

```text
top-right
glass background
subtle accent border
auto-dismiss
```

---

# 16. Screen-by-Screen UI/UX

---

## Screen 1: Landing Page

### Purpose

Explain FacultyOS clearly.

### Hero section

Headline:

```text
The operating system for professors.
```

Subheadline:

```text
Automate student requests, enforce syllabus policies, protect your time, and document your career.
```

Buttons:

```text
Start Free
View Demo
```

### Visual style

- Soft neumorphic dashboard preview
- Floating glass AI assistant card
- Ambient gradient blobs behind glass panels
- Minimal text
- Premium spacing

### Sections

1. Problem
2. Solution
3. Policy engine
4. AI assistant
5. Workload reports
6. Privacy
7. Pricing
8. FAQ

---

## Screen 2: Signup / Login

### Layout

Centered glass card on soft neumorphic background.

Fields:

```text
Email
Password
```

Primary button:

```text
Continue
```

Secondary:

```text
Continue with Google
```

### Premium detail

- Glass card
- Soft ambient gradient
- Subtle logo glow
- Large readable inputs

---

## Screen 3: Professor Dashboard

### Purpose

Show what needs attention immediately.

### Layout

```text
+-------------------------------------------------------------+
| Welcome back, Dr. Sharma                                    |
| You have 6 requests needing review.                         |
+-------------------------------------------------------------+
| KPI Card | KPI Card | KPI Card | KPI Card                   |
+-------------------------------------------------------------+
| Triage Queue                     | Workload Chart            |
|                                  |                           |
|                                  |                           |
+-------------------------------------------------------------+
| Recent Requests                                             |
+-------------------------------------------------------------+
```

---

### KPI Cards

Neumorphic tiles.

Examples:

```text
Needs Decision
Auto-Resolved Today
After-Hours Requests
Due Today
```

Each card:

```text
Large number
Small label
Trend indicator
Soft icon glow
```

---

### Triage Queue

List of requests.

Each row:

```text
[Priority dot] Extension - CS301 - Student #124
Policy: 48-hour notice not met
AI: Standard
[Review]
```

---

## Screen 4: Inbox / Request Triage

This is the most important screen.

### Layout

Three-pane layout:

```text
+-------------+---------------------------+------------------+
| Queue List  | Request Detail            | Policy/AI Panel  |
+-------------+---------------------------+------------------+
```

---

### Left pane: Queues

Queues:

```text
Needs Decision
Urgent
Needs Student Info
Auto-Resolved
TA Review
Closed
```

---

### Middle pane: Request Detail

Header:

```text
Extension Request
Course: CS301
Student: Student #124
Status: Needs Decision
Priority: Standard
```

Sections:

```text
Request summary
Submitted details
Attachments
Timeline
Professor notes
Response draft
```

Action bar:

```text
Approve
Deny
Need Info
Assign
Close
```

---

### Right pane: Policy + AI Panel

This is a liquid glass slide-over panel.

Tabs:

```text
Policy
AI Suggestion
Audit
```

Policy tab:

```text
Matched Policy: Extension Policy v2
Rule: Requires 48 hours notice
Submitted: 14 hours before deadline
Outcome: Manual review recommended
```

AI tab:

```text
AI Classification: Extension
Confidence: 88%
Suggested Priority: Standard
Draft Response: [editable]

[Accept] [Edit] [Reject]
```

Audit tab:

```text
Request created
Policy matched
AI suggestion generated
Professor opened request
```

---

## Screen 5: Course Detail

### Purpose

Manage one course.

### Header

```text
CS301 - Database Systems
Term: Fall 2026
Status: Active
```

Actions:

```text
Share portal link
Rotate token
View requests
Edit syllabus
```

---

### Tabs

```text
Overview
Requests
Policies
Rubrics
Members
Settings
```

---

## Screen 6: Policy Builder

### Purpose

Let professors create rules visually.

### Layout

Neumorphic card-based rule builder.

Rule row:

```text
When [request type] [field] [operator] [value]
Then [action]
```

Example:

```text
When extension request is made
And days before deadline < 2
Then apply 10% penalty and route to manual review
```

---

### UI Components

- Dropdown glass menus
- Inset inputs
- Add condition button
- Add action button
- Policy preview panel
- Test request panel

---

### Policy Preview

Right-side glass panel:

```text
This policy will apply to:
- Extension requests submitted less than 48 hours before deadline.

Actions:
- Apply 10% penalty
- Mark as manual review
```

---

## Screen 7: Student Portal

### Purpose

Student submits request without creating an account.

### Design

Very simple.

No heavy dashboard.

Just a clean, guided flow.

---

### Layout

```text
+--------------------------------------+
| CS301 - Database Systems             |
| Dr. Sharma                           |
+--------------------------------------+
| What do you need help with?          |
|                                      |
| [Extension] [Regrade] [Meeting]     |
| [Absence] [Missing Grade] [Other]   |
+--------------------------------------+
```

---

### Request Type Cards

Neumorphic cards with glass hover.

Each card:

```text
Icon
Title
Short description
```

---

### Form Flow

Use stepper:

```text
1. Request type
2. Details
3. Policy check
4. Attachments
5. Review
6. Submit
```

---

### Policy Check Step

Show:

```text
Before submitting, please confirm:

Extensions require 48 hours notice.
Late penalties may apply.
Medical documentation is not required here.
For medical or mental-health emergencies, contact university support services.
```

Checkbox:

```text
I have read the course policy.
```

---

### Submission Result

If auto-approved:

```text
Your request has been approved according to course policy.
New deadline: 22 Oct, 11:59 PM.
```

If manual review:

```text
Your request has been submitted for review.
Expected response: within 2 working days.
```

If more info needed:

```text
Please provide the missing assignment name and requested deadline.
```

---

## Screen 8: AI Assistant Panel

### Purpose

Assist professor without taking control.

### Trigger

Professor clicks:

```text
AI Assist
```

Or opens right-side panel.

---

### Panel Style

Liquid glass drawer.

Contents:

```text
AI Suggestions
Draft response
Missing fields
Policy summary
Workload insight
```

---

### Example AI Suggestion Card

```text
Suggestion
This appears to be an extension request.

Confidence: 91%

Recommended action:
Ask student to provide assignment name and requested deadline.

[Apply] [Edit] [Dismiss]
```

---

### AI Transparency Footer

Always visible:

```text
AI suggestions are advisory. Final decisions remain with the professor.
```

---

## Screen 9: Boundaries Screen

### Purpose

Protect work-life balance.

### Layout

Large neumorphic settings cards.

Sections:

```text
Working Hours
Response Time
Weekend Mode
Vacation Mode
Emergency Resources
```

---

### Working Hours

Visual day/time selector.

Example:

```text
Monday to Friday
9:00 AM - 6:00 PM
```

---

### Response SLA

```text
Standard requests: 48 hours
Urgent requests: 4 hours
Weekend requests: deferred to Monday
```

---

### Vacation Mode

Toggle:

```text
Vacation Mode
```

When enabled:

```text
All non-urgent requests are deferred.
Students receive an automatic notice.
Optional delegate email can be set.
```

---

## Screen 10: Workload Dashboard

### Purpose

Show administrative burden without medical language.

### Layout

```text
+-------------------------------------------------------------+
| Workload Overview                                           |
+-------------------------------------------------------------+
| Requests this week | Auto-resolved | Manual review | After-hours |
+-------------------------------------------------------------+
| Request volume chart                                        |
+-------------------------------------------------------------+
| Time burden by category                                     |
+-------------------------------------------------------------+
| Top courses by request volume                               |
+-------------------------------------------------------------+
```

---

### Charts

Use soft, minimal charts.

Chart style:

- Thin lines
- Gradient area fill
- Glass tooltip
- No aggressive red unless urgent

---

### Workload Insight Card

```text
This week, regrade requests consumed the most review time.
Consider clarifying rubric item 3 or adding a regrade FAQ.
```

---

## Screen 11: Career Ledger

### Purpose

Track tenure-related evidence.

### Tabs

```text
Service
Publications
Grants
Teaching
Advising
```

---

### Service Ledger Table

Columns:

```text
Activity
Role
Start
End
Hours/month
Evidence
```

Add entry button:

```text
+ Add Service Entry
```

---

### Entry Card

Neumorphic card.

Example:

```text
NAAC Documentation Committee
Role: Member
Feb 2026 - Present
Estimated 4 hours/month
Evidence: meeting_notes.pdf
```

---

## Screen 12: Reports

### Purpose

Generate exportable reports.

Report types:

```text
Annual Review
Tenure Dossier Outline
Service Workload
Teaching Summary
Research Impact
```

---

### Report Generation UI

Glass modal:

```text
Generate Annual Review

Period: Jan 2026 - Dec 2026
Include:
[x] Teaching
[x] Research
[x] Service
[x] Advising
[ ] Student request analytics

[Generate Report]
```

---

### Report Preview

Two-column layout:

```text
Left: Report outline
Right: Editable narrative preview
```

Export options:

```text
CSV
HTML
PDF via browser print
Markdown
```

---

## Screen 13: Settings

### Sections

```text
Profile
Privacy
AI Preferences
Notifications
Boundaries
Billing
Data Export
Danger Zone
```

---

### AI Preferences

Toggles:

```text
Enable AI request classification
Enable AI response drafts
Enable syllabus policy extraction
Allow AI summaries
```

Consent notice:

```text
AI processing uses redacted request data. Student medical details are not collected.
```

---

### Privacy Controls

Buttons:

```text
Export my data
Delete course data
Request deletion
View audit log
```

---

# 17. Student UI/UX Rules

Student-facing screens must be:

- Simple
- Respectful
- Non-accusatory
- Mobile-friendly
- Fast
- No dark patterns

---

## Student UI Principles

### 1. No guilt language

Bad:

```text
You did not read the syllabus.
```

Good:

```text
Please review the course policy before submitting.
```

---

### 2. Clear expectations

Show:

```text
Expected response time: 2 working days.
```

---

### 3. No medical intake

If student selects health-related reason:

```text
FacultyOS does not collect medical or mental-health information.
Please contact the appropriate university support office.
```

---

### 4. Progress indicators

Use stepper:

```text
Step 2 of 5
```

---

### 5. Save draft if possible

If student leaves, allow returning within session.

---

# 18. Professor UX Rules

## 1. Minimize clicks

Common actions should be one or two clicks.

---

## 2. Keyboard-first triage

Shortcuts:

```text
J/K = navigate requests
Enter = open request
A = approve
D = deny
I = request more info
M = mark manual
N = add note
Cmd/Ctrl + K = command palette
```

---

## 3. Bulk actions

For low-risk actions:

```text
Mark closed
Send reminder
Assign to TA
```

But high-stakes actions should not be bulk automated.

---

## 4. Explainable decisions

Every auto decision shows:

```text
Policy matched
Condition evaluated
Action taken
Timestamp
```

---

## 5. Calm notifications

Use urgency only when necessary.

Do not create anxiety.

---

# 19. Command Palette

A premium feature.

Trigger:

```text
Cmd/Ctrl + K
```

Style:

```text
Floating liquid glass modal
```

Actions:

```text
Go to Inbox
Create course
Generate report
Toggle vacation mode
Search requests
Open settings
```

---

# 20. Microinteractions

## Button hover

```text
Slight lift
Soft glow
150ms ease-out
```

---

## Card hover

```text
Border highlight
Subtle shadow increase
```

---

## AI suggestion appears

```text
Glass panel slides in
Soft blur transition
```

---

## Request approved

```text
Success toast
Card animates to resolved queue
```

---

## Loading states

Use neumorphic skeleton cards with soft shimmer.

Avoid harsh spinners.

---

## Reduced motion

If user prefers reduced motion:

```text
Disable blur animations
Disable parallax
Use instant transitions
```

---

# 21. Empty States

Empty states should feel calm, not broken.

---

## Inbox empty

```text
No requests need your attention.
```

Subtext:

```text
New student requests will appear here.
```

---

## No policies

```text
Create your first policy.
```

Button:

```text
Use template
```

---

## No reports

```text
Generate your first workload report.
```

---

## AI disabled

```text
AI assistant is turned off.
Enable AI suggestions in settings.
```

---

# 22. Error States

Errors must be useful and non-alarming.

---

## AI failed

```text
AI suggestion unavailable.
You can continue manually.
```

---

## Attachment too large

```text
File exceeds 5 MB limit.
Please upload a smaller file.
```

---

## Invalid request type

```text
This request type is not enabled for this course.
```

---

## Rate limited

```text
Too many submissions. Please try again in a few minutes.
```

---

# 23. Accessibility Requirements

Neumorphism and glassmorphism can fail accessibility if not careful.

## Must-have

1. Text contrast minimum WCAG AA.
2. Visible focus states.
3. Do not rely only on shadows.
4. Use borders for inputs.
5. Large tap targets.
6. Keyboard navigation.
7. Screen-reader labels.
8. Reduced motion support.
9. Dark mode.
10. Optional high-contrast mode.

---

## Specific fixes

### For neumorphism

Add subtle borders:

```text
1px solid rgba(0,0,0,0.05)
```

This helps users with low vision distinguish cards.

---

### For glassmorphism

Do not use glass for long-form reading.

Use glass for:

- Modals
- Drawers
- Tooltips
- Notifications

Use solid/neumorphic surfaces for:

- Forms
- Tables
- Dashboards
- Reports

---

# 24. Premium Visual Details

To make FacultyOS feel high-end:

## Ambient background

Very subtle gradient mesh:

```text
Indigo
Cyan
Soft violet
```

Low opacity.

Add noise texture at 2-4% opacity.

---

## Specular highlights

On glass panels:

```text
Top-left soft white highlight
```

Creates liquid feel.

---

## Gradient borders

For active AI panel:

```text
1px gradient border
Indigo to cyan
```

---

## Cursor-aware glow

On cards:

```text
Subtle radial glow follows cursor
```

Keep intensity low.

---

## Premium typography spacing

Use generous whitespace:

```text
Section spacing: 48px
Card padding: 24px
Large card padding: 32px
```

---

# 25. UI Component Inventory

## Core components

```text
AppShell
Sidebar
TopBar
CommandPalette
KPICard
RequestCard
CourseCard
PolicyCard
LedgerEntryCard
GlassModal
GlassDrawer
AISuggestionPanel
PolicyPreviewPanel
NeuButton
GhostButton
GlassBadge
InsetInput
NeumorphicToggle
Tabs
Table
Timeline
EmptyState
ErrorState
SkeletonLoader
Toast
NotificationDropdown
BillingPlanCard
UsageMeter
```

---

# 26. Information Architecture

## Marketing Site

```text
Home
Features
Pricing
Security
Privacy
Terms
Demo
```

---

## Professor App

```text
Dashboard
Inbox
Courses
Requests
Meetings
Boundaries
Ledger
Reports
Settings
Billing
```

---

## Course Area

```text
Course Overview
Requests
Policies
Rubrics
Members
Settings
Portal Link
```

---

## Student Portal

```text
Course Home
Request Type
Request Form
Policy Check
Submission Status
```

---

# 27. Permission-Based UI

## Professor sees

```text
All requests
All policies
Billing
Reports
Audit logs
AI settings
```

---

## TA sees

```text
Assigned requests
Request detail
Response drafts
Assigned tasks
```

TA does not see:

```text
Billing
Private ledger
Professor boundaries
Audit logs
```

---

## Grader sees

```text
Regrade requests
Rubrics
Assignment details
```

Grader does not see:

```text
Student emails
Billing
Reports
Private notes
```

---

# 28. Notification UX

## Notification types

```text
Urgent request
Request assigned to you
SLA due soon
Report ready
AI suggestion ready
Payment failed
Trial ending
```

---

## Notification style

Glass dropdown.

Each notification:

```text
Icon
Title
Short description
Time
Action button
```

Example:

```text
Urgent request
CS301 extension request needs review.
10 minutes ago

[Review]
```

---

## Urgency design

Use color carefully.

Urgent:

```text
Soft red glass border
Not flashing
Not alarmist
```

---

# 29. Billing UX

## Pricing page

Three plan cards.

```text
Free
Pro
Department
```

Pro card:

```text
Highlighted with gradient glass border
```

---

## Upgrade modal

Liquid glass modal.

Content:

```text
Upgrade to FacultyOS Pro

Unlock:
- Unlimited courses
- Advanced policy engine
- AI assistant
- Workload reports
- Tenure ledger exports
```

Buttons:

```text
Start Pro
Not now
```

---

## Usage meters

Neumorphic progress bars with glass fill.

Examples:

```text
Requests used: 42 / 50
Courses used: 1 / 1
Reports generated: 0 / 1
```

---

# 30. Example Visual Composition

## Dashboard Hero Card

```text
+------------------------------------------------------+
| Good afternoon, Dr. Sharma                           |
|                                                      |
| 6 requests need review.                              |
| 31 requests were auto-resolved this week.            |
|                                                      |
| [Open Inbox] [Generate Weekly Report]                |
+------------------------------------------------------+
```

Style:

- Neumorphic card
- Soft gradient icon
- Glass action buttons
- Subtle accent glow

---

## AI Panel Example

```text
+--------------------------------------+
| AI Assistant                         |
+--------------------------------------+
| Request appears to be: Extension     |
| Confidence: 89%                      |
|                                      |
| Missing information:                 |
| - Assignment name                    |
| - Requested deadline                 |
|                                      |
| Suggested reply:                     |
| Please provide the assignment name   |
| and requested new deadline.          |
|                                      |
| [Use Draft] [Edit] [Reject]          |
+--------------------------------------+
```

Style:

- Liquid glass panel
- Soft blur
- Gradient confidence bar
- Clear advisory label

---

# 31. MVP Screen Priority

For the MVP, build these screens first:

## Priority 1

1. Auth
2. Professor dashboard
3. Course creation
4. Policy builder
5. Student request form
6. Request inbox
7. Request detail
8. Basic settings

---

## Priority 2

9. AI assistant panel
10. Boundaries settings
11. Workload dashboard
12. Billing page

---

## Priority 3

13. Career ledger
14. Reports
15. Command palette
16. Notification center

---

# 32. Final UI/UX Direction

FacultyOS should feel like:

> **A calm, premium, intelligent operating system for professors.**

Use:

```text
Neumorphism = structure, stability, calm surfaces
Liquid Glass = intelligence, overlays, AI, moments of premium delight
```

Do not overuse glass.

Do not let visuals reduce readability.

Do not let AI appear to make final decisions.

Do not make the student portal feel punitive.

---

# 33. One-Sentence Design Summary

**FacultyOS uses soft neumorphic dashboards for daily workflow and liquid glass panels for AI assistance, policy previews, and premium overlays, creating a calm, explainable, high-trust operating system for professors.**