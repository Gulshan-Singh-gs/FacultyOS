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
  field: z.string().min(1).max(64),
  operator: ConditionOperatorSchema,
  value: z
    .union([z.string(), z.number(), z.boolean(), z.array(z.string())])
    .optional(),
});

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

export const PolicySchema = z.object({
  policyType: PolicyTypeSchema,
  name: z.string().min(3).max(120),
  priority: z.number().int().min(1).max(999).default(100),
  conditions: z.array(PolicyConditionSchema).min(1).max(12),
  actions: z.array(PolicyActionSchema).min(1).max(6),
});

export type PolicyInput = z.infer<typeof PolicySchema>;
