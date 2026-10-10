import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Terms of Service — FacultyOS",
  description: "Terms and conditions governing the usage of the FacultyOS operations platform.",
  alternates: {
    canonical: "https://facultyos.com/terms",
  },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] px-4 sm:px-6 py-12">
      <div className="max-w-3xl mx-auto space-y-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>

        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
            Terms of Service
          </h1>
          <p className="text-xs text-[var(--text-muted)] font-mono">
            Version 1.0 • Effective Fall 2026
          </p>
        </div>

        <div className="card-neu p-6 sm:p-8 space-y-6 text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-[var(--text-primary)]">1. Educational Use & Faculty Authority</h2>
            <p>
              FacultyOS is an operations assistant designed to support academic workflows. The instructor of record retains ultimate authority and academic discretion over all grades, deadline exemptions, and student decisions.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[var(--text-primary)]">2. Deterministic Rule Configuration</h2>
            <p>
              Professors are responsible for ensuring configured policies align with their institutional faculty handbook and approved departmental course syllabi.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[var(--text-primary)]">3. Subscription & Refunds</h2>
            <p>
              Paid plans (Professor Pro and Department Tier) carry an unconditional 7-day money-back guarantee for first-time subscribers. Subscriptions can be canceled at any time from your account settings.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[var(--text-primary)]">4. Governing Terms</h2>
            <p>
              Questions regarding service terms can be directed to: <code>legal@facultyos.com</code>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
