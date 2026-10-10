"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  UserCheck,
  Save,
  Loader2,
  Lock,
  History,
} from "lucide-react";
import type { DetailedRequestResult } from "@/server/services/requests";
import {
  saveProfessorNotesAction,
  executeRequestAction,
} from "@/server/actions/requests";

interface RequestDetailViewProps {
  data: DetailedRequestResult;
}

interface IntakePayloadData {
  assignmentName?: string;
  reasonCategory?: string;
  currentDeadline?: string;
  requestedNewDeadline?: string;
  daysBeforeDeadline?: number;
  currentGrade?: string;
  rubricItemCitation?: string;
  studentWorkQuote?: string;
  professorFeedbackQuote?: string;
  agenda?: string;
  details?: string;
  justification?: string;
  [key: string]: unknown;
}

export function RequestDetailView({ data }: RequestDetailViewProps) {
  const { request, course, studentIdentity, matchedPolicy, events, attachments } = data;

  const [notes, setNotes] = useState(request.professorNotes || "");
  const [currentStatus, setCurrentStatus] = useState(request.status);
  const [isSavingNotes, startSavingNotes] = useTransition();
  const [isExecutingAction, startExecutingAction] = useTransition();
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Parse intake payload safely
  let payload: IntakePayloadData = {};
  try {
    payload = JSON.parse(request.intakePayloadJson) as IntakePayloadData;
  } catch {
    payload = {};
  }

  // Parse decision reasons safely
  let reasons: string[] = [];
  try {
    if (request.decisionReasonJson) {
      reasons = JSON.parse(request.decisionReasonJson) as string[];
    }
  } catch {
    reasons = [];
  }

  // Parse policy snapshot safely
  let policySnapshot: unknown = null;
  try {
    if (request.policySnapshotJson) {
      policySnapshot = JSON.parse(request.policySnapshotJson);
    }
  } catch {
    policySnapshot = null;
  }

  const handleSaveNotes = () => {
    startSavingNotes(async () => {
      await saveProfessorNotesAction(request.id, notes);
      setActionFeedback("Notes saved successfully.");
      setTimeout(() => setActionFeedback(null), 3000);
    });
  };

  const handleAction = (action: "approve" | "deny" | "require_info" | "assign_to_ta") => {
    startExecutingAction(async () => {
      const res = await executeRequestAction(request.id, action);
      setCurrentStatus(res.newStatus);
      setActionFeedback(`Status updated to ${res.newStatus.replace("_", " ")}.`);
      setTimeout(() => setActionFeedback(null), 3000);
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/inbox"
          className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] inline-flex items-center gap-1.5 font-medium transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>← Back to Triage Inbox</span>
        </Link>
        <span className="text-[11px] font-mono text-[var(--text-muted)]">
          Request ID: #{request.id}
        </span>
      </div>

      {/* Action Notification Banner */}
      {actionFeedback && (
        <div className="p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-700 dark:text-emerald-300 font-medium flex items-center justify-between animate-in fade-in">
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Main Request Header Banner */}
      <div className="card-neu p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border border-[var(--border-neu-card)]">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="glass-badge font-bold text-xs">
              {course.courseCode}
            </span>
            <span className="text-xs text-[var(--text-muted)]">
              {course.courseName}
            </span>
            <span className="text-xs text-[var(--text-muted)]">•</span>
            <span className="text-xs text-[var(--text-secondary)]">
              {course.term}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)] capitalize">
              {request.requestType.replace("_", " ")} Request
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] capitalize">
              {currentStatus.replace("_", " ")}
            </span>
          </div>

          <div className="text-xs text-[var(--text-secondary)] flex flex-wrap items-center gap-3">
            <span>
              Student:{" "}
              <strong className="text-[var(--text-primary)]">
                {studentIdentity?.displayLabel || "Student"}
              </strong>
            </span>
            <span>•</span>
            <span className="font-mono">
              Public Ref: #{request.publicToken.slice(0, 10)}
            </span>
            <span>•</span>
            <span>
              Submitted:{" "}
              {request.createdAt ? new Date(request.createdAt).toLocaleString() : ""}
            </span>
          </div>
        </div>

        {/* Priority & Penalty Callout */}
        <div className="flex flex-col sm:items-end gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-muted)]">Priority:</span>
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full capitalize ${
                request.priority === "urgent"
                  ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                  : "bg-[var(--bg-input)] text-[var(--text-secondary)]"
              }`}
            >
              {request.priority}
            </span>
          </div>

          {request.penaltyPercent !== null && request.penaltyPercent > 0 && (
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              -{request.penaltyPercent}% Late Deduction Applied
            </span>
          )}
        </div>
      </div>

      {/* Two-Column Grid: Left Pane (Payload & Notes) & Right Pane (Explainability & Rule Snapshot) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ================= LEFT / MAIN PANE (7 cols) ================= */}
        <div className="lg:col-span-7 space-y-6">
          {/* Intake Payload Card */}
          <div className="card-neu p-6 rounded-2xl space-y-5 border border-[var(--border-neu-card)]">
            <div className="flex items-center justify-between border-b border-[var(--border-neu-card)]/60 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[var(--accent-primary)]" />
                <h2 className="text-sm font-bold text-[var(--text-primary)]">
                  Student Submission Payload
                </h2>
              </div>
              <span className="glass-badge text-[10px] font-mono">
                Source: {request.source}
              </span>
            </div>

            {/* Core Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {payload.assignmentName && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">
                    Assignment / Exam
                  </span>
                  <div className="font-semibold text-sm text-[var(--text-primary)] mt-0.5">
                    {payload.assignmentName}
                  </div>
                </div>
              )}

              {payload.reasonCategory && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">
                    Reason Category (Non-Medical)
                  </span>
                  <div className="font-semibold text-xs text-[var(--text-primary)] mt-0.5 capitalize">
                    {String(payload.reasonCategory).replace(/_/g, " ")}
                  </div>
                </div>
              )}

              {payload.currentDeadline && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">
                    Original Deadline
                  </span>
                  <div className="font-mono text-xs text-[var(--text-primary)] mt-0.5">
                    {new Date(payload.currentDeadline).toLocaleString()}
                  </div>
                </div>
              )}

              {payload.requestedNewDeadline && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">
                    Requested New Deadline
                  </span>
                  <div className="font-mono text-xs text-[var(--accent-primary)] font-bold mt-0.5">
                    {new Date(payload.requestedNewDeadline).toLocaleString()}
                  </div>
                </div>
              )}

              {payload.daysBeforeDeadline !== undefined && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">
                    Advance Notice Window
                  </span>
                  <div className="font-semibold text-xs text-[var(--text-primary)] mt-0.5">
                    {payload.daysBeforeDeadline} days prior to deadline
                  </div>
                </div>
              )}

              {payload.currentGrade && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">
                    Current Grade Received
                  </span>
                  <div className="font-semibold text-xs text-[var(--text-primary)] mt-0.5">
                    {payload.currentGrade}
                  </div>
                </div>
              )}
            </div>

            {/* Regrade Specific Fields */}
            {payload.rubricItemCitation && (
              <div className="space-y-1 text-xs p-3.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-neu-card)]">
                <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">
                  Cited Rubric Criterion
                </span>
                <p className="text-xs text-[var(--text-primary)] font-medium">
                  {payload.rubricItemCitation}
                </p>
              </div>
            )}

            {payload.studentWorkQuote && (
              <div className="space-y-1 text-xs p-3.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-neu-card)]">
                <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">
                  Student Work Quote
                </span>
                <p className="font-mono text-xs text-[var(--text-primary)] italic">
                  &ldquo;{payload.studentWorkQuote}&rdquo;
                </p>
              </div>
            )}

            {payload.professorFeedbackQuote && (
              <div className="space-y-1 text-xs p-3.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-neu-card)]">
                <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">
                  Grader Feedback Quote
                </span>
                <p className="font-mono text-xs text-[var(--text-primary)] italic">
                  &ldquo;{payload.professorFeedbackQuote}&rdquo;
                </p>
              </div>
            )}

            {/* Meeting Fields */}
            {payload.agenda && (
              <div className="space-y-1 text-xs p-3.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-neu-card)]">
                <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">
                  Meeting Agenda
                </span>
                <p className="text-xs text-[var(--text-primary)] whitespace-pre-line">
                  {payload.agenda}
                </p>
              </div>
            )}

            {/* Circumstances / Explanation */}
            <div className="space-y-1 text-xs">
              <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">
                Student Explanation / Justification
              </span>
              <div className="p-4 rounded-xl bg-[var(--bg-input)] border border-[var(--border-neu-card)] text-xs text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
                {payload.details || payload.justification || "No additional text provided."}
              </div>
            </div>

            {/* Supporting Attachments Metadata */}
            {attachments.length > 0 && (
              <div className="space-y-2 text-xs pt-2 border-t border-[var(--border-neu-card)]/60">
                <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">
                  Supporting Documents ({attachments.length})
                </span>
                <div className="space-y-1.5">
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      className="p-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-neu-card)] flex items-center justify-between"
                    >
                      <span className="font-medium text-[var(--text-primary)]">
                        {att.fileName}
                      </span>
                      <span className="glass-badge text-[10px] font-mono">
                        {att.mimeType} • {Math.round(att.fileSize / 1024)} KB
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Private Professor Notes Panel */}
          <div className="card-neu p-6 rounded-2xl space-y-4 border border-[var(--border-neu-card)]">
            <div className="flex items-center justify-between border-b border-[var(--border-neu-card)]/60 pb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-bold text-[var(--text-primary)]">
                  Private Professor Notes
                </h2>
              </div>
              <span className="text-[11px] text-[var(--text-muted)]">
                Never shared with students
              </span>
            </div>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Record confidential notes, TA instructions, or grading rationale..."
              className="input-neu w-full p-3.5 text-xs resize-none"
              id="professor-private-notes"
            />

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSaveNotes}
                disabled={isSavingNotes}
                className="btn-primary px-4 py-2 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                id="save-notes-button"
              >
                {isSavingNotes ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Private Notes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ================= RIGHT / SECONDARY PANE (5 cols) ================= */}
        <div className="lg:col-span-5 space-y-6">
          {/* Action Bar Panel */}
          <div className="card-neu p-6 rounded-2xl space-y-4 border border-[var(--border-neu-card)] bg-[var(--bg-surface)]">
            <div className="border-b border-[var(--border-neu-card)]/60 pb-3">
              <h2 className="text-sm font-bold text-[var(--text-primary)]">
                Triage Decision Actions
              </h2>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                Apply a resolution to update the request lifecycle
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleAction("approve")}
                disabled={isExecutingAction}
                className="btn-primary py-2.5 text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                id="action-approve-button"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Approve</span>
              </button>

              <button
                type="button"
                onClick={() => handleAction("deny")}
                disabled={isExecutingAction}
                className="btn-secondary py-2.5 text-xs font-semibold inline-flex items-center justify-center gap-1.5 text-rose-600 dark:text-rose-400 cursor-pointer disabled:opacity-50"
                id="action-deny-button"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Deny</span>
              </button>

              <button
                type="button"
                onClick={() => handleAction("require_info")}
                disabled={isExecutingAction}
                className="btn-secondary py-2.5 text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                id="action-require-info-button"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Request Info</span>
              </button>

              <button
                type="button"
                onClick={() => handleAction("assign_to_ta")}
                disabled={isExecutingAction}
                className="btn-secondary py-2.5 text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                id="action-assign-ta-button"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Assign to TA</span>
              </button>
            </div>
          </div>

          {/* Explainability & Policy Match Card (Hard Rule 8) */}
          <div className="card-neu p-6 rounded-2xl space-y-4 border border-[var(--border-neu-card)]">
            <div className="flex items-center justify-between border-b border-[var(--border-neu-card)]/60 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[var(--accent-primary)]" />
                <h2 className="text-sm font-bold text-[var(--text-primary)]">
                  Policy Explainability (HR8)
                </h2>
              </div>
              <span className="glass-badge text-[10px] font-bold">
                Deterministic
              </span>
            </div>

            {/* Matched Policy Header */}
            <div className="p-3.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-neu-card)] space-y-1">
              <div className="text-[10px] uppercase font-bold text-[var(--text-muted)]">
                Active Matched Policy
              </div>
              <div className="font-bold text-xs text-[var(--text-primary)] flex items-center justify-between">
                <span>{matchedPolicy?.name || "Default Syllabus Review Policy"}</span>
                <span className="font-mono text-[11px] text-[var(--accent-primary)]">
                  v{request.matchedPolicyVersion || matchedPolicy?.version || 1}
                </span>
              </div>
            </div>

            {/* Decision Reasons */}
            <div className="space-y-1.5 text-xs">
              <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">
                Evaluation Plain-Language Reasons
              </span>
              {reasons.length > 0 ? (
                <ul className="space-y-1 list-disc pl-4 text-[var(--text-secondary)]">
                  {reasons.map((r, i) => (
                    <li key={i} className="leading-relaxed">
                      {r}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[var(--text-muted)] italic">
                  Routed to instructor queue via default policy fallback.
                </p>
              )}
            </div>

            {/* Immutable Decision-Time Policy Snapshot (Hard Rule 8) */}
            <div className="space-y-2 pt-2 border-t border-[var(--border-neu-card)]/60 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">
                  Historical Policy Snapshot
                </span>
                <span className="glass-badge text-[10px]">
                  Immutable Snapshot
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-neu-card)] font-mono text-[11px] text-[var(--text-secondary)] overflow-x-auto max-h-48">
                <pre className="whitespace-pre-wrap">
                  {policySnapshot
                    ? JSON.stringify(policySnapshot, null, 2)
                    : "No action snapshot recorded at submission time."}
                </pre>
              </div>
            </div>

            {/* Zero AI Guarantee notice */}
            <div className="p-3 rounded-xl border border-[var(--border-neu-card)] text-[11px] text-[var(--text-muted)] leading-relaxed">
              <strong className="text-[var(--text-primary)]">Audit Assurance:</strong>{" "}
              This request was evaluated deterministically against the instructor&apos;s active syllabus policy version. Artificial intelligence was not involved in executing this decision.
            </div>
          </div>
        </div>
      </div>

      {/* ================= BOTTOM PANE: Timeline Events ================= */}
      <div className="card-neu p-6 sm:p-8 rounded-2xl space-y-4 border border-[var(--border-neu-card)]">
        <div className="flex items-center justify-between border-b border-[var(--border-neu-card)]/60 pb-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[var(--accent-primary)]" />
            <h2 className="text-sm font-bold text-[var(--text-primary)]">
              Audit Lifecycle Timeline (`request_events`)
            </h2>
          </div>
          <span className="glass-badge text-[10px] font-mono">
            {events.length} Event{events.length !== 1 ? "s" : ""}
          </span>
        </div>

        {events.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)] italic">
            No events logged yet.
          </p>
        ) : (
          <div className="space-y-3">
            {events.map((evt, idx) => (
              <div
                key={evt.id}
                className="flex items-start gap-3 p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-neu-card)] text-xs"
              >
                <div className="w-6 h-6 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  {idx + 1}
                </div>

                <div className="space-y-0.5 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[var(--text-primary)] capitalize">
                      {evt.eventType.replace(/_/g, " ")}
                    </span>
                    <span className="text-[10px] font-mono text-[var(--text-muted)]">
                      {evt.createdAt ? new Date(evt.createdAt).toLocaleString() : ""}
                    </span>
                  </div>

                  <div className="text-[11px] text-[var(--text-secondary)] flex items-center gap-2">
                    <span className="glass-badge text-[10px]">
                      Actor: {evt.actorType}
                    </span>
                    {evt.payloadJson && (
                      <span className="font-mono text-[10px] text-[var(--text-muted)] truncate max-w-md">
                        {evt.payloadJson}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
