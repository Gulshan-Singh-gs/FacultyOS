"use client";

import React, { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[FacultyOS Dashboard Error]", error);
  }, [error]);

  return (
    <div className="card-neu max-w-lg mx-auto p-8 my-8 text-center space-y-6">
      <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center">
        <AlertCircle className="w-6 h-6" />
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-bold text-[var(--text-primary)]">
          Dashboard View Temporarily Unavailable
        </h2>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          FacultyOS encountered an issue rendering this section. Your course configurations and policy rules remain safe in Cloudflare D1.
        </p>
      </div>

      {error?.digest && (
        <div className="text-[10px] font-mono text-[var(--text-secondary)] bg-[var(--bg-input)] py-1 px-3 rounded-lg border border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.06)] inline-block">
          Error Reference: {error.digest}
        </div>
      )}

      <div className="flex items-center justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={() => reset()}
          className="btn-primary px-4 py-2 text-xs font-semibold inline-flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry View</span>
        </button>
        <button
          type="button"
          onClick={() => {
            if (typeof window !== "undefined") {
              window.location.reload();
            }
          }}
          className="btn-secondary px-4 py-2 text-xs font-medium"
        >
          Hard Reload
        </button>
      </div>
    </div>
  );
}
