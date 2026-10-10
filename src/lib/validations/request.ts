import { z } from "zod";

/**
 * HARD RULE 1: No medical or mental-health data may enter FacultyOS.
 * The enum below is the ONLY allowed reason taxonomy.
 * Health-related reasons must be mapped to `university_support_required` in the UI.
 */
export const ReasonCategorySchema = z.enum([
  "university_approved_absence",
  "varsity_athletics",
  "religious_observance",
  "civic_duty",
  "family_emergency_non_medical",
  "technical_issue",
  "academic_conflict",
  "documentation_pending",
  "university_support_required", // set by UI when student selects health-related reason
  "other",
]);

export const ExtensionRequestSchema = z
  .object({
    studentName: z.string().min(2).max(100),
    studentEmail: z.string().email().max(254),
    assignmentName: z.string().min(3).max(200),
    currentDeadline: z.coerce.date(),
    requestedNewDeadline: z.coerce.date(),
    reasonCategory: ReasonCategorySchema,
    details: z.string().min(20).max(5000),
    hasDocumentation: z.boolean(),
    turnstileToken: z.string().min(1),
  })
  .refine((d) => d.requestedNewDeadline > d.currentDeadline, {
    message: "Requested deadline must be after the current deadline.",
    path: ["requestedNewDeadline"],
  });

export type ExtensionRequestInput = z.infer<typeof ExtensionRequestSchema>;
