import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Shield, Lock, Database } from "lucide-react";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Security & FERPA Compliance — FacultyOS",
  description:
    "How FacultyOS safeguards student records, minimizes PII, enforces tenant boundaries, and complies with FERPA standards.",
  alternates: {
    canonical: "https://facultyos.com/security",
  },
};

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] px-4 sm:px-6 py-12">
      <div className="max-w-4xl mx-auto space-y-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>

        <div className="space-y-3">
          <span className="glass-badge text-xs font-semibold">
            Institutional Trust Architecture
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-primary)]">
            Security, Privacy, and FERPA Principles
          </h1>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            FacultyOS is built upon strict data minimization and cryptographic isolation. We treat academic communications as confidential educational records.
          </p>
        </div>

        <div className="space-y-6">
          <div className="card-neu p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                1. Hard Rule 1: Zero Medical Data Collection
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              FacultyOS strictly prohibits the intake, storage, or transmission of medical records, diagnoses, prescription details, or mental health assessments. Whenever an inquiry indicates illness, the student is immediately provided a direct link to official campus health centers and university student support services.
            </p>
          </div>

          <div className="card-neu p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-[var(--accent-primary)] flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                2. Tokenized Student Access & Data Minimization
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              Students never create persistent user accounts. Portal access is validated using SHA-256 hashed course tokens. Student identity records store SHA-256 hashed emails for rate limiting and duplicate detection, minimizing exposure under FERPA standards.
            </p>
          </div>

          <div className="card-neu p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                3. Tenant Isolation & Audit Immutability
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              All queries and server actions strictly enforce professor profile ownership checks. Every decision, policy modification, and message dispatches an immutable audit event (`request_events` table) storing explainable timestamps, previous versions, and matched rule snapshots.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
