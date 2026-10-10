import React from "react";
import Link from "next/link";
import { BookOpen, ArrowLeft, ShieldAlert } from "lucide-react";

export default function StudentPortalNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)] text-[var(--text-primary)] px-4 py-16">
      <div className="card-neu max-w-md w-full p-8 text-center space-y-6 border border-[var(--border-neu-card)]">
        <div className="w-14 h-14 rounded-2xl bg-[var(--bg-input)] mx-auto flex items-center justify-center text-amber-500 shadow-sm">
          <BookOpen className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <span className="glass-badge text-[11px] font-bold text-amber-600 dark:text-amber-400">
            HTTP 404 • Portal Link Unavailable
          </span>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Course not found or portal link expired
          </h1>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            The course access link you followed may be invalid, rotated by the instructor, or no longer accepting submissions. Please verify the URL provided on your course syllabus or LMS announcement.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-[var(--bg-input)] text-xs text-[var(--text-secondary)] flex items-center justify-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
          <span>Tenant tokens are hashed and strictly isolated (Hard Rule 5).</span>
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
