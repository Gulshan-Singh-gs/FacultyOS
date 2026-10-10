import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  ReasonCategorySchema,
  ExtensionRequestSchema,
  RegradeRequestSchema,
  AbsenceRequestSchema,
  MeetingRequestSchema,
  MissingGradeRequestSchema,
  OtherRequestSchema,
} from "@/lib/validations/request";
import { POST } from "@/app/api/public/c/[courseToken]/requests/route";
import { CATEGORIES } from "@/components/portal/category-explorer";

const mockFindFirst = vi.fn();

vi.mock("@/server/db", () => ({
  createDb: () => ({
    query: {
      courses: {
        findFirst: (...args: unknown[]) => mockFindFirst(...args),
      },
      policies: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      studentIdentities: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    },
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue([{ id: "mock_id" }]),
    }),
  }),
}));

describe("T2.5 & T2.6 Student Portal & Intake Validations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Hard Rule 1: Medical & Mental Health Category Rejection", () => {
    it("strictly blocks medical, health, and psychological reason categories", () => {
      const medicalTerms = [
        "medical",
        "doctor_note",
        "illness",
        "mental_health",
        "depression",
        "anxiety",
        "hospitalization",
        "adhd",
        "sick_leave",
      ];

      for (const term of medicalTerms) {
        const result = ReasonCategorySchema.safeParse(term);
        expect(result.success).toBe(false);
      }
    });

    it("accepts valid non-medical categories in the closed taxonomy", () => {
      const allowed = [
        "university_approved_absence",
        "varsity_athletics",
        "religious_observance",
        "civic_duty",
        "family_emergency_non_medical",
        "technical_issue",
        "academic_conflict",
        "documentation_pending",
        "university_support_required",
        "other",
      ];

      for (const cat of allowed) {
        const result = ReasonCategorySchema.safeParse(cat);
        expect(result.success).toBe(true);
      }
    });

    it("rejects extension request with medical category injection", () => {
      const input = {
        studentName: "Alex Student",
        studentEmail: "alex@university.edu",
        assignmentName: "Problem Set 3",
        currentDeadline: new Date("2026-10-20T10:00:00Z"),
        requestedNewDeadline: new Date("2026-10-22T10:00:00Z"),
        reasonCategory: "medical_illness", // Attempted medical injection
        details: "I was sick and have a doctor note from the clinic.",
        hasDocumentation: true,
        turnstileToken: "cf_dummy",
      };

      const result = ExtensionRequestSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe("T2.6: Regrade Form Rubric Citations & Justification", () => {
    it("requires rubricItemCitation and at least 100 chars justification", () => {
      const shortJustificationInput = {
        studentName: "Alex Student",
        studentEmail: "alex@university.edu",
        assignmentName: "Midterm 1",
        currentGrade: "75/100",
        rubricItemCitation: "Section 2.1: Binary Search Tree balance",
        studentWorkQuote: "Line 42: AVL height rotation function implemented",
        professorFeedbackQuote: "-5 points: Tree not balanced after insertion",
        justification: "I think this was graded too harshly. Please give me points.", // Only 58 chars
        turnstileToken: "cf_dummy",
      };

      const result = RegradeRequestSchema.safeParse(shortJustificationInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors;
        expect(errors.justification).toBeDefined();
        expect(errors.justification?.[0]).toContain("100 characters");
      }
    });

    it("rejects regrade form when rubric citation is missing", () => {
      const missingRubricInput = {
        studentName: "Alex Student",
        studentEmail: "alex@university.edu",
        assignmentName: "Midterm 1",
        currentGrade: "75/100",
        rubricItemCitation: "", // Empty citation
        studentWorkQuote: "Line 42: AVL height rotation function implemented",
        professorFeedbackQuote: "-5 points: Tree not balanced after insertion",
        justification:
          "My implementation accurately preserves the balance invariant according to the standard textbook definition shown in lecture 4, and tests pass for every rotation edge case.",
        turnstileToken: "cf_dummy",
      };

      const result = RegradeRequestSchema.safeParse(missingRubricInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.rubricItemCitation).toBeDefined();
      }
    });

    it("accepts complete regrade request meeting all criteria", () => {
      const validInput = {
        studentName: "Alex Student",
        studentEmail: "alex@university.edu",
        assignmentName: "Midterm 1",
        currentGrade: "75/100",
        rubricItemCitation: "Criterion 3: Deterministic O(log n) time complexity",
        studentWorkQuote: "def find_kth(node, k): ... while loop traversal",
        professorFeedbackQuote: "Deducted 5 marks: time complexity analysis incomplete",
        justification:
          "My solution strictly maintains a balanced tree height with O(log n) bound on depth. The loop terminates after at most h steps where h = ceil(log2(n)), which satisfies Criterion 3 exactly.",
        turnstileToken: "cf_dummy",
      };

      const result = RegradeRequestSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });
  });

  describe("T2.6: Extension and Absence Deadline Ordering", () => {
    it("enforces requestedNewDeadline > currentDeadline on extensions", () => {
      const invalidDates = {
        studentName: "Alex Student",
        studentEmail: "alex@university.edu",
        assignmentName: "Final Project",
        currentDeadline: new Date("2026-10-25T12:00:00Z"),
        requestedNewDeadline: new Date("2026-10-24T12:00:00Z"), // Earlier than current
        reasonCategory: "academic_conflict",
        details: "Overlapping exam schedule with Physics midterm.",
        hasDocumentation: false,
        turnstileToken: "cf_dummy",
      };

      const result = ExtensionRequestSchema.safeParse(invalidDates);
      expect(result.success).toBe(false);
    });

    it("validates absence, meeting, and missing grade schemas", () => {
      const validAbsence = AbsenceRequestSchema.safeParse({
        studentName: "Jordan Lee",
        studentEmail: "jordan@university.edu",
        dates: "2026-11-02 to 2026-11-04",
        reasonCategory: "varsity_athletics",
        details: "National intercollegiate swimming championship travel and finals.",
        hasDocumentation: true,
        turnstileToken: "cf_dummy",
      });
      expect(validAbsence.success).toBe(true);

      const validMeeting = MeetingRequestSchema.safeParse({
        studentName: "Jordan Lee",
        studentEmail: "jordan@university.edu",
        purpose: "Senior Thesis Consultation",
        agenda: "1. Dataset selection criteria\n2. Baseline model evaluation\n3. Research timeline",
        desiredOutcome: "Approval on methodology approach",
        canBeAsync: true,
        preferredDates: "Wednesday 2-4 PM",
        turnstileToken: "cf_dummy",
      });
      expect(validMeeting.success).toBe(true);

      const validMissingGrade = MissingGradeRequestSchema.safeParse({
        studentName: "Jordan Lee",
        studentEmail: "jordan@university.edu",
        assignmentName: "Quiz 3 - Graph Algorithms",
        dateSubmittedOrTaken: "2026-10-08",
        details: "Submitted via LMS with confirmation receipt #99214.",
        turnstileToken: "cf_dummy",
      });
      expect(validMissingGrade.success).toBe(true);

      const validOther = OtherRequestSchema.safeParse({
        studentName: "Jordan Lee",
        studentEmail: "jordan@university.edu",
        subject: "Audit grading inquiry",
        reasonCategory: "other",
        details: "Inquiring about syllabus policies regarding course audit vs letter grade credit.",
        turnstileToken: "cf_dummy",
      });
      expect(validOther.success).toBe(true);
    });
  });

  describe("Category Explorer Mappings", () => {
    it("has 4 categories mapping to student request workflows", () => {
      expect(CATEGORIES).toHaveLength(4);
      const ids = CATEGORIES.map((c) => c.id);
      expect(ids).toEqual(["highlights", "cultural", "tech", "athletics"]);

      const tech = CATEGORIES.find((c) => c.id === "tech");
      expect(tech?.mappedRequestType).toBe("extension");

      const cultural = CATEGORIES.find((c) => c.id === "cultural");
      expect(cultural?.mappedRequestType).toBe("absence");

      const athletics = CATEGORIES.find((c) => c.id === "athletics");
      expect(athletics?.mappedRequestType).toBe("absence");
    });
  });

  describe("Integration: Public Request API & Invalid Token 404 Path", () => {
    it("returns 404 when course token is invalid or does not exist", async () => {
      const mockEnv = {
        DB: {
          prepare: vi.fn(),
        },
        RATE_LIMIT: {
          get: vi.fn().mockResolvedValue("0"),
          put: vi.fn().mockResolvedValue(undefined),
        },
        NOTIFICATIONS: {
          send: vi.fn(),
        },
      };

      const originalEnv = process.env;
      process.env = { ...originalEnv, ...mockEnv } as any;

      mockFindFirst.mockResolvedValueOnce(null);

      const req = new Request("http://localhost/api/public/c/invalid_token_123/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestType: "extension",
          studentName: "Taylor Swift",
          studentEmail: "taylor@university.edu",
          assignmentName: "Lab 4",
          currentDeadline: new Date(Date.now() + 100000).toISOString(),
          requestedNewDeadline: new Date(Date.now() + 200000).toISOString(),
          reasonCategory: "academic_conflict",
          details: "Conflict with another exam in CS201.",
          hasDocumentation: false,
          turnstileToken: "token_verified",
        }),
      });

      const res = await POST(req, {
        params: Promise.resolve({ courseToken: "invalid_token_123" }),
      });

      expect(res.status).toBe(404);
      const json = (await res.json()) as { error?: string };
      expect(json.error).toBe("Course not found.");

      process.env = originalEnv;
    });

    it("returns 404 when course is archived", async () => {
      const mockEnv = {
        DB: { prepare: vi.fn() },
        RATE_LIMIT: {
          get: vi.fn().mockResolvedValue("0"),
          put: vi.fn().mockResolvedValue(undefined),
        },
        NOTIFICATIONS: { send: vi.fn() },
      };

      const originalEnv = process.env;
      process.env = { ...originalEnv, ...mockEnv } as any;

      mockFindFirst.mockResolvedValueOnce({
        id: "crs_archived",
        status: "archived", // Archived course must be rejected
      });

      const req = new Request("http://localhost/api/public/c/archived_token/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestType: "extension",
          studentName: "Taylor Swift",
          studentEmail: "taylor@university.edu",
          assignmentName: "Lab 4",
          currentDeadline: new Date(Date.now() + 100000).toISOString(),
          requestedNewDeadline: new Date(Date.now() + 200000).toISOString(),
          reasonCategory: "academic_conflict",
          details: "Conflict with another exam in CS201.",
          hasDocumentation: false,
          turnstileToken: "token_verified",
        }),
      });

      const res = await POST(req, {
        params: Promise.resolve({ courseToken: "archived_token" }),
      });

      expect(res.status).toBe(404);
      const json = (await res.json()) as { error?: string };
      expect(json.error).toBe("Course not found.");

      process.env = originalEnv;
    });
  });
});
