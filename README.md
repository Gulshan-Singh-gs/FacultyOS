<p align="center">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" width="80" height="80">
    <rect width="64" height="64" rx="16" fill="#18181B" stroke="#27272A" stroke-width="1.5" />
    <rect x="16" y="16" width="9" height="32" rx="2" fill="#F4F4F5" />
    <rect x="29" y="16" width="9" height="9" rx="2" fill="#8B5CF6" />
    <rect x="41" y="16" width="9" height="9" rx="2" fill="#A78BFA" />
    <rect x="29" y="28" width="9" height="9" rx="2" fill="#8B5CF6" />
    <circle cx="33.5" cy="43.5" r="3.5" fill="#34D399" />
  </svg>
</p>

<h1 align="center">FacultyOS</h1>

<p align="center">
  <strong>The Privacy-First Academic Operations Platform for University Professors</strong><br />
  Turn syllabus policies into deterministic student request triage. Protect faculty time, research hours, and weekends.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.4-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/Cloudflare-OpenNext-F38020?logo=cloudflare" alt="Cloudflare" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tests-74%2F74%20Passing-10B981?logo=vitest" alt="Vitest Tests" />
  <img src="https://img.shields.io/badge/FERPA-Compliant%20By%20Design-6366F1" alt="FERPA" />
  <img src="https://img.shields.io/badge/Theme-Pitch%20Black%20%26%20Emerald-10B981" alt="Theme" />
</p>

---

## ⚡ Overview

Every semester, professors drown in hundreds of repetitive email requests for deadline extensions, regrades, absence excuses, and office hours. Generic AI chatbots hallucinate grades, expose institutions to liability, and collect invasive personal data.

**FacultyOS** converts course syllabi into a **100% deterministic policy compiler** deployed on the Cloudflare edge. It validates, routes, or auto-resolves student requests against published course rules in milliseconds — with zero medical data collection, mathematical consistency, and full audit logs.

---

## 🛡️ Core Architectural Principles

- **Hard Rule 1: Zero Medical Data Collection (FERPA Enforced)**  
  FacultyOS strictly refuses doctor notes, medical diagnoses, and disability disclosures. Health-related inquiries instantly trigger a calm redirect modal directing students to official university health and disability services.
- **Hard Rule 2: Deterministic Syllabus Compiler (Zero AI Hallucinations)**  
  Every triage decision is calculated through transparent boolean and numeric rules (e.g., token quotas, deadline offsets, late-slip limits). No stochastic LLMs make grade or extension determinations.
- **Hard Rule 5: Token-Isolated Pseudonymity**  
  Students access portals via ephemeral SHA-256 course and request tokens. No mandatory student accounts are required, preserving privacy and minimizing institutional attack surfaces.
- **Hard Rule 8: Immutable Audit Trail & Policy Snapshots**  
  Every approval, denial, or status change creates an immutable event in the audit ledger, permanently recording which policy version was in effect at submission time.

---

## ✨ Features

- **Professor Command Center (`/inbox`)**
  - Six specialized queues: *Needs Decision*, *Needs Student Info*, *Urgent*, *Auto-Resolved*, *TA Review*, and *Closed*.
  - Inline decision transitions (`Approve`, `Deny`, `Require Info`, `Assign TA`, `Close`).
  - Internal private notes field strictly isolated from student views.
  - One-click bulk resolution for auto-approved policy actions.
- **Student Request Portal (`/c/[courseToken]`)**
  - 6-step guided intake form with closed taxonomy.
  - Dynamic deadline calculators and late token counters.
  - Secure R2 attachment upload (homework drafts, rubrics, course files) with MIME-type and size guards.
- **Live Status Page (`/r/[requestToken]`)**
  - Real-time resolution status and plain-language reason explanations.
  - Policy snapshots detailing applicable syllabus clauses.
  - Zero mention of AI guarantee for student trust.
- **Course & Policy Studio (`/courses`)**
  - Create and configure course sections with active academic terms.
  - Rule builder supporting deadline offsets, penalty ladders, and late tokens.
- **Aesthetic Design System**
  - High-contrast pitch-black (`#000000`) surfaces with emerald (`#10B981`) brand accents.
  - Fluid glassmorphic panels and responsive mobile shell.
  - Instant dark / light theme switcher powered by external store state synchronization.

---

## 🏗️ Technology Stack

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | [Next.js 16](https://nextjs.org) (App Router, Turbopack) | Modern server components and server actions |
| **Deployment Adapter** | [@opennextjs/cloudflare](https://opennext.js.org/cloudflare) | Cloudflare Pages & Workers deployment |
| **Database** | [Cloudflare D1](https://developers.cloudflare.com/d1/) + [Drizzle ORM](https://orm.drizzle.team) | Distributed edge SQLite with schema migrations |
| **Key-Value & Rate Limiting** | [Cloudflare KV](https://developers.cloudflare.com/kv/) | Ephemeral sliding window rate limiting |
| **Object Storage** | [Cloudflare R2](https://developers.cloudflare.com/r2/) | FERPA-compliant course attachment bucket |
| **Authentication** | [Better-Auth](https://www.better-auth.com/) | Secure session management & cookie encryption |
| **Testing** | [Vitest 5](https://vitest.dev) | 74 automated unit, integration, and security tests |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com) | Vanilla CSS tokens with pitch-black / emerald theme |

---

## 🚀 Quick Start

### 1. Prerequisites
- [Node.js](https://nodejs.org) >= 20.x
- [pnpm](https://pnpm.io) >= 10.x

### 2. Clone & Install
```bash
git clone https://github.com/Gulshan-Singh-gs/FacultyOS.git
cd FacultyOS
pnpm install
```

### 3. Local Environment
Create `.dev.vars` for local Cloudflare bindings and secrets:
```ini
BETTER_AUTH_SECRET="facultyos-local-secret-at-least-32-chars-long"
RESEND_API_KEY="re_mock_key"
```

### 4. Run Development Server
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Verification & Testing

FacultyOS enforces strict gate suites before any deployment:

```bash
# Run all 74 unit and integration tests
pnpm test

# Verify TypeScript type safety
pnpm typecheck

# Check code linting
pnpm lint

# Build production bundle
pnpm build
```

---

## ☁️ Cloudflare Deployment

FacultyOS is optimized for deployment via **Cloudflare Pages** or **Cloudflare Workers** using `@opennextjs/cloudflare`:

1. Connect the repository in the **Cloudflare Dashboard** under **Workers & Pages**.
2. Configure build settings:
   - **Framework preset**: `None`
   - **Build command**: `pnpm run build`
   - **Build output directory**: `.open-next` (or `.open-next/assets`)
3. Set your Cloudflare D1, KV, and R2 bindings under **Settings → Bindings**.

---

## 📄 License

Private repository. Copyright © 2026 FacultyOS. All rights reserved.
