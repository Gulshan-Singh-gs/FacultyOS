import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Changelog — FacultyOS",
  description: "Release notes and architecture updates for the FacultyOS operations platform.",
  alternates: {
    canonical: "https://facultyos.com/changelog",
  },
};

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] px-4 sm:px-6 py-12">
      <div className="max-w-3xl mx-auto space-y-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>

        <div className="space-y-2">
          <span className="glass-badge text-xs font-semibold">
            Product Updates
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
            FacultyOS Changelog
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">
            Continuous improvements deployed directly to the Cloudflare Workers edge.
          </p>
        </div>

        {/* Release v0.1.0 */}
        <div className="card-neu p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-neu-card)] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-[var(--text-primary)]">
                  v0.1.0 — Initial Foundation & Request Engine
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  LATEST
                </span>
              </div>
              <span className="text-xs text-[var(--text-muted)]">
                Released: October 10, 2026
              </span>
            </div>
          </div>

          <div className="space-y-4 text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
            <h3 className="font-bold text-[var(--text-primary)]">Key Additions:</h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Deterministic Policy Engine:</strong> Zero-hallucination pure rule evaluator supporting 48h advance extensions, late penalties, and regrade defenses.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Visual Rule Builder (UI Screen 6):</strong> When/Then row editor with live liquid glass preview panel and auto-version bumping.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Hard Rule 1 Safeguards:</strong> Hard-blocked health/medical categories with automatic university healthcare redirect notices.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Multi-Tenant Isolation:</strong> SHA-256 hashed course access tokens and course ownership verification across all database mutations.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
