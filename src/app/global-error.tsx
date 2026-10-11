"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[FacultyOS Global Error]", error);
  }, [error]);

  return (
    <html lang="en" className="dark" data-theme="dark">
      <head>
        <title>FacultyOS — System Interruption</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="min-h-screen flex items-center justify-center bg-[#09090b] text-[#f4f4f5] font-sans p-6">
        <div className="max-w-md w-full bg-[#18181b] border border-[#27272a] rounded-2xl p-8 text-center shadow-2xl space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 mx-auto flex items-center justify-center">
            <AlertTriangle className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <span className="inline-block px-2.5 py-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full">
              System Resiliency Shield
            </span>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Application Refresh Required
            </h1>
            <p className="text-xs text-zinc-400 leading-relaxed">
              FacultyOS protected your state. Reload the application or try again to resume your workflow.
            </p>
          </div>

          {error?.digest && (
            <div className="text-[10px] font-mono text-zinc-500 bg-[#09090b] py-1.5 px-3 rounded-lg border border-[#27272a]">
              Digest: {error.digest}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => reset()}
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white rounded-xl inline-flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-lg shadow-violet-600/20"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reload Workspace</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.location.href = "/dashboard";
                }
              }}
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-xl cursor-pointer transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
