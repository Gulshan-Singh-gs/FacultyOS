import type {
  EvaluationResult,
  Policy,
  PolicyAction,
  PolicyCondition,
  RequestPayload,
  RequestStatus,
} from "./types";

/**
 * HARD RULE 3: these request types can NEVER be auto-decided.
 * `academic_integrity` requests always force manual_review.
 */
const HIGH_STAKES_TYPES = new Set(["academic_integrity"]);

/**
 * Evaluates an ordered set of active policies against a student request payload.
 *
 * Policies are sorted by ascending priority (lower number = higher priority).
 * First matching policy wins. If nothing matches, falls back to manual_review.
 *
 * AI output NEVER calls this function — this is deterministic-only (Hard Rule 2).
 */
export function evaluatePolicies(
  policies: Policy[],
  payload: RequestPayload,
): EvaluationResult {
  const candidates = policies
    .filter((p) => p.isActive && p.policyType === payload.requestType)
    .sort((a, b) => a.priority - b.priority);

  for (const policy of candidates) {
    const matched = policy.conditions.every((c) =>
      matchesCondition(c, payload),
    );
    if (!matched) continue;

    const actions = enforceGuardrails(payload, policy.actions);
    return {
      matchedPolicyId: policy.id,
      matchedPolicyVersion: policy.version,
      actions,
      reasons: policy.conditions.map((c) => describeCondition(c)),
      isHighStakes: HIGH_STAKES_TYPES.has(payload.requestType),
      status: deriveStatus(actions),
    };
  }

  // Default-safe fallback: nothing matched → human looks at it.
  return {
    matchedPolicyId: null,
    matchedPolicyVersion: null,
    actions: [{ type: "manual_review" }],
    reasons: ["No active policy matched. Routed to manual review by default."],
    isHighStakes: HIGH_STAKES_TYPES.has(payload.requestType),
    status: "manual_review",
  };
}

/**
 * HARD RULE 3: For high-stakes request types, replace any auto_approve/auto_deny
 * actions with manual_review. This cannot be overridden by any policy.
 */
function enforceGuardrails(
  payload: RequestPayload,
  actions: PolicyAction[],
): PolicyAction[] {
  if (!HIGH_STAKES_TYPES.has(payload.requestType)) return actions;
  return actions.map((a) =>
    a.type === "auto_approve" || a.type === "auto_deny"
      ? { ...a, type: "manual_review" as const }
      : a,
  );
}

/** Derives the canonical RequestStatus from the winning action set. */
export function deriveStatus(actions: PolicyAction[]): RequestStatus {
  if (actions.some((a) => a.type === "auto_approve")) return "auto_approved";
  if (actions.some((a) => a.type === "auto_deny")) return "auto_denied";
  if (actions.some((a) => a.type === "require_info"))
    return "needs_student_info";
  return "manual_review";
}

function matchesCondition(
  c: PolicyCondition,
  payload: RequestPayload,
): boolean {
  const actual = payload[c.field];

  switch (c.operator) {
    case "exists":
      return actual !== undefined && actual !== null && actual !== "";
    case "does_not_exist":
      return actual === undefined || actual === null || actual === "";
    case "equals":
      return actual === c.value;
    case "not_equals":
      return actual !== c.value;
    case "gt":
      return (
        typeof actual === "number" &&
        typeof c.value === "number" &&
        actual > c.value
      );
    case "gte":
      return (
        typeof actual === "number" &&
        typeof c.value === "number" &&
        actual >= c.value
      );
    case "lt":
      return (
        typeof actual === "number" &&
        typeof c.value === "number" &&
        actual < c.value
      );
    case "lte":
      return (
        typeof actual === "number" &&
        typeof c.value === "number" &&
        actual <= c.value
      );
    case "in":
      return (
        Array.isArray(c.value) &&
        typeof actual === "string" &&
        c.value.includes(actual)
      );
    case "contains":
      return (
        typeof actual === "string" &&
        typeof c.value === "string" &&
        actual.toLowerCase().includes(c.value.toLowerCase())
      );
    default:
      return false;
  }
}

function describeCondition(c: PolicyCondition): string {
  return `${c.field} ${c.operator} ${c.value === undefined ? "" : String(c.value)}`.trim();
}
