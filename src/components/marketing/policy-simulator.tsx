"use client";

import React, { useState, useMemo } from "react";
import {
  evaluatePolicies,
} from "@/server/services/policy-engine/engine";
import type { Policy, RequestPayload } from "@/server/services/policy-engine/types";
import {
  Sparkles,
  ShieldCheck,
  FileCode,
  ArrowRight,
} from "lucide-react";

interface SimulatorScenario {
  id: string;
  name: string;
  category: string;
  studentPrompt: string;
  payload: RequestPayload;
}

const SAMPLE_POLICIES: Policy[] = [
  {
    id: "policy-ext-48h",
    policyType: "extension",
    priority: 10,
    version: 1,
    isActive: true,
    conditions: [
      { field: "hours_notice", operator: "gte", value: 48 },
    ],
    actions: [
      { type: "auto_approve", note: "Submitted with >= 48h advance notice." },
    ],
  },
  {
    id: "policy-late-10pct",
    policyType: "late_assignment",
    priority: 20,
    version: 2,
    isActive: true,
    conditions: [
      { field: "hours_late", operator: "lte", value: 24 },
    ],
    actions: [
      { type: "apply_penalty", penaltyPercent: 10, note: "Late submission within 24h window (10% deduction)." },
    ],
  },
  {
    id: "policy-regrade-rubric",
    policyType: "regrade",
    priority: 15,
    version: 1,
    isActive: true,
    conditions: [
      { field: "has_rubric_citation", operator: "equals", value: true },
    ],
    actions: [
      { type: "manual_review", note: "Valid rubric citation present. Routed for instructor grading review." },
    ],
  },
];

const SCENARIOS: SimulatorScenario[] = [
  {
    id: "scenario-advance-ext",
    name: "Advance Notice Extension (72h Early)",
    category: "Deadline Extension",
    studentPrompt:
      '"Professor, I have a university robotics team travel conflict on Friday. Submitting 72 hours before the Problem Set 3 deadline."',
    payload: {
      requestType: "extension",
      hours_notice: 72,
      prior_extensions: 0,
      assignment_type: "homework",
    },
  },
  {
    id: "scenario-late-ext",
    name: "Last-Minute Extension (6h Notice)",
    category: "Deadline Extension",
    studentPrompt:
      '"Hi Professor, I won\'t finish tonight\'s project. Can I have 2 more days? Sent at 6:00 PM for an 11:59 PM deadline."',
    payload: {
      requestType: "extension",
      hours_notice: 6,
      prior_extensions: 1,
      assignment_type: "project",
    },
  },
  {
    id: "scenario-late-sub",
    name: "Late Submission (14h After Due)",
    category: "Late Submission",
    studentPrompt:
      '"Submitted Homework 2 this morning at 10 AM (due yesterday at 8 PM). Requesting acceptance under syllabus late policy."',
    payload: {
      requestType: "late_assignment",
      hours_late: 14,
      assignment_type: "homework",
    },
  },
  {
    id: "scenario-vague-regrade",
    name: "Vague Regrade Appeal (No Rubric)",
    category: "Grade Defense",
    studentPrompt:
      '"Professor, I worked really hard on Essay 1 and feel my C+ should be a B+. Please reconsider my grade."',
    payload: {
      requestType: "regrade",
      has_rubric_citation: false,
      assignment_name: "Essay 1",
    },
  },
];

