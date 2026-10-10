import type { PolicyInput } from "@/lib/validations/policy";

export interface PolicyTemplate {
  id: string;
  name: string;
  description: string;
  policy: PolicyInput;
}

export const SEED_POLICY_TEMPLATES: Record<string, PolicyTemplate> = {
  "extension-48h": {
    id: "extension-48h",
    name: "48-Hour Notice Extension Policy",
    description: "Automatically approves extension requests submitted at least 48 hours before assignment deadline.",
    policy: {
      policyType: "extension",
      name: "48-Hour Advance Notice Auto-Approve",
      priority: 10,
      conditions: [
        {
          field: "hours_notice",
          operator: "gte",
          value: 48,
        },
      ],
      actions: [
        {
          type: "auto_approve",
          note: "Approved automatically: 48-hour advance notice requirement met.",
        },
      ],
      isActive: true,
    },
  },
  "late-penalty-10": {
    id: "late-penalty-10",
    name: "Late Assignment 10% Penalty Policy",
    description: "Accepts submissions within 24 hours late with an automated 10% grade penalty.",
    policy: {
      policyType: "late_assignment",
      name: "Standard 24h Late Submission (10% Penalty)",
      priority: 15,
      conditions: [
        {
          field: "hours_late",
          operator: "lte",
          value: 24,
        },
      ],
      actions: [
        {
          type: "apply_penalty",
          penaltyPercent: 10,
          note: "Late submission accepted with standard 10% syllabus penalty.",
        },
      ],
      isActive: true,
    },
  },
  "regrade-rubric": {
    id: "regrade-rubric",
    name: "Rubric-Specific Regrade Policy",
    description: "Requires students to cite specific rubric discrepancies before regrade is reviewed.",
    policy: {
      policyType: "regrade",
      name: "Rubric Criterion Requirement",
      priority: 20,
      conditions: [
        {
          field: "rubric_item_specified",
          operator: "equals",
          value: true,
        },
      ],
      actions: [
        {
          type: "manual_review",
          note: "Queued for professor/TA review: specific rubric criterion cited.",
        },
      ],
      isActive: true,
    },
  },
  "absence-official": {
    id: "absence-official",
    name: "University-Approved Absence Policy",
    description: "Automatically verifies approved university events, athletics, and civic duties.",
    policy: {
      policyType: "absence",
      name: "Official Absence Auto-Verify",
      priority: 10,
      conditions: [
        {
          field: "official_reason",
          operator: "in",
          value: ["athletics", "civic_duty", "religious_observance", "university_sponsored"],
        },
      ],
      actions: [
        {
          type: "auto_approve",
          note: "Approved: Official university absence documentation verified.",
        },
      ],
      isActive: true,
    },
  },
  "meeting-async": {
    id: "meeting-async",
    name: "Meeting Pre-Screening Policy",
    description: "Requires students to provide an agenda and verifies matter cannot be resolved asynchronously.",
    policy: {
      policyType: "meeting",
      name: "Office Hours Agenda Filter",
      priority: 25,
      conditions: [
        {
          field: "has_agenda",
          operator: "equals",
          value: true,
        },
        {
          field: "can_resolve_async",
          operator: "equals",
          value: false,
        },
      ],
      actions: [
        {
          type: "manual_review",
          note: "Meeting request queued: student confirmed agenda and async review necessity.",
        },
      ],
      isActive: true,
    },
  },
  "missing-grade-14d": {
    id: "missing-grade-14d",
    name: "Missing Grade Inquiry Policy",
    description: "Routes missing-grade queries submitted within 14 days of exam return to grader review.",
    policy: {
      policyType: "missing_grade",
      name: "14-Day Post-Exam Grade Audit",
      priority: 30,
      conditions: [
        {
          field: "days_since_return",
          operator: "lte",
          value: 14,
        },
      ],
      actions: [
        {
          type: "route_to_ta",
          note: "Routed to course grader: missing grade inquiry within 14-day window.",
        },
      ],
      isActive: true,
    },
  },
};

export function getPolicyTemplates(): PolicyTemplate[] {
  return Object.values(SEED_POLICY_TEMPLATES);
}

export function getPolicyTemplateById(id: string): PolicyTemplate | undefined {
  return SEED_POLICY_TEMPLATES[id];
}
