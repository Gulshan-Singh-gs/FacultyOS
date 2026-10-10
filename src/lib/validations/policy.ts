import { z } from "zod";

export const PolicyTypeSchema = z.enum([
  "extension",
  "late_assignment",
  "regrade",
  "absence",
  "meeting",
  "missing_grade",
  "recommendation_letter",
  "academic_integrity",
  "other",
]);

export type PolicyType = z.infer<typeof PolicyTypeSchema>;

export const ConditionOperatorSchema = z.enum([
  "equals",
  "not_equals",
  "gt",
  "gte",
  "lt",
  "lte",
  "in",
  "contains",
  "exists",
  "does_not_exist",
]);

export const PolicyConditionSchema = z.object({
  field: z.string().min(1, "Field name is required").max(64),
  operator: ConditionOperatorSchema,
  value: z
    .union([z.string(), z.number(), z.boolean(), z.array(z.string())])
    .optional(),
});

export type PolicyCondition = z.infer<typeof PolicyConditionSchema>;

export const PolicyActionSchema = z.object({
  type: z.enum([
    "auto_approve",
    "auto_deny",
    "manual_review",
    "require_info",
    "apply_penalty",
    "send_template",
    "route_to_ta",
  ]),
  penaltyPercent: z.number().int().min(0).max(100).optional(),
  templateId: z.string().optional(),
  note: z.string().max(500).optional(),
});

export type PolicyAction = z.infer<typeof PolicyActionSchema>;

export const PolicySchema = z.object({
  policyType: PolicyTypeSchema,
  name: z.string().min(3, "Policy name must be at least 3 characters").max(120),
  priority: z.number().int().min(1).max(999).default(100),
  conditions: z.array(PolicyConditionSchema).min(1, "At least one condition is required").max(12),
  actions: z.array(PolicyActionSchema).min(1, "At least one action is required").max(6),
  isActive: z.boolean().default(true),
});

export type PolicyInput = z.infer<typeof PolicySchema>;

export const CreatePolicyInputSchema = PolicySchema.extend({
  courseId: z.string().min(1, "Course ID is required"),
});

export type CreatePolicyInput = z.infer<typeof CreatePolicyInputSchema>;

export const UpdatePolicyInputSchema = z.object({
  policyId: z.string().min(1, "Policy ID is required"),
  policyType: PolicyTypeSchema.optional(),
  name: z.string().min(3).max(120).optional(),
  priority: z.number().int().min(1).max(999).optional(),
  conditions: z.array(PolicyConditionSchema).min(1).max(12).optional(),
  actions: z.array(PolicyActionSchema).min(1).max(6).optional(),
  isActive: z.boolean().optional(),
});

export type UpdatePolicyInput = z.infer<typeof UpdatePolicyInputSchema>;

export const PolicySnapshotSchema = z.object({
  policyId: z.string(),
  policyType: PolicyTypeSchema,
  name: z.string(),
  priority: z.number().int(),
  version: z.number().int(),
  conditions: z.array(PolicyConditionSchema),
  actions: z.array(PolicyActionSchema),
  capturedAt: z.number().int(),
});

export type PolicySnapshot = z.infer<typeof PolicySnapshotSchema>;

export const SeedPoliciesInputSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
  templateIds: z.array(z.string()).min(1, "Select at least one policy template"),
});

export type SeedPoliciesInput = z.infer<typeof SeedPoliciesInputSchema>;
