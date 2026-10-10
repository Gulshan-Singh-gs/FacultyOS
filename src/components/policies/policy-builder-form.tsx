"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Trash2,
  Sliders,
  Check,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  ShieldAlert,
  Save,
} from "lucide-react";
import {
  PolicySchema,
  type PolicyType,
  type ConditionOperator,
  type PolicyCondition,
  type PolicyAction,
} from "@/lib/validations/policy";
import {
  createPolicyAction,
  updatePolicyAction,
  deletePolicyAction,
} from "@/server/actions/policies";
import type { policies } from "@/server/db/schema";

const REQUEST_TYPE_OPTIONS: { value: PolicyType; label: string }[] = [
  { value: "extension", label: "Deadline Extension" },
  { value: "late_assignment", label: "Late Assignment" },
  { value: "regrade", label: "Regrade Request" },
  { value: "absence", label: "Excused Absence" },
  { value: "meeting", label: "Office Hours / Meeting" },
  { value: "missing_grade", label: "Missing Grade Inquiry" },
  { value: "recommendation_letter", label: "Recommendation Letter" },
  { value: "academic_integrity", label: "Academic Integrity" },
  { value: "other", label: "General Course Inquiry" },
];

const COMMON_FIELDS = [
  { value: "hours_notice", label: "Hours Notice Before Deadline", type: "number" },
  { value: "hours_late", label: "Hours Late After Deadline", type: "number" },
  { value: "days_before_deadline", label: "Days Before Deadline", type: "number" },
  { value: "assignment_type", label: "Assignment Type (homework, lab, quiz)", type: "string" },
  { value: "prior_extensions", label: "Prior Extensions This Term", type: "number" },
  { value: "reason_category", label: "Reason Category (official, family, travel)", type: "string" },
  { value: "has_rubric_citation", label: "Has Specific Rubric Citation", type: "boolean" },
  { value: "is_async_resolvable", label: "Can Be Resolved Asynchronously", type: "boolean" },
];

const OPERATOR_OPTIONS: { value: ConditionOperator; label: string }[] = [
  { value: "gte", label: ">= (at least)" },
  { value: "gt", label: "> (greater than)" },
  { value: "lte", label: "<= (at most)" },
  { value: "lt", label: "< (less than)" },
  { value: "equals", label: "== (equals)" },
  { value: "not_equals", label: "!= (does not equal)" },
  { value: "in", label: "in (one of list)" },
  { value: "contains", label: "contains text" },
  { value: "exists", label: "exists / provided" },
  { value: "does_not_exist", label: "is missing" },
];

const ACTION_TYPE_OPTIONS = [
  { value: "auto_approve", label: "Auto-Approve Request" },
  { value: "manual_review", label: "Route to Manual Review" },
  { value: "apply_penalty", label: "Apply Late Penalty" },
  { value: "require_info", label: "Request Additional Information" },
  { value: "route_to_ta", label: "Route to Teaching Assistant" },
  { value: "send_template", label: "Send Automated Guidance" },
  { value: "auto_deny", label: "Auto-Deny (Policy Non-Compliant)" },
];

interface PolicyBuilderFormProps {
  courseId: string;
  courseCode: string;
  policy?: typeof policies.$inferSelect;
}