export function PolicySimulator() {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(
    SCENARIOS[0].id,
  );

  const activeScenario = useMemo(
    () => SCENARIOS.find((s) => s.id === selectedScenarioId) || SCENARIOS[0],
    [selectedScenarioId],
  );

  // Directly evaluate using the pure deterministic engine
  const evaluation = useMemo(() => {
    return evaluatePolicies(SAMPLE_POLICIES, activeScenario.payload);
  }, [activeScenario]);

  function handleSelectScenario(id: string) {
    setSelectedScenarioId(id);
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("facultyos:analytics", {
          detail: { event: "simulator_run", scenarioId: id },
        }),
      );
    }
  }

  return (
    <div id="simulator" className="space-y-8 scroll-mt-24">
      {/* Section Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 glass-badge px-3 py-1 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
          <span>Interactive Policy Simulator</span>
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
          See the Deterministic Engine Decide in Real-Time
        </h2>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          Select any real-world student request scenario below. The live engine imports our production code and evaluates your syllabus rules with zero black-box AI hallucinations.
        </p>
      </div>

      {/* Simulator Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Scenario Selector (5 cols) */}
        <div className="lg:col-span-5 space-y-3 flex flex-col justify-between">
          <div className="space-y-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] block">
              1. Choose a Scenario
            </span>
            {SCENARIOS.map((scenario) => {
              const isSelected = scenario.id === selectedScenarioId;
              return (
                <button
                  key={scenario.id}
                  type="button"
                  onClick={() => handleSelectScenario(scenario.id)}
                  className={`w-full text-left p-4 rounded-2xl transition-all border ${
                    isSelected
                      ? "card-neu border-[var(--accent-primary)]/40 shadow-md ring-1 ring-[var(--accent-primary)]/20"
                      : "bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-elevated)] border-[var(--border-neu-card)]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-[var(--accent-primary)]">
                      {scenario.category}
                    </span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-pulse" />
                    )}
                  </div>
                  <h3 className="text-xs font-bold text-[var(--text-primary)]">
                    {scenario.name}
                  </h3>
                  <p className="text-[11px] text-[var(--text-secondary)] line-clamp-1 mt-0.5">
                    {scenario.studentPrompt}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-neu-card)] text-[11px] text-[var(--text-secondary)] flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>
              Pure determinism: executed client-side via <code>evaluatePolicies()</code> without network latency or AI guessing.
            </span>
          </div>
        </div>

        {/* Live Evaluation Display (7 cols) */}
        <div className="lg:col-span-7 glass-panel p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-6">
            {/* Student Request Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-secondary)]">
                <span>Incoming Student Submission</span>
                <span className="font-mono text-[10px]">request_id: sim_942a</span>
              </div>
              <div className="p-4 rounded-xl bg-[var(--bg-input)] border border-[var(--border-neu-card)] text-xs text-[var(--text-primary)] font-sans italic leading-relaxed">
                {activeScenario.studentPrompt}
              </div>
              <div className="flex flex-wrap gap-2 pt-1 font-mono text-[10px] text-[var(--text-muted)]">
                {Object.entries(activeScenario.payload).map(([k, v]) => (
                  <span
                    key={k}
                    className="px-2 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-neu-card)]"
                  >
                    {k}: <strong className="text-[var(--text-primary)]">{String(v)}</strong>
                  </span>
                ))}
              </div>
            </div>

            {/* Decision Outcome */}
            <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-neu-card)] space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Deterministic Engine Outcome
                </span>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    evaluation.status === "auto_approved"
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                      : "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30"
                  }`}
                >
                  {evaluation.status.toUpperCase()}
                </span>
              </div>

              {/* Matched Policy & Action */}
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-[var(--text-muted)] block text-[11px]">
                    Matched Syllabus Policy:
                  </span>
                  <span className="font-semibold text-[var(--text-primary)]">
                    {evaluation.matchedPolicyId ? (
                      <>
                        <code className="text-[var(--accent-primary)] font-mono">
                          {evaluation.matchedPolicyId}
                        </code>{" "}
                        (version {evaluation.matchedPolicyVersion})
                      </>
                    ) : (
                      "None (Fallback to Human Faculty Review)"
                    )}
                  </span>
                </div>

                <div>
                  <span className="text-[var(--text-muted)] block text-[11px]">
                    Action Dispatched:
                  </span>
                  <div className="flex flex-wrap gap-2 pt-0.5">
                    {evaluation.actions.map((act, idx) => (
                      <span
                        key={idx}
                        className="glass-badge font-mono text-[11px] font-bold"
                      >
                        {act.type}
                        {act.penaltyPercent ? ` (${act.penaltyPercent}% penalty)` : ""}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[var(--text-muted)] block text-[11px]">
                    Audit Explanation:
                  </span>
                  <ul className="list-disc list-inside text-[var(--text-secondary)] text-[11px] space-y-0.5 pt-0.5">
                    {evaluation.reasons.map((r, idx) => (
                      <li key={idx}>{r}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Audit Stamp */}
          <div className="pt-3 border-t border-[var(--border-neu-card)] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-[var(--text-muted)]">
            <span className="flex items-center gap-1.5 font-mono">
              <FileCode className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              Hard Rule 8: Persists decision_reason_json
            </span>
            <a
              href="/signup"
              className="text-[var(--accent-primary)] hover:underline font-semibold inline-flex items-center gap-1"
            >
              Configure your course policies <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
