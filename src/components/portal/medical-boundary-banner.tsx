"use client";

import React, { useState } from "react";
import { ShieldAlert, ExternalLink, HeartPulse, X } from "lucide-react";

export interface MedicalBoundaryBannerProps {
  compact?: boolean;
}

export function MedicalBoundaryBanner({ compact = false }: MedicalBoundaryBannerProps) {
  const [showSupportModal, setShowSupportModal] = useState(false);

  return (
    <>
      {compact ? (
        <div className="flex items-center justify-between gap-3 p-3 rounded-2xl glass-panel border border-[var(--status-warning)]/30 bg-amber-500/5 text-xs text-[var(--text-secondary)]">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <ShieldAlert className="w-3.5 h-3.5" />
            </span>
            <span className="font-medium text-[var(--text-primary)]">
              Hard Rule 1 Notice:
            </span>
            <span>
              FacultyOS does not collect medical or mental-health information.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowSupportModal(true)}
            className="text-xs font-semibold text-[var(--accent-primary)] hover:underline inline-flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <span>University Support</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-amber-500/25 bg-amber-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="glass-badge text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 border-amber-500/30">
                  Medical Boundary Protection (Hard Rule 1)
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                <strong className="text-[var(--text-primary)]">FacultyOS does not collect medical or mental-health information.</strong>{" "}
                For health-related accommodations, emergencies, or illness, please contact{" "}
                <button
                  type="button"
                  onClick={() => setShowSupportModal(true)}
                  className="font-medium text-[var(--accent-primary)] underline hover:text-[var(--accent-primary)]/80 cursor-pointer"
                >
                  University Support Services
                </button>{" "}
                directly.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowSupportModal(true)}
            className="btn-secondary px-4 py-2 text-xs font-semibold shrink-0 gap-1.5"
            id="university-support-link"
          >
            <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
            <span>Campus Support Directory</span>
          </button>
        </div>
      )}

      {/* University Support Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="card-neu max-w-lg w-full p-6 sm:p-8 space-y-5 relative">
            <button
              type="button"
              onClick={() => setShowSupportModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-input)] cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-500">
                <HeartPulse className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  University Healthcare &amp; Wellness Support
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Official campus contacts for health &amp; accessibility
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--bg-input)] text-xs text-[var(--text-secondary)] leading-relaxed">
              To protect student health privacy under FERPA and Hard Rule 1, professors and FacultyOS cannot receive doctor notes or diagnosis letters. Verified medical accommodations are handled exclusively by university student affairs.
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl border border-[var(--border-neu-card)] flex items-center justify-between">
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">
                    Student Health &amp; Wellness Center
                  </div>
                  <div className="text-[var(--text-muted)]">Walk-in clinic &amp; telehealth</div>
                </div>
                <span className="glass-badge text-[11px] font-mono">Ext. 4100 / (555) 019-4100</span>
              </div>

              <div className="p-3 rounded-xl border border-[var(--border-neu-card)] flex items-center justify-between">
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">
                    Counseling &amp; Psychological Services (CAPS)
                  </div>
                  <div className="text-[var(--text-muted)]">24/7 Crisis line &amp; confidential support</div>
                </div>
                <span className="glass-badge text-[11px] font-mono">1-800-273-TALK</span>
              </div>

              <div className="p-3 rounded-xl border border-[var(--border-neu-card)] flex items-center justify-between">
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">
                    Office of Disability &amp; Accessibility (ODA)
                  </div>
                  <div className="text-[var(--text-muted)]">Formal academic accommodation letters</div>
                </div>
                <span className="glass-badge text-[11px] font-mono">accessibility@university.edu</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowSupportModal(false)}
                className="btn-primary px-5 py-2 text-xs font-semibold cursor-pointer"
              >
                Close &amp; Return to Portal
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
