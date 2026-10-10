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

export type ReasonCategory = z.infer<typeof ReasonCategorySchema>;

export const BaseExtensionRequestSchema = z.object({
  requestType: z.literal("extension").optional().default("extension"),
  studentName: z.string().min(2, "Name must be at least 2 characters.").max(100),
  studentEmail: z.string().email("Please provide a valid email address.").max(254),
  assignmentName: z.string().min(3, "Assignment name must be at least 3 characters.").max(200),
  currentDeadline: z.coerce.date(),
  requestedNewDeadline: z.coerce.date(),
  reasonCategory: ReasonCategorySchema,
  details: z.string().min(20, "Please provide at least 20 characters of detail.").max(5000),
  hasDocumentation: z.boolean().default(false),
  turnstileToken: z.string().min(1, "Bot verification required."),
});

export const ExtensionRequestSchema = BaseExtensionRequestSchema.refine(
  (d) => d.requestedNewDeadline > d.currentDeadline,
  {
    message: "Requested deadline must be after the current deadline.",
    path: ["requestedNewDeadline"],
  },
);

export type ExtensionRequestInput = z.infer<typeof ExtensionRequestSchema>;

export const RegradeRequestSchema = z.object({
  requestType: z.literal("regrade").optional().default("regrade"),
  studentName: z.string().min(2, "Name must be at least 2 characters.").max(100),
  studentEmail: z.string().email("Please provide a valid email address.").max(254),
  assignmentName: z.string().min(3, "Assignment name must be at least 3 characters.").max(200),
  currentGrade: z.string().min(1, "Current grade is required.").max(50),
  rubricItemCitation: z
    .string()
    .min(3, "Rubric item citation is required (cite the specific grading criterion).")
    .max(300),
  studentWorkQuote: z.string().min(5, "Quote from your submitted work is required.").max(3000),
  professorFeedbackQuote: z
    .string()
    .min(5, "Quote from grader/professor feedback is required.")
    .max(3000),
  justification: z
    .string()
    .min(100, "Justification must be at least 100 characters explaining the grading discrepancy.")
    .max(5000),
  turnstileToken: z.string().min(1, "Bot verification required."),
});

export type RegradeRequestInput = z.infer<typeof RegradeRequestSchema>;

export const AbsenceRequestSchema = z.object({
  requestType: z.literal("absence").optional().default("absence"),
  studentName: z.string().min(2, "Name must be at least 2 characters.").max(100),
  studentEmail: z.string().email("Please provide a valid email address.").max(254),
  dates: z.string().min(2, "Please specify date(s) of absence.").max(200),
  reasonCategory: z.enum([
    "university_approved_absence",
    "varsity_athletics",
    "religious_observance",
    "civic_duty",
    "family_emergency_non_medical",
    "academic_conflict",
    "other",
  ]),
  details: z.string().min(10, "Please describe the reason for absence.").max(5000),
  hasDocumentation: z.boolean().default(false),
  turnstileToken: z.string().min(1, "Bot verification required."),
});

export type AbsenceRequestInput = z.infer<typeof AbsenceRequestSchema>;

export const MeetingRequestSchema = z.object({
  requestType: z.literal("meeting").optional().default("meeting"),
  studentName: z.string().min(2, "Name must be at least 2 characters.").max(100),
  studentEmail: z.string().email("Please provide a valid email address.").max(254),
  purpose: z.string().min(3, "Please specify the meeting purpose.").max(200),
  agenda: z.string().min(10, "Agenda is required (outline topics to discuss).").max(3000),
  desiredOutcome: z.string().min(5, "Desired outcome is required.").max(2000),
  canBeAsync: z.boolean().default(false),
  preferredDates: z.string().min(3, "Please list your availability / preferred dates.").max(500),
  turnstileToken: z.string().min(1, "Bot verification required."),
});

export type MeetingRequestInput = z.infer<typeof MeetingRequestSchema>;

export const MissingGradeRequestSchema = z.object({
  requestType: z.literal("missing_grade").optional().default("missing_grade"),
  studentName: z.string().min(2, "Name must be at least 2 characters.").max(100),
  studentEmail: z.string().email("Please provide a valid email address.").max(254),
  assignmentName: z.string().min(2, "Assignment or exam name is required.").max(200),
  dateSubmittedOrTaken: z.string().min(2, "Submission/exam date is required.").max(100),
  details: z.string().min(10, "Please provide relevant details.").max(5000),
  turnstileToken: z.string().min(1, "Bot verification required."),
});

export type MissingGradeRequestInput = z.infer<typeof MissingGradeRequestSchema>;

export const OtherRequestSchema = z.object({
  requestType: z.literal("other").optional().default("other"),
  studentName: z.string().min(2, "Name must be at least 2 characters.").max(100),
  studentEmail: z.string().email("Please provide a valid email address.").max(254),
  subject: z.string().min(3, "Subject is required.").max(200),
  reasonCategory: ReasonCategorySchema.default("other"),
  details: z.string().min(20, "Please provide at least 20 characters of detail.").max(5000),
  turnstileToken: z.string().min(1, "Bot verification required."),
});

export type OtherRequestInput = z.infer<typeof OtherRequestSchema>;

export const AnyIntakeRequestSchema = z.union([
  ExtensionRequestSchema,
  RegradeRequestSchema,
  AbsenceRequestSchema,
  MeetingRequestSchema,
  MissingGradeRequestSchema,
  OtherRequestSchema,
]);

export type AnyIntakeRequestInput = z.infer<typeof AnyIntakeRequestSchema>;

/**
 * HARD RULE 1: Strict Attachment Allowlist
 * MIME types allowed: application/pdf, image/png, image/jpeg ONLY.
 * Categories allowed: university_document, athletics_schedule, technical_issue, other_admin ONLY.
 * Medical categories and blocked MIME types must be rejected.
 */
export const ALLOWED_ATTACHMENT_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
] as const;

export type AllowedAttachmentMimeType = (typeof ALLOWED_ATTACHMENT_MIME_TYPES)[number];

export const ALLOWED_ATTACHMENT_CATEGORIES = [
  "university_document",
  "athletics_schedule",
  "technical_issue",
  "other_admin",
] as const;

export type AllowedAttachmentCategory = (typeof ALLOWED_ATTACHMENT_CATEGORIES)[number];

export function isMedicalCategory(category: string): boolean {
  const normalized = category.toLowerCase().trim();
  const medicalKeywords = [
    "med",
    "doctor",
    "physician",
    "health",
    "clinic",
    "hospital",
    "prescription",
    "sick",
    "illness",
    "injury",
    "therapy",
    "psych",
    "mental",
  ];
  return medicalKeywords.some((kw) => normalized.includes(kw));
}

export const AttachmentCategorySchema = z.enum(ALLOWED_ATTACHMENT_CATEGORIES, {
  message:
    "Invalid attachment category. Only university documents, athletic schedules, technical issues, or administrative records are permitted. Medical documents are strictly blocked (Hard Rule 1).",
});

export const AttachmentMetadataSchema = z.object({
  requestId: z.string().min(1, "Request ID is required."),
  category: AttachmentCategorySchema,
  fileName: z.string().min(1, "File name is required.").max(255),
  mimeType: z.enum(ALLOWED_ATTACHMENT_MIME_TYPES, {
    message: "Unsupported file type. Only PDF, PNG, and JPEG files are permitted.",
  }),
  fileSize: z.number().int().positive("File size must be positive."),
});

export type AttachmentMetadataInput = z.infer<typeof AttachmentMetadataSchema>;
