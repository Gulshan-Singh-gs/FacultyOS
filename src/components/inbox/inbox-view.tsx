"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Clock,
  AlertCircle,
  CheckCircle2,
  Users2,
  Archive,
  Search,
  CalendarClock,
  FileCheck2,
  CalendarX2,
  FileQuestion,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  Check,
  Loader2,
} from "lucide-react";
import type { InboxRequestItem, InboxQueueCounts, InboxQueueKey } from "@/server/services/requests";
import { bulkCloseAutoResolvedAction } from "@/server/actions/requests";

interface InboxViewProps {
  initialQueue: InboxQueueKey;
  items: InboxRequestItem[];
  counts: InboxQueueCounts;
}

const QUEUES: Array<{
  id: InboxQueueKey;
  label: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  color: string;
}> = [
  { id: "needs_decision", label: "Needs Decision", icon: Clock, color: "text-amber-500" },
  { id: "needs_student_info", label: "Needs Student Info", icon: AlertCircle, color: "text-orange-500" },
  { id: "urgent", label: "Urgent", icon: AlertCircle, color: "text-rose-500" },
  { id: "auto_resolved", label: "Auto-Resolved", icon: CheckCircle2, color: "text-emerald-500" },
  { id: "ta_review", label: "TA Review", icon: Users2, color: "text-indigo-500" },
  { id: "closed", label: "Closed", icon: Archive, color: "text-slate-400" },
];

function getRequestIcon(type: string) {
  switch (type) {
    case "extension":
      return CalendarClock;
    case "regrade":
      return FileCheck2;
    case "absence":
      return CalendarX2;
    case "meeting":
      return Users2;
    case "missing_grade":
      return FileQuestion;
    default:
      return HelpCircle;
  }
}

function formatRelativeTime(date: Date | null) {
  if (!date) return "";
  const now = Date.now();
  const diffMs = now - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "yesterday";
  return `${diffDays}d ago`;
}

