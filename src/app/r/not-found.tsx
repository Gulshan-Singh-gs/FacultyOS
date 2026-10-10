import React from "react";
import Link from "next/link";
import { FileQuestion, ArrowLeft, ShieldAlert } from "lucide-react";

export default function RequestStatusNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)] text-[var(--text-primary)] px-4 py-16">
      <div className="card-neu max-w-md w-full p-8 text-center space-y-6 border border-[var(--border-neu-card)]">
        <div className="w-14 h-14 rounded-2xl bg-[var(--bg-input)] mx-auto flex items-center justify-center text-[var(--accent-primary)] shadow-sm">
          <FileQuestion className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <span className="glass-badge text-[11px] font-bold">
            HTTP 404 • Status Link Not Found
          </span>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Request Not Found or Link Expired
          </h1>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            The status tracking link you followed may be mistyped or expired. Please check your confirmation receipt or email for the exact request URL.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-[var(--bg-input)] text-xs text-[var(--text-secondary)] flex items-center justify-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
          <span>Status tokens are cryptographically generated and read-only.</span>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="w-full sm:w-auto btn-primary px-5 py-2.5 text-xs font-semibold inline-flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Home</span>
          </Link>
          <a
            href="mailto:support@facultyos.internal"
            className="w-full sm:w-auto btn-secondary px-5 py-2.5 text-xs font-semibold"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}
