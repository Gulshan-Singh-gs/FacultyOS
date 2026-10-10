import { describe, expect, it } from "vitest";
import { evaluatePolicies, deriveStatus } from "@/server/services/policy-engine/engine";
import type { Policy, RequestPayload } from "@/server/services/policy-engine/types";

const policy = (over: Partial<Policy>): Policy => ({
  id: "p1",
  policyType: "extension",
  priority: 10,
  conditions: [],
  actions: [{ type: "manual_review" }],
  version: 1,
  isActive: true,
  ...over,
});

describe("Deterministic Policy Engine", () => {
  it("auto-approves documented early extensions", () => {
    const policies = [
      policy({
        conditions: [
          { field: "hasDocumentation", operator: "equals", value: true },
          { field: "daysBeforeDeadline", operator: "gte", value: 2 },
        ],
        actions: [{ type: "auto_approve" }],
      }),
    ];
    const payload: RequestPayload = {
      requestType: "extension",
      hasDocumentation: true,
      daysBeforeDeadline: 3,
    };
    const result = evaluatePolicies(policies, payload);
    expect(result.status).toBe("auto_approved");
    expect(result.matchedPolicyId).toBe("p1");
  });

  it("applies penalty + manual review for late requests", () => {
    const policies = [
      policy({
        priority: 20,
        conditions: [{ field: "daysBeforeDeadline", operator: "lt", value: 2 }],
        actions: [
          { type: "apply_penalty", penaltyPercent: 10 },
          { type: "manual_review" },
        ],
      }),
    ];
    const payload: RequestPayload = {
      requestType: "extension",
      daysBeforeDeadline: 0.5,
    };
    const result = evaluatePolicies(policies, payload);
    expect(result.status).toBe("manual_review");
    expect(result.actions).toContainEqual({
      type: "apply_penalty",
      penaltyPercent: 10,
    });
  });

  it("respects priority ordering", () => {
    const policies = [
      policy({ id: "low", priority: 50, conditions: [], actions: [{ type: "auto_deny" }] }),
      policy({ id: "high", priority: 5, conditions: [], actions: [{ type: "auto_approve" }] }),
    ];
    const result = evaluatePolicies(policies, { requestType: "extension" });
    expect(result.matchedPolicyId).toBe("high");
  });

  it("falls back to manual review when nothing matches", () => {
    const policies = [
      policy({
        conditions: [
          {
            field: "reasonCategory",
            operator: "equals",
            value: "varsity_athletics",
          },
        ],
        actions: [{ type: "auto_approve" }],
      }),
    ];
    const result = evaluatePolicies(policies, {
      requestType: "extension",
      reasonCategory: "technical_issue",
    });
    expect(result.status).toBe("manual_review");
    expect(result.matchedPolicyId).toBeNull();
  });

  it("HARD RULE 3: academic integrity can never auto-decide", () => {
    const policies = [
      policy({
        id: "integrity",
        policyType: "academic_integrity",
        conditions: [],
        actions: [{ type: "auto_deny" }],
      }),
    ];
    const result = evaluatePolicies(policies, {
      requestType: "academic_integrity",
    });
    expect(result.isHighStakes).toBe(true);
    expect(result.status).toBe("manual_review");
  });

  it("ignores inactive policies", () => {
    const policies = [
      policy({
        isActive: false,
        conditions: [],
        actions: [{ type: "auto_approve" }],
      }),
    ];
    const result = evaluatePolicies(policies, { requestType: "extension" });
    expect(result.status).toBe("manual_review");
  });

  it("deriveStatus maps require_info correctly", () => {
    expect(deriveStatus([{ type: "require_info" }])).toBe("needs_student_info");
  });
});