export function InboxView({ initialQueue, items, counts }: InboxViewProps) {
  const [activeQueue, setActiveQueue] = useState<InboxQueueKey>(initialQueue);
  const [searchQuery, setSearchQuery] = useState("");
  const [closedIds, setClosedIds] = useState<string[]>([]);
  const [isBulkClosing, setIsBulkClosing] = useState(false);
  const [bulkFeedback, setBulkFeedback] = useState<string | null>(null);

  const displayedItems = items.filter((item) => !closedIds.includes(item.id));

  const filteredItems = displayedItems.filter((item) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.courseCode.toLowerCase().includes(query) ||
      item.studentDisplayLabel.toLowerCase().includes(query) ||
      item.requestType.toLowerCase().includes(query) ||
      (item.matchedPolicyName && item.matchedPolicyName.toLowerCase().includes(query))
    );
  });

  const handleBulkClose = async () => {
    const idsToClose = filteredItems.map((item) => item.id);
    if (idsToClose.length === 0) return;

    setIsBulkClosing(true);
    try {
      const res = await bulkCloseAutoResolvedAction(idsToClose);
      if (res.success) {
        setClosedIds((prev) => [...prev, ...idsToClose]);
        setBulkFeedback(`Successfully marked ${res.closedCount} auto-resolved requests as closed.`);
        setTimeout(() => setBulkFeedback(null), 4000);
      }
    } catch {
      setBulkFeedback("Failed to bulk close requests.");
      setTimeout(() => setBulkFeedback(null), 4000);
    } finally {
      setIsBulkClosing(false);
    }
  };


  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="glass-badge font-bold text-xs uppercase tracking-wider">
              Professor Command Center
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)] mt-1">
            Triage Inbox
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
            Review and decide student submissions evaluated under deterministic syllabus policies.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student, course, type..."
            className="input-neu w-full pl-10 pr-4 py-2 text-xs"
            id="inbox-search-input"
          />
        </div>
      </div>

      {/* Queue Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-neu-card)] overflow-x-auto">
        {QUEUES.map((q) => {
          const Icon = q.icon;
          const isActive = activeQueue === q.id;
          const count = counts[q.id];
          return (
            <Link
              key={q.id}
              href={`/inbox?queue=${q.id}`}
              onClick={() => setActiveQueue(q.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                isActive
                  ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm border border-[var(--border-neu-card)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
              id={`queue-tab-${q.id}`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? q.color : "text-[var(--text-muted)]"}`} />
              <span>{q.label}</span>
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive
                    ? "bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]"
                    : "bg-black/5 dark:bg-white/5 text-[var(--text-muted)]"
                }`}
              >
                {count}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Bulk Action Feedback Banner */}
      {bulkFeedback && (
        <div className="p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-700 dark:text-emerald-300 font-medium flex items-center justify-between animate-in fade-in">
          <span>{bulkFeedback}</span>
        </div>
      )}

      {/* Auto-Resolved Bulk Action Bar */}
      {activeQueue === "auto_resolved" && filteredItems.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-neu-card)]">
          <div className="space-y-0.5">
            <h3 className="text-xs font-bold text-[var(--text-primary)]">
              Auto-Resolved Requests Ready for Archival
            </h3>
            <p className="text-[11px] text-[var(--text-secondary)]">
              {filteredItems.length} request{filteredItems.length !== 1 ? "s" : ""} were automatically processed according to active course policies.
            </p>
          </div>
          <button
            type="button"
            onClick={handleBulkClose}
            disabled={isBulkClosing}
            className="btn-secondary px-4 py-2 text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
            id="bulk-close-auto-resolved-button"
          >
            {isBulkClosing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Archiving...</span>
              </>
            ) : (
              <>
                <Archive className="w-3.5 h-3.5" />
                <span>Mark All as Closed</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Items List or Calm Empty State */}
      {filteredItems.length === 0 ? (
        <div className="card-neu p-12 text-center space-y-4 max-w-lg mx-auto border border-[var(--border-neu-card)]">
          <div className="w-14 h-14 rounded-2xl bg-[var(--bg-input)] mx-auto flex items-center justify-center text-emerald-500 shadow-sm">
            <Check className="w-7 h-7 stroke-[2.5]" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-[var(--text-primary)]">
              Queue Clear • Inbox Zero
            </h2>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              No requests currently in the{" "}
              <strong className="text-[var(--text-primary)] capitalize">
                {activeQueue.replace("_", " ")}
              </strong>{" "}
              queue. Deterministic policies have auto-resolved eligible student workflows.
            </p>
          </div>
          <div className="pt-2">
            <Link href="/courses" className="btn-secondary px-4 py-2 text-xs font-semibold">
              Manage Course Policies →
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {filteredItems.map((item) => {
            const Icon = getRequestIcon(item.requestType);
            const isUrgent = item.priority === "urgent";

            return (
              <Link
                key={item.id}
                href={`/inbox/${item.id}`}
                className="card-neu p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-150 hover:-translate-y-0.5 hover:border-[var(--accent-primary)]/40 border border-[var(--border-neu-card)] group"
                id={`request-card-${item.id}`}
              >
                <div className="flex items-start sm:items-center gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                      isUrgent
                        ? "bg-rose-500/10 text-rose-500"
                        : "bg-[var(--bg-input)] text-[var(--accent-primary)] group-hover:bg-[var(--accent-primary)]/10"
                    }`}
                  >
                    <Icon size={20} />
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Course Code Badge */}
                      <span className="glass-badge font-bold text-[11px]">
                        {item.courseCode}
                      </span>

                      {/* Request Type */}
                      <span className="font-bold text-xs sm:text-sm text-[var(--text-primary)] capitalize">
                        {item.requestType.replace("_", " ")}
                      </span>

                      {/* Priority Badge */}
                      {isUrgent ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 uppercase tracking-wide">
                          Urgent
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--bg-input)] text-[var(--text-muted)]">
                          {item.priority}
                        </span>
                      )}

                      {/* Status Badge */}
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-500/10 text-[var(--text-secondary)] capitalize">
                        {item.status.replace("_", " ")}
                      </span>
                    </div>

                    <div className="text-xs text-[var(--text-secondary)] flex flex-wrap items-center gap-2 sm:gap-3">
                      {/* Pseudonymous Student Label (Hard Rule 5 Privacy) */}
                      <span className="font-medium text-[var(--text-primary)]">
                        {item.studentDisplayLabel}
                      </span>

                      <span>•</span>

                      {/* Matched Policy */}
                      <span className="flex items-center gap-1 text-[var(--text-muted)]">
                        <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                        <span>
                          {item.matchedPolicyName
                            ? `${item.matchedPolicyName} (v${item.matchedPolicyVersion || 1})`
                            : "Default Syllabus Review"}
                        </span>
                      </span>

                      {item.penaltyPercent !== null && item.penaltyPercent > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-amber-600 dark:text-amber-400 font-semibold">
                            -{item.penaltyPercent}% Late Deduction
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right side: Timestamp & Arrow */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-[var(--border-neu-card)]/40">
                  <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3" />
                    <span>{formatRelativeTime(item.createdAt)}</span>
                  </span>

                  <span className="btn-secondary px-3 py-1.5 text-xs font-semibold inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <span>View Detail</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
