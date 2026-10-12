import React from "react";

export default function Loading() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-pulse">
      {/* Welcome banner skeleton */}
      <div className="card-neu p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-56 bg-[var(--bg-input)] rounded-lg" />
          <div className="h-4 w-72 bg-[var(--bg-input)] rounded-md opacity-60" />
        </div>
        <div className="h-10 w-32 bg-[var(--bg-input)] rounded-xl" />
      </div>

      {/* KPI Cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card-neu p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 bg-[var(--bg-input)] rounded" />
              <div className="w-2.5 h-2.5 rounded-full bg-[var(--bg-input)]" />
            </div>
            <div className="h-8 w-16 bg-[var(--bg-input)] rounded-lg" />
            <div className="h-3 w-28 bg-[var(--bg-input)] rounded opacity-60" />
          </div>
        ))}
      </div>

      {/* Main card skeleton */}
      <div className="card-neu p-10 text-center space-y-4">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-[var(--bg-input)]" />
        <div className="h-5 w-48 bg-[var(--bg-input)] mx-auto rounded" />
        <div className="h-4 w-80 bg-[var(--bg-input)] mx-auto rounded opacity-60" />
      </div>
    </div>
  );
}