export function PolicyBuilderForm({
  courseId,
  courseCode,
  policy,
}: PolicyBuilderFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isEditing = Boolean(policy);

  // Initial parsed state
  const initialConditions: PolicyCondition[] = policy
    ? JSON.parse(policy.conditionsJson)
    : [{ field: "hours_notice", operator: "gte", value: 48 }];

  const initialActions: PolicyAction[] = policy
    ? JSON.parse(policy.actionsJson)
    : [{ type: "auto_approve", note: "Standard 48-hour advance notice window satisfied." }];

  // Form State
  const [name, setName] = useState(policy?.name || "48-Hour Advance Notice Auto-Approve");
  const [policyType, setPolicyType] = useState<PolicyType>(
    (policy?.policyType as PolicyType) || "extension",
  );
  const [priority, setPriority] = useState<number>(policy?.priority || 100);
  const [isActive, setIsActive] = useState<boolean>(policy ? policy.isActive : true);
  const [conditions, setConditions] = useState<PolicyCondition[]>(initialConditions);
  const [actions, setActions] = useState<PolicyAction[]>(initialActions);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Preset Template Loader
  function loadPreset(presetName: "48h_extension" | "late_penalty" | "absence_official" | "regrade_rubric") {
    if (presetName === "48h_extension") {
      setName("48-Hour Advance Notice Auto-Approve");
      setPolicyType("extension");
      setPriority(100);
      setConditions([{ field: "hours_notice", operator: "gte", value: 48 }]);
      setActions([{ type: "auto_approve", note: "Submitted with at least 48 hours notice before deadline." }]);
    } else if (presetName === "late_penalty") {
      setName("Late Submission 10% Penalty (within 24h)");
      setPolicyType("late_assignment");
      setPriority(110);
      setConditions([{ field: "hours_late", operator: "lte", value: 24 }]);
      setActions([
        { type: "apply_penalty", penaltyPercent: 10, note: "Standard 10% penalty per course syllabus." },
        { type: "manual_review", note: "Instructor grade adjustment required." },
      ]);
    } else if (presetName === "absence_official") {
      setName("Official University Absence Auto-Approve");
      setPolicyType("absence");
      setPriority(90);
      setConditions([{ field: "reason_category", operator: "in", value: "athletics,university_sanctioned,civic" }]);
      setActions([{ type: "auto_approve", note: "Sanctioned institutional activity verified." }]);
    } else if (presetName === "regrade_rubric") {
      setName("Rubric-Cited Regrade Defense Review");
      setPolicyType("regrade");
      setPriority(120);
      setConditions([{ field: "has_rubric_citation", operator: "equals", value: true }]);
      setActions([{ type: "manual_review", note: "Requires specific rubric benchmark comparison." }]);
    }
    setErrorMessage(null);
  }

  // Conditions helpers
  function addCondition() {
    setConditions([
      ...conditions,
      { field: "hours_notice", operator: "gte", value: 24 },
    ]);
  }

  function removeCondition(index: number) {
    if (conditions.length <= 1) {
      setErrorMessage("At least one condition rule row is required.");
      return;
    }
    setConditions(conditions.filter((_, i) => i !== index));
    setErrorMessage(null);
  }

  function updateCondition(
    index: number,
    field: keyof PolicyCondition,
    val: unknown,
  ) {
    setConditions((prev) =>
      prev.map((c, i) => {
        if (i !== index) return c;
        if (field === "value") {
          let parsedVal: unknown = val;
          if (typeof val === "string" && !isNaN(Number(val)) && val.trim() !== "") {
            parsedVal = Number(val);
          } else if (val === "true") {
            parsedVal = true;
          } else if (val === "false") {
            parsedVal = false;
          }
          return { ...c, value: parsedVal as string | number | boolean | string[] };
        }
        return { ...c, [field]: val };
      }),
    );
  }

  // Actions helpers
  function addAction() {
    setActions([
      ...actions,
      { type: "manual_review", note: "Forwarded for faculty triage." },
    ]);
  }

  function removeAction(index: number) {
    if (actions.length <= 1) {
      setErrorMessage("At least one action is required.");
      return;
    }
    setActions(actions.filter((_, i) => i !== index));
    setErrorMessage(null);
  }

  function updateAction(
    index: number,
    field: keyof PolicyAction,
    val: unknown,
  ) {
    setActions((prev) =>
      prev.map((a, i) => {
        if (i !== index) return a;
        if (field === "penaltyPercent") {
          return { ...a, penaltyPercent: val ? Number(val) : undefined };
        }
        return { ...a, [field]: val };
      }),
    );
  }

  // Validation Preview Helper
  function validateCurrentState(): { isValid: boolean; message: string } {
    const parseResult = PolicySchema.safeParse({
      name,
      policyType,
      priority,
      conditions,
      actions,
      isActive,
    });

    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      return { isValid: false, message: `${issue.path.join(".")}: ${issue.message}` };
    }
    return { isValid: true, message: "Policy format is fully valid and deterministic." };
  }

  const validationState = validateCurrentState();

  // Submission handler
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const parseResult = PolicySchema.safeParse({
      name,
      policyType,
      priority,
      conditions,
      actions,
      isActive,
    });

    if (!parseResult.success) {
      setErrorMessage(parseResult.error.issues[0].message);
      return;
    }

    startTransition(async () => {
      try {
        if (isEditing && policy) {
          const res = await updatePolicyAction({
            policyId: policy.id,
            name,
            policyType,
            priority,
            conditions,
            actions,
            isActive,
          });

          if (!res.success) {
            setErrorMessage(res.error);
            return;
          }

          setSuccessMessage(`Policy updated successfully to version ${res.data.version}.`);
          router.push(`/courses/${courseId}`);
          router.refresh();
        } else {
          const res = await createPolicyAction({
            courseId,
            name,
            policyType,
            priority,
            conditions,
            actions,
            isActive,
          });

          if (!res.success) {
            setErrorMessage(res.error);
            return;
          }

          setSuccessMessage("Policy created successfully at version 1.");
          router.push(`/courses/${courseId}`);
          router.refresh();
        }
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : "An unexpected error occurred.");
      }
    });
  }

  async function handleDelete() {
    if (!policy) return;
    if (!confirm("Are you sure you want to permanently delete this policy?")) return;

    startTransition(async () => {
      const res = await deletePolicyAction({ policyId: policy.id, courseId });
      if (!res.success) {
        setErrorMessage(res.error);
        return;
      }
      router.push(`/courses/${courseId}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Top Header / Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] mb-1">
            <Link
              href={`/courses/${courseId}`}
              className="inline-flex items-center gap-1 hover:text-[var(--text-primary)]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to {courseCode}</span>
            </Link>
            <span>/</span>
            <span className="font-semibold text-[var(--text-primary)]">
              {isEditing ? `Edit Policy (v${policy?.version})` : "New Policy Rule"}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            {isEditing ? `Edit Policy: ${policy?.name}` : "Visual Policy Builder"}
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Configure transparent, deterministic evaluation rules for student requests.
          </p>
        </div>

        {/* Quick Presets */}
        {!isEditing && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-medium text-[var(--text-muted)] flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              Load Preset:
            </span>
            <button
              type="button"
              onClick={() => loadPreset("48h_extension")}
              className="btn-secondary px-2.5 py-1 text-[11px] font-medium"
            >
              48h Extension
            </button>
            <button
              type="button"
              onClick={() => loadPreset("late_penalty")}
              className="btn-secondary px-2.5 py-1 text-[11px] font-medium"
            >
              10% Late Penalty
            </button>
            <button
              type="button"
              onClick={() => loadPreset("absence_official")}
              className="btn-secondary px-2.5 py-1 text-[11px] font-medium"
            >
              Official Absence
            </button>
          </div>
        )}
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl border border-red-500/20 bg-red-500/10 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Grid: Builder on Left, Live Glass Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form: When/Then Rules (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Metadata Card */}
          <div className="card-neu p-6 space-y-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              1. Policy Information
            </h2>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">
                Policy Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. 48-Hour Advance Notice Auto-Approve"
                className="input-neu w-full px-3.5 py-2.5 text-xs font-medium"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">
                  Applies to Request Type
                </label>
                <select
                  value={policyType}
                  onChange={(e) => setPolicyType(e.target.value as PolicyType)}
                  className="input-neu w-full px-3 py-2 text-xs font-medium cursor-pointer"
                >
                  {REQUEST_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-[var(--bg-surface)]">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[var(--text-primary)]">
                    Priority Order ({priority})
                  </label>
                  <span className="text-[10px] text-[var(--text-muted)]">
                    Lower number = evaluates first
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="500"
                    value={priority}
                    onChange={(e) => setPriority(Number(e.target.value))}
                    className="w-full accent-[var(--accent-primary)] cursor-pointer"
                  />
                  <input
                    type="number"
                    min="1"
                    max="999"
                    value={priority}
                    onChange={(e) => setPriority(Number(e.target.value))}
                    className="input-neu w-16 px-2 py-1 text-xs text-center font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-[var(--border-neu-card)]">
              <div>
                <span className="text-xs font-semibold text-[var(--text-primary)] block">
                  Rule Evaluation Status
                </span>
                <span className="text-[11px] text-[var(--text-secondary)]">
                  Active policies are tested against incoming requests immediately.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                  isActive
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                    : "bg-gray-500/15 text-gray-500 border border-gray-500/30"
                }`}
              >
                {isActive ? "ACTIVE" : "PAUSED"}
              </button>
            </div>
          </div>

          {/* "WHEN" Conditions Card */}
          <div className="card-neu p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  2. WHEN (Matching Criteria)
                </h2>
                <p className="text-[11px] text-[var(--text-muted)]">
                  All conditions in this group must evaluate to TRUE for this rule to match.
                </p>
              </div>
              <button
                type="button"
                onClick={addCondition}
                className="btn-secondary px-2.5 py-1 text-xs font-medium inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Condition</span>
              </button>
            </div>

            {/* Medical Boundary Notice (Hard Rule 1) */}
            <div className="p-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 text-[11px] text-amber-700 dark:text-amber-400 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>
                <strong>Hard Rule 1 Notice:</strong> Health and medical data must never be collected or automated. Use non-medical categories only.
              </span>
            </div>

            {/* Conditions Rows */}
            <div className="space-y-3">
              {conditions.map((cond, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-[var(--bg-input)] space-y-2 border border-[var(--border-neu-card)]"
                >
                  <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--text-secondary)]">
                    <span>Condition #{idx + 1}</span>
                    {conditions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeCondition(idx)}
                        className="text-red-500 hover:text-red-600 p-1"
                        aria-label="Remove condition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    {/* Field */}
                    <div className="sm:col-span-5">
                      <input
                        type="text"
                        list={`fields-list-${idx}`}
                        value={cond.field}
                        onChange={(e) => updateCondition(idx, "field", e.target.value)}
                        placeholder="field name (e.g. hours_notice)"
                        className="input-neu w-full px-2.5 py-1.5 text-xs font-mono"
                        required
                      />
                      <datalist id={`fields-list-${idx}`}>
                        {COMMON_FIELDS.map((f) => (
                          <option key={f.value} value={f.value}>
                            {f.label}
                          </option>
                        ))}
                      </datalist>
                    </div>

                    {/* Operator */}
                    <div className="sm:col-span-4">
                      <select
                        value={cond.operator}
                        onChange={(e) =>
                          updateCondition(idx, "operator", e.target.value as ConditionOperator)
                        }
                        className="input-neu w-full px-2 py-1.5 text-xs font-medium cursor-pointer"
                      >
                        {OPERATOR_OPTIONS.map((op) => (
                          <option key={op.value} value={op.value} className="bg-[var(--bg-surface)]">
                            {op.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Value */}
                    <div className="sm:col-span-3">
                      <input
                        type="text"
                        value={cond.value === undefined ? "" : String(cond.value)}
                        onChange={(e) => updateCondition(idx, "value", e.target.value)}
                        placeholder="value (e.g. 48)"
                        className="input-neu w-full px-2.5 py-1.5 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* "THEN" Actions Card */}
          <div className="card-neu p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  3. THEN (Automated Decisions)
                </h2>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Action dispatched when conditions are satisfied.
                </p>
              </div>
              <button
                type="button"
                onClick={addAction}
                className="btn-secondary px-2.5 py-1 text-xs font-medium inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Action</span>
              </button>
            </div>

            <div className="space-y-3">
              {actions.map((act, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-[var(--bg-input)] space-y-2.5 border border-[var(--border-neu-card)]"
                >
                  <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--text-secondary)]">
                    <span>Action #{idx + 1}</span>
                    {actions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeAction(idx)}
                        className="text-red-500 hover:text-red-600 p-1"
                        aria-label="Remove action"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-6">
                      <label className="block text-[10px] text-[var(--text-muted)] mb-1">
                        Action Type
                      </label>
                      <select
                        value={act.type}
                        onChange={(e) =>
                          updateAction(
                            idx,
                            "type",
                            e.target.value as PolicyAction["type"],
                          )
                        }
                        className="input-neu w-full px-2.5 py-1.5 text-xs font-medium cursor-pointer"
                      >
                        {ACTION_TYPE_OPTIONS.map((ao) => (
                          <option key={ao.value} value={ao.value} className="bg-[var(--bg-surface)]">
                            {ao.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {act.type === "apply_penalty" && (
                      <div className="sm:col-span-6">
                        <label className="block text-[10px] text-[var(--text-muted)] mb-1">
                          Penalty Percentage (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={act.penaltyPercent || 10}
                          onChange={(e) =>
                            updateAction(idx, "penaltyPercent", e.target.value)
                          }
                          className="input-neu w-full px-2.5 py-1.5 text-xs font-mono"
                          placeholder="e.g. 10"
                        />
                      </div>
                    )}

                    <div className="sm:col-span-12">
                      <label className="block text-[10px] text-[var(--text-muted)] mb-1">
                        Audit Note / Plain-Language Rationale
                      </label>
                      <input
                        type="text"
                        value={act.note || ""}
                        onChange={(e) => updateAction(idx, "note", e.target.value)}
                        placeholder="e.g. Standard 48-hour advance notice window satisfied."
                        className="input-neu w-full px-2.5 py-1.5 text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form Actions (Submit / Delete) */}
          <div className="flex items-center justify-between pt-2">
            <Link
              href={`/courses/${courseId}`}
              className="btn-secondary px-4 py-2 text-xs font-medium"
            >
              Cancel
            </Link>

            <div className="flex items-center gap-2">
              {isEditing && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isPending}
                  className="px-3.5 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                >
                  Delete Policy
                </button>
              )}

              <button
                type="submit"
                disabled={isPending || !validationState.isValid}
                className="btn-primary px-5 py-2 text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>
                  {isPending
                    ? "Saving..."
                    : isEditing
                    ? "Save Changes (Bump Version)"
                    : "Create Policy"}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Live Glass Preview Panel (.glass-panel) (5 cols) */}
        <div className="lg:col-span-5 sticky top-20 space-y-4">
          <div className="glass-panel p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-neu-card)]">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[var(--accent-primary)]" />
                <h3 className="text-sm font-bold tracking-tight text-[var(--text-primary)]">
                  Live Rule Preview
                </h3>
              </div>
              <span className="glass-badge text-[11px] font-semibold">
                Priority: #{priority}
              </span>
            </div>

            {/* Plain language summary */}
            <div className="space-y-3 text-xs leading-relaxed">
              <div className="p-3.5 rounded-xl bg-[var(--bg-input)] space-y-2">
                <div className="font-semibold text-[var(--text-primary)]">
                  Plain-Language Execution:
                </div>
                <p className="text-[var(--text-secondary)]">
                  When a student submits an{" "}
                  <strong className="text-[var(--text-primary)]">
                    {REQUEST_TYPE_OPTIONS.find((r) => r.value === policyType)?.label || policyType}
                  </strong>{" "}
                  request for <strong className="text-[var(--text-primary)]">{courseCode}</strong>:
                </p>
                <div className="space-y-1 pl-2 border-l-2 border-[var(--accent-primary)]">
                  <div className="text-[11px] font-medium text-[var(--text-primary)]">
                    IF all match:
                  </div>
                  {conditions.map((c, i) => (
                    <div key={i} className="text-[11px] text-[var(--text-secondary)] font-mono">
                      • {c.field}{" "}
                      <span className="text-[var(--accent-primary)]">
                        {OPERATOR_OPTIONS.find((o) => o.value === c.operator)?.label.split(" ")[0]}
                      </span>{" "}
                      {String(c.value ?? "")}
                    </div>
                  ))}
                </div>

                <div className="space-y-1 pl-2 border-l-2 border-emerald-500">
                  <div className="text-[11px] font-medium text-[var(--text-primary)]">
                    THEN FacultyOS executes:
                  </div>
                  {actions.map((a, i) => (
                    <div key={i} className="text-[11px] text-[var(--text-secondary)]">
                      •{" "}
                      <strong className="text-[var(--text-primary)]">
                        {ACTION_TYPE_OPTIONS.find((ao) => ao.value === a.type)?.label}
                      </strong>
                      {a.type === "apply_penalty" && ` (${a.penaltyPercent || 10}% penalty)`}
                      {a.note && ` — "${a.note}"`}
                    </div>
                  ))}
                </div>
              </div>

              {/* Status and Explainability Note */}
              <div className="text-[11px] text-[var(--text-muted)] space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isActive ? "bg-emerald-500" : "bg-gray-400"
                    }`}
                  />
                  <span>
                    Status:{" "}
                    <strong className="text-[var(--text-primary)]">
                      {isActive ? "Active (Evaluating)" : "Paused"}
                    </strong>
                  </span>
                </div>
                <div>
                  Version target:{" "}
                  <span className="font-mono text-[var(--text-primary)]">
                    {isEditing ? `v${(policy?.version || 1) + 1} (auto-increment)` : "v1"}
                  </span>
                </div>
                <div>
                  Audit policy snapshot:{" "}
                  <span className="text-emerald-600 dark:text-emerald-400">
                    Compliant with Hard Rule 8
                  </span>
                </div>
              </div>
            </div>

            {/* Validation State Badge */}
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                validationState.isValid
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
              }`}
            >
              {validationState.isValid ? (
                <Check className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{validationState.message}</span>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
