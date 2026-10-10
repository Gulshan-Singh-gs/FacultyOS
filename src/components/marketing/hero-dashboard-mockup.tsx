import React from "react";
import {
  Inbox,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  Shield,
} from "lucide-react";

export function HeroDashboardMockup() {
  return (
    <div
      role="img"
      aria-label="Interactive preview of FacultyOS professor inbox, policy execution, and AI suggestion drawer"
      className="w-full max-w-4xl mx-auto rounded-3xl p-2 sm:p-3 glass-panel shadow-2xl relative overflow-hidden text-left"
    >
      {/* Browser Window Chrome */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border-neu-card)] text-xs text-[var(--text-muted)]">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400/80 inline-block" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80 inline-block" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80 inline-block" />
          <span className="ml-2 font-mono text-[10px] hidden sm:inline text-[var(--text-muted)]">
            facultyos.com/inbox (CS301 Fall)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] bg-[var(--bg-input)] font-mono text-[var(--accent-primary)]">
            v1.2.0 • Deterministic
          </span>
        </div>
      </div>

      {/* Main Mockup Body */}
      <div className="p-3 sm:p-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
        {/* Left: Triage Queue (7 cols) */}
        <div className="md:col-span-7 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2">
              <Inbox className="w-4 h-4 text-[var(--accent-primary)]" />
              <span className="text-xs font-bold text-[var(--text-primary)]">
                Student Request Queue
              </span>
            </div>
            <span className="glass-badge text-[10px] font-bold">
              3 Pending • 14 Auto-Resolved
            </span>
          </div>

          {/* Request Card 1 (Auto-Resolved via 48h policy) */}
          <div className="card-neu p-3.5 space-y-2 border-l-4 border-l-emerald-500">
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[var(--text-primary)]">
                  CS301 • HW3 Extension
                </span>
                <span className="text-[10px] text-[var(--text-muted)]">
                  Student #482
                </span>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3" />
                AUTO-APPROVED
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] italic">
              &ldquo;Attending collegiate debate tournament. Requesting 48h extension.&rdquo;
            </p>
            <div className="pt-1 flex items-center justify-between text-[10px] text-[var(--text-muted)] border-t border-[var(--border-neu-card)]">
              <span>Matched: Policy v1 (48h Notice)</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                Decision snapshot logged
              </span>
            </div>
          </div>

          {/* Request Card 2 (Regrade Defense with Rubric) */}
          <div className="card-neu p-3.5 space-y-2 border-l-4 border-l-[var(--accent-primary)]">
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[var(--text-primary)]">
                  CS301 • Midterm Q4 Regrade
                </span>
                <span className="text-[10px] text-[var(--text-muted)]">
                  Student #109
                </span>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 px-2 py-0.5 rounded-full">
                <Clock className="w-3 h-3" />
                NEEDS REVIEW
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] italic">
              &ldquo;Citing Rubric Item 4.2 (B-Tree concurrency). Submitted solution matches standard.&rdquo;
            </p>
            <div className="pt-1 flex items-center justify-between text-[10px] text-[var(--text-muted)] border-t border-[var(--border-neu-card)]">
              <span>Rubric Verified: Page 4 cited</span>
              <span className="text-[var(--text-primary)] font-medium flex items-center gap-1">
                Open Defense <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>

        {/* Right: Floating Glass AI Suggestion Drawer (5 cols) */}
        <div className="md:col-span-5 space-y-3">
          <div className="glass-panel p-4 space-y-3 border border-[var(--accent-primary)]/30 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                <span className="text-xs font-bold text-[var(--text-primary)]">
                  AI Assistant Draft
                </span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] font-semibold">
                Suggests Only
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[var(--bg-input)] text-[11px] text-[var(--text-secondary)] leading-relaxed space-y-1.5">
              <p className="font-medium text-[var(--text-primary)]">
                Suggested Decision for Student #109:
              </p>
              <p>
                &ldquo;Student provided precise rubric text from Page 4. Recommended: Accept partial credit (+3 pts) or forward to TA Sharma for verification.&rdquo;
              </p>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-[var(--text-muted)]">
                AI never auto-sends.
              </span>
              <div className="flex gap-1.5">
                <span className="btn-secondary px-2 py-1 text-[10px] font-semibold cursor-default">
                  Modify
                </span>
                <span className="btn-primary px-2 py-1 text-[10px] font-semibold cursor-default">
                  Accept Draft
                </span>
              </div>
            </div>
          </div>

          {/* Mini Boundary Status Pill */}
          <div className="card-neu p-3 text-[11px] text-[var(--text-secondary)] flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              <span>Boundary Shield: Active</span>
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
              09:00–18:00
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
