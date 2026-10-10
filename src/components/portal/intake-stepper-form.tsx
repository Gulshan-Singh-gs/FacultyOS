"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  CalendarClock,
  FileCheck2,
  CalendarX2,
  Users2,
  FileQuestion,
  HelpCircle,
  Copy,
  Check,
  ShieldAlert,
  Loader2,
  FileUp,
} from "lucide-react";
import {
  ExtensionRequestSchema,
  RegradeRequestSchema,
  AbsenceRequestSchema,
  MeetingRequestSchema,
  MissingGradeRequestSchema,
  OtherRequestSchema,
  type ReasonCategory,
} from "@/lib/validations/request";
import { MedicalBoundaryBanner } from "./medical-boundary-banner";

export type RequestType =
  | "extension"
  | "regrade"
  | "absence"
  | "meeting"
  | "missing_grade"
  | "other";

interface IntakeStepperFormProps {
  courseToken: string;
  courseCode: string;
  courseName: string;
  initialRequestType?: RequestType;
  onCancel?: () => void;
}

const STEPS = [
  { id: 1, label: "Type" },
  { id: 2, label: "Details" },
  { id: 3, label: "Policy Check" },
  { id: 4, label: "Attachments" },
  { id: 5, label: "Review" },
  { id: 6, label: "Submit" },
];

