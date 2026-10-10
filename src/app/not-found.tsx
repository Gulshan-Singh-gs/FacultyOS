import React from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)] text-[var(--text-primary)] px-4 py-16">
      <div className="card-neu max-w-md w-full p-8 text-center space-y-6 border border-[var(--border-neu-card)]">
        <div className="w-14 h-14 rounded-2xl bg-[var(--bg-input)] mx-auto flex items-center justify-center text-[var(--accent-primary)] shadow-sm">
          <BookOpen className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <span className="glass-badge text-[11px] font-bold">
            HTTP 404 • Page Not Found
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            This Course or Resource Doesn&apos;t Exist
          </h1>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            The link you followed may be expired, rotated, or moved to another syllabus section.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="w-full sm:w-auto btn-primary px-5 py-2.5 text-xs font-semibold inline-flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Home</span>
          </Link>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto btn-secondary px-5 py-2.5 text-xs font-semibold"
          >
            Faculty Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
