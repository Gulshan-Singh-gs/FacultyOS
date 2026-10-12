"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[FacultyOS GlobalError]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)] text-[var(--text-primary)] px-4 py-16">
      <div className="card-neu max-w-md w-full p-8 text-center space-y-6 border border-[var(--border-neu-card)]">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 mx-auto flex items-center justify-center text-red-500 shadow-sm">
          <AlertCircle className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <span className="glass-badge text-[11px] font-bold text-red-500 border-red-500/20">
            System Alert • Handled Gracefully
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Something Interrupted This Request
          </h1>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            FacultyOS encountered an unexpected condition. Your student records and audit trails remain safely intact.
          </p>
          {error?.message && (
            <div className="mt-2 p-2 rounded bg-red-500/10 text-red-400 font-mono text-[11px] text-left break-all max-h-24 overflow-y-auto">
              {error.message}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto btn-primary px-5 py-2.5 text-xs font-semibold inline-flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto btn-secondary px-5 py-2.5 text-xs font-semibold"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