export function IntakeStepperForm({
  courseToken,
  courseCode,
  courseName,
  initialRequestType = "extension",
  onCancel,
}: IntakeStepperFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [requestType, setRequestType] = useState<RequestType>(initialRequestType);
  const [healthSelected, setHealthSelected] = useState(false);

  // Form Fields
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");

  // Extension fields
  const [assignmentName, setAssignmentName] = useState("");
  const [currentDeadline, setCurrentDeadline] = useState("");
  const [requestedNewDeadline, setRequestedNewDeadline] = useState("");
  const [reasonCategory, setReasonCategory] = useState<ReasonCategory>("academic_conflict");
  const [details, setDetails] = useState("");
  const [hasDocumentation, setHasDocumentation] = useState(false);

  // Regrade fields
  const [currentGrade, setCurrentGrade] = useState("");
  const [rubricItemCitation, setRubricItemCitation] = useState("");
  const [studentWorkQuote, setStudentWorkQuote] = useState("");
  const [professorFeedbackQuote, setProfessorFeedbackQuote] = useState("");
  const [justification, setJustification] = useState("");

  // Absence fields
  const [absenceDates, setAbsenceDates] = useState("");

  // Meeting fields
  const [meetingPurpose, setMeetingPurpose] = useState("");
  const [meetingAgenda, setMeetingAgenda] = useState("");
  const [desiredOutcome, setDesiredOutcome] = useState("");
  const [canBeAsync, setCanBeAsync] = useState(false);
  const [preferredDates, setPreferredDates] = useState("");

  // Missing grade fields
  const [dateSubmittedOrTaken, setDateSubmittedOrTaken] = useState("");

  // Other fields
  const [otherSubject, setOtherSubject] = useState("");

  // Attachments notes / mock file
  const [attachmentNote, setAttachmentNote] = useState("");
  const [attachmentFileName, setAttachmentFileName] = useState("");

  // Policy check
  const [policyAccepted, setPolicyAccepted] = useState(false);

  // Turnstile & Submit states
  const [turnstilePassed, setTurnstilePassed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitErrors, setSubmitErrors] = useState<string[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);

  // Result state
  const [submissionResult, setSubmissionResult] = useState<{
    requestToken: string;
    status: string;
    message: string;
  } | null>(null);

  // Validation function per step
  const validateStep = (step: number): boolean => {
    setSubmitErrors([]);

    if (healthSelected) {
      setSubmitErrors([
        "Medical or mental-health items cannot be submitted through FacultyOS. Please use University Support Services.",
      ]);
      return false;
    }

    if (step === 1) {
      return true;
    }

    if (step === 2) {
      const errors: string[] = [];
      if (!studentName.trim() || studentName.trim().length < 2) {
        errors.push("Full Name must be at least 2 characters.");
      }
      if (!studentEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(studentEmail)) {
        errors.push("A valid student email address is required.");
      }

      if (requestType === "extension") {
        const parsed = ExtensionRequestSchema.safeParse({
          studentName,
          studentEmail,
          assignmentName,
          currentDeadline: currentDeadline ? new Date(currentDeadline) : new Date(0),
          requestedNewDeadline: requestedNewDeadline ? new Date(requestedNewDeadline) : new Date(0),
          reasonCategory,
          details,
          hasDocumentation,
          turnstileToken: "dummy",
        });
        if (!parsed.success) {
          const formatted = parsed.error.format();
          if (formatted.assignmentName?._errors?.[0]) errors.push(formatted.assignmentName._errors[0]);
          if (formatted.currentDeadline?._errors?.[0]) errors.push("Current deadline is required.");
          if (formatted.requestedNewDeadline?._errors?.[0]) {
            errors.push(formatted.requestedNewDeadline._errors[0]);
          }
          if (formatted.details?._errors?.[0]) errors.push(formatted.details._errors[0]);
        }
      } else if (requestType === "regrade") {
        const parsed = RegradeRequestSchema.safeParse({
          studentName,
          studentEmail,
          assignmentName,
          currentGrade,
          rubricItemCitation,
          studentWorkQuote,
          professorFeedbackQuote,
          justification,
          turnstileToken: "dummy",
        });
        if (!parsed.success) {
          const formatted = parsed.error.format();
          if (formatted.assignmentName?._errors?.[0]) errors.push(formatted.assignmentName._errors[0]);
          if (formatted.currentGrade?._errors?.[0]) errors.push(formatted.currentGrade._errors[0]);
          if (formatted.rubricItemCitation?._errors?.[0]) {
            errors.push(formatted.rubricItemCitation._errors[0]);
          }
          if (formatted.studentWorkQuote?._errors?.[0]) {
            errors.push(formatted.studentWorkQuote._errors[0]);
          }
          if (formatted.professorFeedbackQuote?._errors?.[0]) {
            errors.push(formatted.professorFeedbackQuote._errors[0]);
          }
          if (formatted.justification?._errors?.[0]) {
            errors.push(formatted.justification._errors[0]);
          }
        }
      } else if (requestType === "absence") {
        const parsed = AbsenceRequestSchema.safeParse({
          studentName,
          studentEmail,
          dates: absenceDates,
          reasonCategory,
          details,
          hasDocumentation,
          turnstileToken: "dummy",
        });
        if (!parsed.success) {
          const formatted = parsed.error.format();
          if (formatted.dates?._errors?.[0]) errors.push(formatted.dates._errors[0]);
          if (formatted.details?._errors?.[0]) errors.push(formatted.details._errors[0]);
        }
      } else if (requestType === "meeting") {
        const parsed = MeetingRequestSchema.safeParse({
          studentName,
          studentEmail,
          purpose: meetingPurpose,
          agenda: meetingAgenda,
          desiredOutcome,
          canBeAsync,
          preferredDates,
          turnstileToken: "dummy",
        });
        if (!parsed.success) {
          const formatted = parsed.error.format();
          if (formatted.purpose?._errors?.[0]) errors.push(formatted.purpose._errors[0]);
          if (formatted.agenda?._errors?.[0]) errors.push(formatted.agenda._errors[0]);
          if (formatted.desiredOutcome?._errors?.[0]) errors.push(formatted.desiredOutcome._errors[0]);
          if (formatted.preferredDates?._errors?.[0]) errors.push(formatted.preferredDates._errors[0]);
        }
      } else if (requestType === "missing_grade") {
        const parsed = MissingGradeRequestSchema.safeParse({
          studentName,
          studentEmail,
          assignmentName,
          dateSubmittedOrTaken,
          details,
          turnstileToken: "dummy",
        });
        if (!parsed.success) {
          const formatted = parsed.error.format();
          if (formatted.assignmentName?._errors?.[0]) errors.push(formatted.assignmentName._errors[0]);
          if (formatted.dateSubmittedOrTaken?._errors?.[0]) {
            errors.push(formatted.dateSubmittedOrTaken._errors[0]);
          }
          if (formatted.details?._errors?.[0]) errors.push(formatted.details._errors[0]);
        }
      } else if (requestType === "other") {
        const parsed = OtherRequestSchema.safeParse({
          studentName,
          studentEmail,
          subject: otherSubject,
          reasonCategory,
          details,
          turnstileToken: "dummy",
        });
        if (!parsed.success) {
          const formatted = parsed.error.format();
          if (formatted.subject?._errors?.[0]) errors.push(formatted.subject._errors[0]);
          if (formatted.details?._errors?.[0]) errors.push(formatted.details._errors[0]);
        }
      }

      if (errors.length > 0) {
        setSubmitErrors(errors);
        return false;
      }
      return true;
    }

    if (step === 3) {
      if (!policyAccepted) {
        setSubmitErrors(["You must confirm that you have read the course policy before proceeding."]);
        return false;
      }
      return true;
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 6));
    }
  };

  const handlePrev = () => {
    setSubmitErrors([]);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!turnstilePassed) {
      setSubmitErrors(["Please complete the bot verification check."]);
      return;
    }

    setIsSubmitting(true);
    setSubmitErrors([]);

    let payload: Record<string, unknown> = {
      requestType,
      studentName,
      studentEmail,
      turnstileToken: "cf_token_verified",
    };

    if (requestType === "extension") {
      payload = {
        ...payload,
        assignmentName,
        currentDeadline: new Date(currentDeadline).toISOString(),
        requestedNewDeadline: new Date(requestedNewDeadline).toISOString(),
        reasonCategory,
        details,
        hasDocumentation,
      };
    } else if (requestType === "regrade") {
      payload = {
        ...payload,
        assignmentName,
        currentGrade,
        rubricItemCitation,
        studentWorkQuote,
        professorFeedbackQuote,
        justification,
      };
    } else if (requestType === "absence") {
      payload = {
        ...payload,
        dates: absenceDates,
        reasonCategory,
        details,
        hasDocumentation,
      };
    } else if (requestType === "meeting") {
      payload = {
        ...payload,
        purpose: meetingPurpose,
        agenda: meetingAgenda,
        desiredOutcome,
        canBeAsync,
        preferredDates,
      };
    } else if (requestType === "missing_grade") {
      payload = {
        ...payload,
        assignmentName,
        dateSubmittedOrTaken,
        details,
      };
    } else if (requestType === "other") {
      payload = {
        ...payload,
        subject: otherSubject,
        reasonCategory,
        details,
      };
    }

    try {
      const res = await fetch(`/api/public/c/${courseToken}/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as {
        requestToken?: string;
        status?: string;
        message?: string;
        error?: unknown;
      };

      if (!res.ok) {
        setSubmitErrors([
          typeof data.error === "string"
            ? data.error
            : "Submission error occurred. Please check all fields.",
        ]);
        setIsSubmitting(false);
        return;
      }

      setSubmissionResult({
        requestToken: data.requestToken ?? "req_submitted",
        status: data.status ?? "submitted",
        message: data.message ?? "Your request has been submitted successfully.",
      });
    } catch {
      setSubmitErrors(["Network error submitting request. Please try again."]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyStatusLink = () => {
    if (!submissionResult) return;
    const url = `${window.location.origin}/r/${submissionResult.requestToken}`;
    void navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (submissionResult) {
    const isAutoApproved = submissionResult.status === "auto_approved";
    const statusUrl = `/r/${submissionResult.requestToken}`;

    return (
      <div className="card-neu p-6 sm:p-10 max-w-2xl mx-auto space-y-6 text-center border border-[var(--border-neu-card)] animate-in fade-in zoom-in-95 duration-200">
        <div
          className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${
            isAutoApproved
              ? "bg-emerald-500/10 text-emerald-500"
              : "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
          }`}
        >
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="glass-badge text-[11px] font-bold uppercase tracking-wide">
            {isAutoApproved ? "Auto-Approved" : "Request Submitted"}
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
            {isAutoApproved
              ? "Your Request Was Automatically Approved!"
              : "Your Request Has Been Received"}
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-md mx-auto leading-relaxed">
            {submissionResult.message}
          </p>
        </div>

        {/* Tracking Token Card */}
        <div className="p-4 rounded-2xl bg-[var(--bg-input)] space-y-2 text-left border border-[var(--border-neu-card)]">
          <div className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Private Status Tracking Link
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-xs text-[var(--text-primary)] truncate">
              /r/{submissionResult.requestToken}
            </span>
            <button
              type="button"
              onClick={copyStatusLink}
              className="btn-secondary px-3 py-1.5 text-xs font-semibold gap-1.5 shrink-0"
              id="copy-status-link-button"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? "Copied" : "Copy"}</span>
            </button>
          </div>
          <p className="text-[11px] text-[var(--text-muted)]">
            Bookmark this URL to track real-time faculty decisions and policy citation notes.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href={statusUrl}
            className="w-full sm:w-auto btn-primary px-6 py-2.5 text-xs font-semibold inline-flex items-center justify-center gap-1.5"
            id="view-status-page-button"
          >
            <span>View Status Page</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="w-full sm:w-auto btn-secondary px-5 py-2.5 text-xs font-semibold cursor-pointer"
            >
              Back to Course Portal
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="card-neu p-5 sm:p-8 max-w-3xl mx-auto space-y-6 border border-[var(--border-neu-card)]">
      {/* Medical Boundary Alert Visible on EVERY Step (Hard Rule 1) */}
      <MedicalBoundaryBanner compact />

      {/* Header and Stepper Navigation */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[var(--accent-primary)] uppercase tracking-wider">
              {courseCode} • Intake Form
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">
              {courseName}
            </h2>
          </div>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="btn-ghost text-xs px-3 py-1.5 cursor-pointer"
            >
              Cancel
            </button>
          )}
        </div>

        {/* Stepper Dots / Bar */}
        <div className="flex items-center justify-between gap-1 sm:gap-2 pt-2 border-b border-[var(--border-neu-card)]/60 pb-4 overflow-x-auto">
          {STEPS.map((s) => {
            const isCompleted = currentStep > s.id;
            const isCurrent = currentStep === s.id;
            return (
              <div
                key={s.id}
                className={`flex items-center gap-1.5 text-xs font-medium shrink-0 ${
                  isCurrent
                    ? "text-[var(--accent-primary)] font-semibold"
                    : isCompleted
                      ? "text-emerald-500"
                      : "text-[var(--text-muted)]"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                    isCurrent
                      ? "bg-[var(--accent-primary)] text-white shadow-sm"
                      : isCompleted
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-[var(--bg-input)] text-[var(--text-muted)]"
                  }`}
                >
                  {isCompleted ? "✓" : s.id}
                </div>
                <span className="hidden sm:inline">{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Inline Errors */}
      {submitErrors.length > 0 && (
        <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs text-rose-600 dark:text-rose-400 space-y-1">
          <div className="font-semibold flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>Please correct the following:</span>
          </div>
          <ul className="list-disc pl-5 space-y-0.5">
            {submitErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ================= STEP 1: Request Type ================= */}
      {currentStep === 1 && (
        <div className="space-y-5 animate-in fade-in duration-150">
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              Step 1: Select Request Category
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Choose the academic category matching your syllabus concern.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { id: "extension", label: "Deadline Extension", desc: "Request extra time on assignments/labs", icon: CalendarClock },
              { id: "regrade", label: "Grade Dispute / Regrade", desc: "Cite rubric criteria to dispute an assessment score", icon: FileCheck2 },
              { id: "absence", label: "Excused Absence", desc: "Varsity sports, religious, cultural or civic duty", icon: CalendarX2 },
              { id: "meeting", label: "Office Hours / 1-on-1", desc: "Schedule a consultation with set agenda", icon: Users2 },
              { id: "missing_grade", label: "Missing Grade Inquiry", desc: "Work submitted but unrecorded in the LMS", icon: FileQuestion },
              { id: "other", label: "General Course Inquiry", desc: "Other syllabus questions without medical content", icon: HelpCircle },
            ].map((item) => {
              const Icon = item.icon;
              const isSelected = requestType === item.id && !healthSelected;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setRequestType(item.id as RequestType);
                    setHealthSelected(false);
                  }}
                  className={`p-4 rounded-2xl text-left border transition-all flex items-start gap-3 cursor-pointer ${
                    isSelected
                      ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/5 ring-2 ring-[var(--accent-primary)]/20 shadow-sm"
                      : "border-[var(--border-neu-card)] bg-[var(--bg-surface)] hover:border-[var(--accent-primary)]/40"
                  }`}
                  id={`select-request-type-${item.id}`}
                >
                  <div
                    className={`p-2 rounded-xl shrink-0 ${
                      isSelected
                        ? "bg-[var(--accent-primary)] text-white"
                        : "bg-[var(--bg-input)] text-[var(--accent-primary)]"
                    }`}
                  >
                    <Icon size={18} />
                  </div>
                  <div>
                    <div className="font-semibold text-xs sm:text-sm text-[var(--text-primary)]">
                      {item.label}
                    </div>
                    <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                      {item.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Hard Rule 1 Medical / Health Choice Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setHealthSelected(true)}
              className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between cursor-pointer transition-all ${
                healthSelected
                  ? "border-rose-500 bg-rose-500/10 ring-2 ring-rose-500/20"
                  : "border-amber-500/30 bg-amber-500/5 hover:border-amber-500/60"
              }`}
              id="select-medical-issue-button"
            >
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
                <div>
                  <span className="font-semibold text-xs text-[var(--text-primary)]">
                    Health, Illness, or Mental Well-Being Concern?
                  </span>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    FacultyOS does not collect medical records. Click here for university routing.
                  </p>
                </div>
              </div>
              <span className="glass-badge text-[10px] font-bold text-rose-500 shrink-0">
                Support Routing
              </span>
            </button>

            {healthSelected && (
              <div className="mt-3 p-4 rounded-2xl border border-rose-500/30 bg-rose-500/5 space-y-2 text-xs">
                <div className="font-bold text-rose-600 dark:text-rose-400">
                  Medical Data Block (Hard Rule 1)
                </div>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  To safeguard student confidentiality, medical information or doctor notes must NOT be entered into FacultyOS. All medical accommodations are routed directly through the University Health and Student Affairs department.
                </p>
                <div className="pt-1">
                  <a
                    href="#support"
                    onClick={(e) => {
                      e.preventDefault();
                      alert("Please contact Campus Student Health Center or CAPS at ext. 4100.");
                    }}
                    className="btn-primary text-[11px] px-3.5 py-1.5 font-semibold inline-flex items-center gap-1"
                  >
                    Contact University Healthcare Support
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= STEP 2: Details ================= */}
      {currentStep === 2 && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              Step 2: Request Details
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Provide necessary academic information for deterministic policy evaluation.
            </p>
          </div>

          {/* Student Identity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">
                Student Full Name *
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="e.g. Maya Lin"
                className="input-neu w-full px-3.5 py-2 text-xs"
                id="input-student-name"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">
                Student University Email *
              </label>
              <input
                type="email"
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
                placeholder="maya.lin@university.edu"
                className="input-neu w-full px-3.5 py-2 text-xs"
                id="input-student-email"
              />
            </div>
          </div>

          {/* EXTENSION FIELDS */}
          {requestType === "extension" && (
            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Assignment / Project Name *
                </label>
                <input
                  type="text"
                  value={assignmentName}
                  onChange={(e) => setAssignmentName(e.target.value)}
                  placeholder="e.g. Problem Set 4 / Lab 3"
                  className="input-neu w-full px-3.5 py-2 text-xs"
                  id="input-assignment-name"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">
                    Current Syllabus Deadline *
                  </label>
                  <input
                    type="datetime-local"
                    value={currentDeadline}
                    onChange={(e) => setCurrentDeadline(e.target.value)}
                    className="input-neu w-full px-3.5 py-2 text-xs"
                    id="input-current-deadline"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">
                    Requested New Deadline *
                  </label>
                  <input
                    type="datetime-local"
                    value={requestedNewDeadline}
                    onChange={(e) => setRequestedNewDeadline(e.target.value)}
                    className="input-neu w-full px-3.5 py-2 text-xs"
                    id="input-requested-deadline"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Reason Category (Closed Non-Medical Enum) *
                </label>
                <select
                  value={reasonCategory}
                  onChange={(e) => setReasonCategory(e.target.value as ReasonCategory)}
                  className="input-neu w-full px-3.5 py-2 text-xs"
                  id="select-reason-category"
                >
                  <option value="academic_conflict">Academic Conflict (overlapping exams/midterms)</option>
                  <option value="technical_issue">Technical Issue (LMS / hardware failure)</option>
                  <option value="varsity_athletics">Varsity Athletics (official competition)</option>
                  <option value="university_approved_absence">University Approved Event / Conference</option>
                  <option value="religious_observance">Religious Observance</option>
                  <option value="civic_duty">Civic Duty / Jury Duty</option>
                  <option value="family_emergency_non_medical">Family Emergency (Non-medical)</option>
                  <option value="documentation_pending">Documentation Pending</option>
                  <option value="other">Other Academic Reason</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Explanation / Circumstances (min 20 characters) *
                </label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={3}
                  placeholder="Detail your request context and syllabus timeline..."
                  className="input-neu w-full px-3.5 py-2 text-xs resize-none"
                  id="textarea-extension-details"
                />
                <div className="text-[10px] text-[var(--text-muted)] text-right">
                  {details.length} / 5000 (min 20)
                </div>
              </div>
            </div>
          )}

          {/* REGRADE FIELDS */}
          {requestType === "regrade" && (
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">
                    Assignment / Exam Name *
                  </label>
                  <input
                    type="text"
                    value={assignmentName}
                    onChange={(e) => setAssignmentName(e.target.value)}
                    placeholder="e.g. Midterm 1 - Question 4"
                    className="input-neu w-full px-3.5 py-2 text-xs"
                    id="input-regrade-assignment"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">
                    Current Grade Received *
                  </label>
                  <input
                    type="text"
                    value={currentGrade}
                    onChange={(e) => setCurrentGrade(e.target.value)}
                    placeholder="e.g. 14 / 20"
                    className="input-neu w-full px-3.5 py-2 text-xs"
                    id="input-regrade-grade"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Rubric Item Citation (Required) *
                </label>
                <input
                  type="text"
                  value={rubricItemCitation}
                  onChange={(e) => setRubricItemCitation(e.target.value)}
                  placeholder="e.g. Section 2.3: Correct implementation of B-tree rebalance"
                  className="input-neu w-full px-3.5 py-2 text-xs"
                  id="input-regrade-rubric"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Student Work Quote *
                </label>
                <textarea
                  value={studentWorkQuote}
                  onChange={(e) => setStudentWorkQuote(e.target.value)}
                  rows={2}
                  placeholder="Quote the exact code or written solution from your submission..."
                  className="input-neu w-full px-3.5 py-2 text-xs resize-none"
                  id="textarea-regrade-student-work"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Professor / Grader Feedback Quote *
                </label>
                <textarea
                  value={professorFeedbackQuote}
                  onChange={(e) => setProfessorFeedbackQuote(e.target.value)}
                  rows={2}
                  placeholder="Quote the exact feedback or deduction note..."
                  className="input-neu w-full px-3.5 py-2 text-xs resize-none"
                  id="textarea-regrade-grader-feedback"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Justification (min 100 characters) *
                </label>
                <textarea
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  rows={3}
                  placeholder="Explain why your answer matches the rubric criteria rather than the deduction reason..."
                  className="input-neu w-full px-3.5 py-2 text-xs resize-none"
                  id="textarea-regrade-justification"
                />
                <div className="text-[10px] text-[var(--text-muted)] text-right">
                  {justification.length} / 5000 (min 100)
                </div>
              </div>
            </div>
          )}

          {/* ABSENCE FIELDS */}
          {requestType === "absence" && (
            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Absence Date(s) *
                </label>
                <input
                  type="text"
                  value={absenceDates}
                  onChange={(e) => setAbsenceDates(e.target.value)}
                  placeholder="e.g. 2026-10-18 to 2026-10-20"
                  className="input-neu w-full px-3.5 py-2 text-xs"
                  id="input-absence-dates"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Reason Category *
                </label>
                <select
                  value={reasonCategory}
                  onChange={(e) => setReasonCategory(e.target.value as ReasonCategory)}
                  className="input-neu w-full px-3.5 py-2 text-xs"
                  id="select-absence-reason"
                >
                  <option value="varsity_athletics">Varsity Athletics (Intercollegiate games)</option>
                  <option value="university_approved_absence">University Approved Absence (Hackathon, Conference, UTSAV)</option>
                  <option value="religious_observance">Religious Observance</option>
                  <option value="civic_duty">Civic Duty / Court / Jury Duty</option>
                  <option value="family_emergency_non_medical">Family Emergency (Non-medical)</option>
                  <option value="academic_conflict">Academic Fieldwork / Conflict</option>
                  <option value="other">Other Official Reason</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Details &amp; Schedule *
                </label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={3}
                  placeholder="Describe the official event or schedule requiring your absence..."
                  className="input-neu w-full px-3.5 py-2 text-xs resize-none"
                  id="textarea-absence-details"
                />
              </div>
            </div>
          )}

          {/* MEETING FIELDS */}
          {requestType === "meeting" && (
            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Meeting Purpose *
                </label>
                <input
                  type="text"
                  value={meetingPurpose}
                  onChange={(e) => setMeetingPurpose(e.target.value)}
                  placeholder="e.g. Research advisory consultation or concept review"
                  className="input-neu w-full px-3.5 py-2 text-xs"
                  id="input-meeting-purpose"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Agenda (Required) *
                </label>
                <textarea
                  value={meetingAgenda}
                  onChange={(e) => setMeetingAgenda(e.target.value)}
                  rows={2}
                  placeholder="Specific items and questions to be addressed..."
                  className="input-neu w-full px-3.5 py-2 text-xs resize-none"
                  id="textarea-meeting-agenda"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Desired Outcome *
                </label>
                <input
                  type="text"
                  value={desiredOutcome}
                  onChange={(e) => setDesiredOutcome(e.target.value)}
                  placeholder="e.g. Approval on project proposal scope"
                  className="input-neu w-full px-3.5 py-2 text-xs"
                  id="input-meeting-outcome"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Preferred Date / Time Options *
                </label>
                <input
                  type="text"
                  value={preferredDates}
                  onChange={(e) => setPreferredDates(e.target.value)}
                  placeholder="e.g. Tuesdays 2:00-4:00 PM or Thursdays 10:00-11:30 AM"
                  className="input-neu w-full px-3.5 py-2 text-xs"
                  id="input-meeting-dates"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1 text-xs">
                <input
                  type="checkbox"
                  checked={canBeAsync}
                  onChange={(e) => setCanBeAsync(e.target.checked)}
                  className="rounded text-[var(--accent-primary)]"
                />
                <span className="text-[var(--text-primary)]">
                  This topic can also be resolved asynchronously via email if professor prefers
                </span>
              </label>
            </div>
          )}

          {/* MISSING GRADE FIELDS */}
          {requestType === "missing_grade" && (
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">
                    Assignment / Exam Name *
                  </label>
                  <input
                    type="text"
                    value={assignmentName}
                    onChange={(e) => setAssignmentName(e.target.value)}
                    placeholder="e.g. Quiz 2 / Lab 4"
                    className="input-neu w-full px-3.5 py-2 text-xs"
                    id="input-missing-assignment"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">
                    Date Submitted / Taken *
                  </label>
                  <input
                    type="text"
                    value={dateSubmittedOrTaken}
                    onChange={(e) => setDateSubmittedOrTaken(e.target.value)}
                    placeholder="e.g. 2026-10-04, 3:30 PM"
                    className="input-neu w-full px-3.5 py-2 text-xs"
                    id="input-missing-date"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Submission Details / Confirmation Code *
                </label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={3}
                  placeholder="Mention LMS submission ID, partner name, or proctor room..."
                  className="input-neu w-full px-3.5 py-2 text-xs resize-none"
                  id="textarea-missing-details"
                />
              </div>
            </div>
          )}

          {/* OTHER FIELDS */}
          {requestType === "other" && (
            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Subject *
                </label>
                <input
                  type="text"
                  value={otherSubject}
                  onChange={(e) => setOtherSubject(e.target.value)}
                  placeholder="Brief summary of inquiry"
                  className="input-neu w-full px-3.5 py-2 text-xs"
                  id="input-other-subject"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Details (min 20 chars) *
                </label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={3}
                  placeholder="Detail your request..."
                  className="input-neu w-full px-3.5 py-2 text-xs resize-none"
                  id="textarea-other-details"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= STEP 3: Policy Check ================= */}
      {currentStep === 3 && (
        <div className="space-y-5 animate-in fade-in duration-150">
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              Step 3: Course Policy Check
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Review syllabus conditions that apply to this request.
            </p>
          </div>

          <div className="card-neu p-4 sm:p-5 rounded-2xl space-y-3 bg-[var(--bg-surface)] text-xs border border-[var(--border-neu-card)]">
            <div className="font-semibold text-sm text-[var(--text-primary)]">
              Before submitting, please confirm:
            </div>
            <ul className="space-y-2 text-[var(--text-secondary)]">
              <li className="flex items-start gap-2">
                <span className="text-[var(--accent-primary)] font-bold">•</span>
                <span>
                  <strong>Advance Notice:</strong> Extension requests typically require at least 24–48 hours advance notice prior to deadline.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--accent-primary)] font-bold">•</span>
                <span>
                  <strong>Grade Penalties:</strong> Late policies or percentage deductions apply automatically per syllabus criteria.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 font-bold">•</span>
                <span>
                  <strong>Medical Confidentiality (Hard Rule 1):</strong> Medical or mental-health documentation is strictly not collected or required here.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--status-info)] font-bold">•</span>
                <span>
                  <strong>Emergencies:</strong> For physical or psychological crises, contact University Support Services immediately.
                </span>
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-neu-card)]">
            <label className="flex items-start gap-2.5 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={policyAccepted}
                onChange={(e) => setPolicyAccepted(e.target.checked)}
                className="mt-0.5 rounded text-[var(--accent-primary)]"
                id="checkbox-policy-agreement"
              />
              <span className="font-medium text-[var(--text-primary)]">
                I have read the course policy and confirm that all details provided are accurate and free of sensitive medical data.
              </span>
            </label>
          </div>
        </div>
      )}

      {/* ================= STEP 4: Attachments (Optional) ================= */}
      {currentStep === 4 && (
        <div className="space-y-5 animate-in fade-in duration-150">
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              Step 4: Non-Medical Supporting Notes &amp; Proof (Optional)
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Add non-medical documentation or proof (e.g. conference acceptance, hackathon badge, travel itinerary).
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 text-xs text-[var(--text-secondary)] flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <span>
              <strong>Hard Rule 1:</strong> Do not upload doctor notes, prescriptions, or medical records. Any medical document submitted will be blocked and destroyed.
            </span>
          </div>

          <div className="space-y-3">
            <div className="p-6 rounded-2xl border-2 border-dashed border-[var(--border-neu-card)] text-center space-y-2 bg-[var(--bg-input)]/50">
              <FileUp className="w-8 h-8 text-[var(--text-muted)] mx-auto" />
              <div className="text-xs font-semibold text-[var(--text-primary)]">
                Upload Proof File (PDF / PNG / JPG)
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">
                Allowlisted MIME types only • Max 10MB
              </p>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setAttachmentFileName(file.name);
                    setHasDocumentation(true);
                  }
                }}
                className="text-xs text-[var(--text-secondary)] mx-auto block pt-1"
                id="file-attachment-input"
              />
              {attachmentFileName && (
                <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  Attached: {attachmentFileName}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">
                Documentation Notes / Citation Link
              </label>
              <input
                type="text"
                value={attachmentNote}
                onChange={(e) => setAttachmentNote(e.target.value)}
                placeholder="e.g. Official athletic roster schedule / flight confirmation # / conference link"
                className="input-neu w-full px-3.5 py-2 text-xs"
                id="input-attachment-notes"
              />
            </div>
          </div>
        </div>
      )}

      {/* ================= STEP 5: Review ================= */}
      {currentStep === 5 && (
        <div className="space-y-5 animate-in fade-in duration-150">
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              Step 5: Review Your Request
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Please double check all submitted details before final bot verification.
            </p>
          </div>

          <div className="card-neu p-5 rounded-2xl space-y-3 text-xs border border-[var(--border-neu-card)] divide-y divide-[var(--border-neu-card)]/50">
            <div className="pb-3 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                  Request Type
                </span>
                <div className="font-bold text-sm text-[var(--text-primary)] capitalize">
                  {requestType.replace("_", " ")}
                </div>
              </div>
              <span className="glass-badge font-semibold">{courseCode}</span>
            </div>

            <div className="py-2.5 grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-[var(--text-muted)]">Student</span>
                <div className="font-semibold text-[var(--text-primary)]">{studentName}</div>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-muted)]">Email</span>
                <div className="font-semibold text-[var(--text-primary)] truncate">{studentEmail}</div>
              </div>
            </div>

            {requestType === "extension" && (
              <div className="py-2.5 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)]">Assignment</span>
                    <div className="font-medium text-[var(--text-primary)]">{assignmentName}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)]">Reason</span>
                    <div className="font-medium text-[var(--text-primary)]">{reasonCategory}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)]">Current Deadline</span>
                    <div className="font-mono text-[11px] text-[var(--text-primary)]">
                      {currentDeadline ? new Date(currentDeadline).toLocaleString() : "N/A"}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)]">Requested Deadline</span>
                    <div className="font-mono text-[11px] text-[var(--accent-primary)] font-semibold">
                      {requestedNewDeadline ? new Date(requestedNewDeadline).toLocaleString() : "N/A"}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {requestType === "regrade" && (
              <div className="py-2.5 space-y-1.5">
                <div>
                  <span className="text-[10px] text-[var(--text-muted)]">Rubric Item</span>
                  <div className="font-medium text-[var(--text-primary)]">{rubricItemCitation}</div>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--text-muted)]">Current Grade</span>
                  <div className="font-medium text-[var(--text-primary)]">{currentGrade}</div>
                </div>
              </div>
            )}

            <div className="pt-2.5 space-y-1">
              <span className="text-[10px] text-[var(--text-muted)]">Provided Details</span>
              <p className="text-[var(--text-secondary)] italic line-clamp-3">
                &ldquo;{details || justification || meetingAgenda}&rdquo;
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ================= STEP 6: Submit ================= */}
      {currentStep === 6 && (
        <div className="space-y-5 animate-in fade-in duration-150">
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              Step 6: Bot Verification &amp; Submit
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Protect course queue from spam and evaluate with syllabus policy rules.
            </p>
          </div>

          {/* Cloudflare Turnstile Simulated / Widget Container */}
          <div className="card-neu p-4 rounded-2xl border border-[var(--border-neu-card)] flex items-center justify-between bg-[var(--bg-surface)]">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={turnstilePassed}
                onChange={(e) => setTurnstilePassed(e.target.checked)}
                className="w-5 h-5 rounded text-[var(--accent-primary)] cursor-pointer"
                id="turnstile-verification-checkbox"
              />
              <div>
                <div className="font-semibold text-xs text-[var(--text-primary)]">
                  Cloudflare Turnstile Verification
                </div>
                <div className="text-[11px] text-[var(--text-muted)]">
                  Verify request is submitted by human student
                </div>
              </div>
            </div>
            <span className="glass-badge text-[10px] font-mono">
              {turnstilePassed ? "Verified" : "Pending"}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--bg-input)] text-xs text-[var(--text-secondary)] leading-relaxed">
            Upon submitting, the deterministic FacultyOS engine checks course rules. If eligible, your request will be approved immediately. Otherwise, it will route to your instructor&apos;s queue.
          </div>
        </div>
      )}

      {/* Stepper Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-[var(--border-neu-card)]/60">
        {currentStep > 1 ? (
          <button
            type="button"
            onClick={handlePrev}
            disabled={isSubmitting}
            className="btn-secondary px-4 py-2 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            id="stepper-prev-button"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>
        ) : (
          <div />
        )}

        {currentStep < 6 ? (
          <button
            type="button"
            onClick={handleNext}
            className="btn-primary px-5 py-2 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            id="stepper-next-button"
          >
            <span>Continue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={isSubmitting || !turnstilePassed}
            className="btn-primary px-6 py-2.5 text-xs font-semibold inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
            id="stepper-submit-button"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Evaluating Policy...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Submit Request</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
