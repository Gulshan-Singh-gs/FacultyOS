import React from "react";
import Link from "next/link";
import {
  Shield,
  Zap,
  Clock,
  FileCheck2,
  Sliders,
  ArrowRight,
  Scale,
  GraduationCap,
  Inbox,
  AlertCircle,
  ExternalLink,
  Layers,
  FileText,
} from "lucide-react";
import { LANDING_CONFIG } from "@/config/landing";
import { LandingJsonLd } from "@/components/marketing/json-ld";
import { HeroDashboardMockup } from "@/components/marketing/hero-dashboard-mockup";
import { PolicySimulator } from "@/components/marketing/policy-simulator";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { PricingSection } from "@/components/marketing/pricing-section";
import { AnalyticsIsland } from "@/components/marketing/analytics-island";

export const dynamic = "force-static";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-base)] text-[var(--text-primary)] relative selection:bg-[var(--accent-primary)]/20">
      {/* JSON-LD Structured Data */}
      <LandingJsonLd />

      {/* Analytics Event Island */}
      <AnalyticsIsland />

      {/* Accessible Skip Link (WCAG 2.2 AA) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg shadow-lg font-medium text-xs"
      >
        Skip to main content
      </a>

      {/* Subtle Ambient Gradient Mesh (Light & Dark) */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-[36rem] h-[36rem] bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-[32rem] h-[32rem] bg-cyan-500/5 dark:bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-1/4 w-[30rem] h-[30rem] bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      {/* S1: Announcement Banner */}
      {LANDING_CONFIG.announcement.enabled && (
        <aside
          aria-label="Announcement"
          className="relative z-20 border-b border-[var(--border-neu-card)] bg-[var(--bg-surface)]/80 backdrop-blur-md px-4 py-2 text-center text-xs text-[var(--text-secondary)] flex items-center justify-center gap-2"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>{LANDING_CONFIG.announcement.text}</span>
          <Link
            href={LANDING_CONFIG.announcement.ctaHref}
            className="text-[var(--accent-primary)] font-semibold hover:underline inline-flex items-center gap-0.5 ml-1"
          >
            <span>{LANDING_CONFIG.announcement.ctaLabel}</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </aside>
      )}

      {/* S2: Sticky Liquid Glass Navigation */}
      <header className="sticky top-0 z-40 w-full px-4 sm:px-6 py-3.5 transition-all">
        <nav
          aria-label="Primary Navigation"
          className="max-w-7xl mx-auto glass-panel px-5 py-3 flex items-center justify-between shadow-lg"
        >
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-white font-bold text-base shadow-sm group-hover:scale-105 transition-transform">
              F
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight text-[var(--text-primary)]">
                FacultyOS
              </span>
              <span className="text-[9px] text-[var(--text-muted)] -mt-1 font-medium hidden sm:inline">
                Operations for Professors
              </span>
            </div>
          </Link>

          {/* Center Links (Desktop) */}
          <div className="hidden md:flex items-center gap-6 text-xs font-semibold text-[var(--text-secondary)]">
            <a href="#features" className="hover:text-[var(--text-primary)] transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-[var(--text-primary)] transition-colors">
              How It Works
            </a>
            <a href="#simulator" className="hover:text-[var(--text-primary)] transition-colors">
              Simulator
            </a>
            <a href="#comparison" className="hover:text-[var(--text-primary)] transition-colors">
              Comparison
            </a>
            <a href="#pricing" className="hover:text-[var(--text-primary)] transition-colors">
              Pricing
            </a>
            <a href="#faq" className="hover:text-[var(--text-primary)] transition-colors">
              FAQ
            </a>
          </div>

          {/* Right Action CTAs */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-2.5 py-1.5 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="btn-primary px-4 py-2 text-xs font-semibold inline-flex items-center gap-1 shadow-sm"
            >
              <span>Start Free</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </nav>
      </header>

      {/* Main Content Landmark */}
      <main id="main-content" className="relative z-10 flex-1 space-y-28 md:space-y-36 pb-24">
        {/* S3: Hero Section */}
        <section
          aria-labelledby="hero-heading"
          className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 md:pt-20 text-center space-y-8"
        >
          {/* Badges row */}
          <div className="inline-flex flex-wrap items-center justify-center gap-2 glass-badge px-3.5 py-1.5 text-xs font-semibold shadow-sm">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            <span>{LANDING_CONFIG.hero.badge}</span>
          </div>

          {/* Main H1 Headline & Subhead */}
          <div className="space-y-5 max-w-4xl mx-auto">
            <h1
              id="hero-heading"
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-[var(--text-primary)] leading-[1.12]"
            >
              {LANDING_CONFIG.hero.headline}
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-[var(--text-secondary)] leading-relaxed max-w-3xl mx-auto font-normal">
              {LANDING_CONFIG.hero.subhead}
            </p>
          </div>

          {/* Dual CTAs & Trust Line */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link
                href={LANDING_CONFIG.hero.primaryCta.href}
                className="w-full sm:w-auto btn-primary px-7 py-3.5 text-sm font-semibold inline-flex items-center justify-center gap-2 shadow-lg"
              >
                <span>{LANDING_CONFIG.hero.primaryCta.label}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href={LANDING_CONFIG.hero.secondaryCta.href}
                className="w-full sm:w-auto btn-secondary px-7 py-3.5 text-sm font-semibold inline-flex items-center justify-center gap-2"
              >
                <Sliders className="w-4 h-4 text-[var(--accent-primary)]" />
                <span>{LANDING_CONFIG.hero.secondaryCta.label}</span>
              </a>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              {LANDING_CONFIG.hero.trustLine}
            </p>
          </div>

          {/* Hero Pure CSS NeuGlass Dashboard Visual */}
          <div className="pt-6 sm:pt-10">
            <HeroDashboardMockup />
          </div>
        </section>

        {/* Pilot Quote Slot (Honesty Constraint: Render only if approved, else comment) */}
        {LANDING_CONFIG.pilotQuotes.length > 0 ? (
          <section className="max-w-4xl mx-auto px-6">
            {/* Real verified quote would render here */}
          </section>
        ) : null}
        {/* PILOT QUOTE PENDING */}

        {/* S4: Problem / Pain Section (4 Neu Cards) */}
        <section
          id="problem"
          aria-labelledby="problem-heading"
          className="max-w-6xl mx-auto px-4 sm:px-6 space-y-10 scroll-mt-24"
        >
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 glass-badge px-3 py-1 text-xs font-semibold">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
              <span>The Administrative Crisis</span>
            </div>
            <h2
              id="problem-heading"
              className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]"
            >
              Teaching Is Drowning in Repetitive Exceptions
            </h2>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              University faculty are overwhelmed by hundreds of uncoordinated student requests across email, LMS messages, and office drop-ins.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {LANDING_CONFIG.painPoints.map((pain) => (
              <div key={pain.id} className="card-neu p-6 space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--bg-input)] flex items-center justify-center text-[var(--accent-primary)] shadow-sm">
                    {pain.iconName === "Inbox" && <Inbox className="w-5 h-5" />}
                    {pain.iconName === "Clock" && <Clock className="w-5 h-5" />}
                    {pain.iconName === "Scale" && <Scale className="w-5 h-5" />}
                    {pain.iconName === "FileText" && <FileText className="w-5 h-5" />}
                  </div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    {pain.title}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {pain.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* S5: How It Works (3-Step Timeline) */}
        <section
          id="how-it-works"
          aria-labelledby="how-heading"
          className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12 scroll-mt-24"
        >
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 glass-badge px-3 py-1 text-xs font-semibold">
              <Layers className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              <span>Three-Step Triage Workflow</span>
            </div>
            <h2
              id="how-heading"
              className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]"
            >
              How FacultyOS Protects Your Schedule
            </h2>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Set up in ten minutes. Transparent rules handle routine logistics, while you stay in full control of every academic judgment call.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {LANDING_CONFIG.howItWorks.map((step) => (
              <div
                key={step.step}
                className="card-neu p-7 space-y-4 flex flex-col justify-between relative"
              >
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-400 text-white font-extrabold text-sm flex items-center justify-center shadow-md">
                    0{step.step}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-[var(--text-primary)]">
                      {step.title}
                    </h3>
                    <span className="text-[11px] font-semibold text-[var(--accent-primary)] block">
                      {step.subtitle}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* S6: Interactive Policy Simulator Island */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6">
          <PolicySimulator />
        </section>

        {/* S7: Feature Grid (6 Cards) */}
        <section
          id="features"
          aria-labelledby="features-heading"
          className="max-w-6xl mx-auto px-4 sm:px-6 space-y-10 scroll-mt-24"
        >
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 glass-badge px-3 py-1 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              <span>Engineered for Faculty</span>
            </div>
            <h2
              id="features-heading"
              className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]"
            >
              Six Built-In Systems to Reclaim Your Time
            </h2>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Every feature is built around academic reality: syllabus fairness, uncompensated service work, and FERPA privacy compliance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {LANDING_CONFIG.features.map((feat) => (
              <div key={feat.id} className="card-neu p-6 space-y-3.5 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-[var(--bg-input)] flex items-center justify-center text-[var(--accent-primary)] shadow-sm">
                      {feat.iconName === "Zap" && <Zap className="w-5 h-5" />}
                      {feat.iconName === "Inbox" && <Inbox className="w-5 h-5" />}
                      {feat.iconName === "Clock" && <Clock className="w-5 h-5" />}
                      {feat.iconName === "Scale" && <Scale className="w-5 h-5" />}
                      {feat.iconName === "GraduationCap" && <GraduationCap className="w-5 h-5" />}
                      {feat.iconName === "FileCheck2" && <FileCheck2 className="w-5 h-5" />}
                    </div>
                    {feat.badge && (
                      <span className="text-[10px] font-semibold text-[var(--text-muted)] bg-[var(--bg-surface-elevated)] px-2 py-0.5 rounded-full border border-[var(--border-neu-card)]">
                        {feat.badge}
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    {feat.title}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {feat.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* S8: AI Assistant Guardrails Section */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="glass-panel p-8 sm:p-10 space-y-6 border border-[var(--accent-primary)]/30 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-2">
                <span className="glass-badge text-xs font-semibold">
                  AI Guardrails • Hard Rule 2 & 4
                </span>
                <h3 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                  AI Suggests. Professors Decide. AI Never Auto-Sends.
                </h3>
              </div>
              <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-[var(--bg-input)] text-emerald-600 dark:text-emerald-400 border border-[var(--border-neu-card)] shrink-0 font-bold">
                Deterministic Policy First
              </span>
            </div>

            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              Unlike generic AI tools that hallucinate syllabus exceptions or reply carelessly to distressed students, FacultyOS separates deterministic mathematical rule evaluation from generative assistance. If an edge case requires human judgment, the assistant provides an explainable draft for the professor to approve, edit, or reject with a single click.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
              <div className="p-3.5 rounded-xl bg-[var(--bg-input)] space-y-1">
                <span className="font-bold text-[var(--text-primary)] block">Zero Auto-Send</span>
                <p className="text-[11px] text-[var(--text-secondary)]">No student receives an AI-generated message without explicit faculty authorization.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-[var(--bg-input)] space-y-1">
                <span className="font-bold text-[var(--text-primary)] block">PII Redaction</span>
                <p className="text-[11px] text-[var(--text-secondary)]">Student names, IDs, and emails are scrubbed before any contextual reasoning prompt.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-[var(--bg-input)] space-y-1">
                <span className="font-bold text-[var(--text-primary)] block">Audited Rationale</span>
                <p className="text-[11px] text-[var(--text-secondary)]">Every decision persists an immutable explanation citing the exact syllabus clause.</p>
              </div>
            </div>
          </div>
        </section>

        {/* S9: ERP Companion Callout */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="card-neu p-8 sm:p-10 space-y-4 text-center">
            <h3 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
              {LANDING_CONFIG.erpCompanion.headline}
            </h3>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
              {LANDING_CONFIG.erpCompanion.description}
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3 text-xs text-[var(--text-muted)] font-mono">
              <span className="px-3 py-1 rounded bg-[var(--bg-input)] border border-[var(--border-neu-card)]">Canvas Companion</span>
              <span className="px-3 py-1 rounded bg-[var(--bg-input)] border border-[var(--border-neu-card)]">Blackboard Ready</span>
              <span className="px-3 py-1 rounded bg-[var(--bg-input)] border border-[var(--border-neu-card)]">Clean CSV Exports</span>
            </div>
          </div>
        </section>

        {/* S10: Honest Comparison Table */}
        <section
          id="comparison"
          aria-labelledby="comparison-heading"
          className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8 scroll-mt-24"
        >
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 glass-badge px-3 py-1 text-xs font-semibold">
              <Scale className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              <span>Honest Architecture Comparison</span>
            </div>
            <h2
              id="comparison-heading"
              className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]"
            >
              FacultyOS vs. Traditional Inboxes & University ERPs
            </h2>
          </div>

          <div className="card-neu p-6 sm:p-8 overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[550px]">
              <thead>
                <tr className="border-b border-[var(--border-neu-card)] text-[var(--text-secondary)] font-bold">
                  <th className="pb-3 w-1/3">Capability</th>
                  <th className="pb-3 text-center text-[var(--accent-primary)]">FacultyOS</th>
                  <th className="pb-3 text-center">Standard Email / WhatsApp</th>
                  <th className="pb-3 text-center">University ERP (Canvas / Banner)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-neu-card)] text-[var(--text-secondary)]">
                <tr>
                  <td className="py-3 font-semibold text-[var(--text-primary)]">Deterministic Syllabus Rules</td>
                  <td className="py-3 text-center text-emerald-600 dark:text-emerald-400 font-bold">100% Automated</td>
                  <td className="py-3 text-center text-red-500">None (Manual reading)</td>
                  <td className="py-3 text-center text-red-500">None</td>
                </tr>
                <tr>
                  <td className="py-3 font-semibold text-[var(--text-primary)]">Weekend & Boundary Shield</td>
                  <td className="py-3 text-center text-emerald-600 dark:text-emerald-400 font-bold">Automatic Deferral</td>
                  <td className="py-3 text-center text-red-500">None (Constant pings)</td>
                  <td className="py-3 text-center text-red-500">None</td>
                </tr>
                <tr>
                  <td className="py-3 font-semibold text-[var(--text-primary)]">Medical Privacy Safeguards</td>
                  <td className="py-3 text-center text-emerald-600 dark:text-emerald-400 font-bold">Hard Block & Campus Link</td>
                  <td className="py-3 text-center text-amber-500">Unencrypted in Inbox</td>
                  <td className="py-3 text-center text-amber-500">Unrestricted Attachments</td>
                </tr>
                <tr>
                  <td className="py-3 font-semibold text-[var(--text-primary)]">Regrade Defense Verification</td>
                  <td className="py-3 text-center text-emerald-600 dark:text-emerald-400 font-bold">Mandates Rubric Item</td>
                  <td className="py-3 text-center text-red-500">Vague complaints</td>
                  <td className="py-3 text-center text-red-500">Unstructured comments</td>
                </tr>
                <tr>
                  <td className="py-3 font-semibold text-[var(--text-primary)]">Career & Tenure Ledger</td>
                  <td className="py-3 text-center text-emerald-600 dark:text-emerald-400 font-bold">One-Click Dossier Export</td>
                  <td className="py-3 text-center text-red-500">Lost in email archives</td>
                  <td className="py-3 text-center text-red-500">Fragmented logs</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* S11: Pricing Section */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6">
          <PricingSection />
        </section>

        {/* S12: FAQ Accordion Section */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6">
          <FaqAccordion />
        </section>

        {/* S13: Final CTA Band (Liquid Glass) */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="glass-panel p-8 sm:p-12 text-center space-y-6 shadow-2xl relative overflow-hidden">
            <div className="space-y-3 max-w-2xl mx-auto">
              <span className="glass-badge text-xs font-semibold">
                Protect Your Time
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-primary)]">
                Your Weekends Are Not Administrative Time.
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                Set up your course in under ten minutes and let deterministic policies protect your schedule, triage student inquiries fairly, and document your service record.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link
                href="/signup"
                className="w-full sm:w-auto btn-primary px-8 py-3.5 text-sm font-semibold inline-flex items-center justify-center gap-2 shadow-lg"
              >
                <span>Start Free — 1 Course Forever</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto btn-secondary px-8 py-3.5 text-sm font-semibold inline-flex items-center justify-center gap-2"
              >
                <span>Faculty Login</span>
              </Link>
            </div>

            <p className="text-[11px] text-[var(--text-muted)]">
              No credit card required • FERPA data minimization • 100% deterministic rules
            </p>
          </div>
        </section>
      </main>

      {/* S14: Complete 4-Column Footer */}
      <footer className="relative z-10 border-t border-[var(--border-neu-card)] bg-[var(--bg-surface)] py-14 px-4 sm:px-6 text-xs text-[var(--text-secondary)]">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand Info */}
          <div className="col-span-2 space-y-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-white font-bold text-base shadow-sm">
                F
              </div>
              <span className="font-bold text-base text-[var(--text-primary)]">FacultyOS</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] max-w-sm leading-relaxed">
              The privacy-first operations platform that turns syllabus policies into deterministic student request triage and protects faculty time.
            </p>
            <p className="text-[11px] text-[var(--text-muted)] font-mono">
              Deployed on Cloudflare Workers edge • Zero medical data
            </p>
          </div>

          {/* Nav Columns */}
          {LANDING_CONFIG.footerColumns.map((col) => (
            <div key={col.title} className="space-y-3">
              <span className="font-bold text-xs uppercase tracking-wider text-[var(--text-primary)] block">
                {col.title}
              </span>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="hover:text-[var(--text-primary)] transition-colors inline-flex items-center gap-1"
                    >
                      <span>{link.label}</span>
                      {link.isExternal && <ExternalLink className="w-3 h-3 text-[var(--text-muted)]" />}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="max-w-7xl mx-auto pt-6 border-t border-[var(--border-neu-card)] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[var(--text-muted)]">
          <p>© {new Date().getFullYear()} FacultyOS. Built for professors, not administrators.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-[var(--text-primary)]">Privacy</Link>
            <Link href="/terms" className="hover:text-[var(--text-primary)]">Terms</Link>
            <Link href="/security" className="hover:text-[var(--text-primary)]">Security</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
