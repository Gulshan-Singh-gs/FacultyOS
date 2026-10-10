import { z } from "zod";

export const CreateCourseSchema = z.object({
  courseCode: z
    .string()
    .trim()
    .min(2, "Course code must be at least 2 characters")
    .max(20, "Course code must be at most 20 characters")
    .transform((val) => val.toUpperCase()),
  courseName: z
    .string()
    .trim()
    .min(3, "Course name must be at least 3 characters")
    .max(100, "Course name must be at most 100 characters"),
  term: z
    .string()
    .trim()
    .min(2, "Term must be at least 2 characters")
    .max(50, "Term must be at most 50 characters"),
  syllabusText: z
    .string()
    .max(50000, "Syllabus text exceeds maximum length")
    .optional(),
});

export type CreateCourseInput = z.infer<typeof CreateCourseSchema>;

export const RotateTokenSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
});
