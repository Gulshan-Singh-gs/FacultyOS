import type { z } from "zod";
import type {
  PolicyConditionSchema,
  PolicyActionSchema,
  PolicyTypeSchema,
} from "@/lib/validations/policy";

export type PolicyCondition = z.infer<typeof PolicyConditionSchema>;
export type PolicyAction = z.infer<typeof PolicyActionSchema>;
export type PolicyType = z.infer<typeof PolicyTypeSchema>;

export interface Policy {
  id: string;
  policyType: PolicyType;
  priority: number;
  conditions: PolicyCondition[];
  actions: PolicyAction[];
  version: number;
  isActive: boolean;
}

export type RequestPayload = Record<string, unknown> & {
  requestType: PolicyType;
};

export type RequestStatus =
  | "submitted"
  | "auto_approved"
  | "auto_denied"
  | "manual_review"
  | "needs_student_info";

export interface EvaluationResult {
  matchedPolicyId: string | null;
  matchedPolicyVersion: number | null;
  actions: PolicyAction[];
  reasons: string[];
  isHighStakes: boolean;
  status: RequestStatus;
}
