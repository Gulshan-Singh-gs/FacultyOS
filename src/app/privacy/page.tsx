import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Privacy Policy — FacultyOS",
  description: "Privacy commitments, data retention limits, and data minimization practices of FacultyOS.",
  alternates: {
    canonical: "https://facultyos.com/privacy",
  },
};

export default function PrivacyPage() {
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
            Privacy Policy
          </h1>
          <p className="text-xs text-[var(--text-muted)] font-mono">
            Last Updated: October 2026 • Effective Date: Fall Term 2026
          </p>
        </div>

        <div className="card-neu p-6 sm:p-8 space-y-6 text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-[var(--text-primary)]">1. Commitment to Data Minimization</h2>
            <p>
              FacultyOS is designed from the ground up to collect the absolute minimum data required to facilitate student request triage. We do not sell user data, track users across third-party properties, or use academic communications to train commercial foundation models.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[var(--text-primary)]">2. Health & Medical Data Prohibition</h2>
            <p>
              Under no circumstances does FacultyOS ingest, store, or process medical records, doctor&apos;s notes, disability forms, or psychiatric reports. All health-related student concerns are immediately redirected to university healthcare resources.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[var(--text-primary)]">3. Data Retention & Erasure</h2>
            <p>
              Course requests and communications are retained only for the active academic term plus one grade appeal window (typically 90 days following term completion), after which raw text is purged and aggregated into anonymous metrics.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[var(--text-primary)]">4. Inquiries & Data Protection Contact</h2>
            <p>
              For privacy audits or institutional inquiries: <code>privacy@facultyos.com</code>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
