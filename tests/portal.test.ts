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

const mockFindFirstCourse = vi.fn();
const mockFindManyPolicies = vi.fn();
const mockFindFirstIdentity = vi.fn();
const mockInsertValues = vi.fn().mockResolvedValue([{ id: "mock_id" }]);

vi.mock("@/server/db", () => ({
  createDb: () => ({
    query: {
      courses: {
        findFirst: (...args: unknown[]) => mockFindFirstCourse(...args),
      },
      policies: {
        findMany: (...args: unknown[]) => mockFindManyPolicies(...args),
      },
      studentIdentities: {
        findFirst: (...args: unknown[]) => mockFindFirstIdentity(...args),
      },
    },
    insert: vi.fn().mockReturnValue({
      values: (...args: unknown[]) => mockInsertValues(...args),
    }),
  }),
}));

const mockKvGet = vi.fn();
const mockKvPut = vi.fn();
const mockQueueSend = vi.fn();

const mockEnv = {
  DB: {},
  RATE_LIMIT: {
    get: (...args: unknown[]) => mockKvGet(...args),
    put: (...args: unknown[]) => mockKvPut(...args),
  },
  NOTIFICATIONS: {
    send: (...args: unknown[]) => mockQueueSend(...args),
  },
};

vi.mock("@/server/env", () => ({
  getServerEnv: vi.fn().mockImplementation(() => Promise.resolve(mockEnv)),
}));

describe("T2.7 & T2.8 Student Portal, Intake API & Status Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockKvGet.mockResolvedValue("0");
    mockKvPut.mockResolvedValue(undefined);
    mockQueueSend.mockResolvedValue(undefined);
    mockFindManyPolicies.mockResolvedValue([]);
    mockFindFirstIdentity.mockResolvedValue(null);
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

  describe("T2.7 Public Intake API: Integration Gates", () => {
    it("(a) executes successful auto-approve path when syllabus policy matches", async () => {
      mockFindFirstCourse.mockResolvedValueOnce({
        id: "crs_active_123",
        status: "active",
      });

      // Active extension policy: when daysBeforeDeadline >= 2 -> auto approve
      mockFindManyPolicies.mockResolvedValueOnce([
        {
          id: "pol_ext_auto",
          policyType: "extension",
          priority: 1,
          conditionsJson: JSON.stringify([
            { field: "daysBeforeDeadline", operator: "gte", value: 2 },
          ]),
          actionsJson: JSON.stringify([
            { type: "auto_approve" },
          ]),
          version: 1,
          isActive: true,
        },
      ]);

      const threeDaysAhead = new Date(Date.now() + 3 * 86_400_000);
      const fourDaysAhead = new Date(Date.now() + 4 * 86_400_000);

      const req = new Request("http://localhost/api/public/c/course_token_abc/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestType: "extension",
          studentName: "Maya Lin",
          studentEmail: "maya@university.edu",
          assignmentName: "Problem Set 5",
          currentDeadline: threeDaysAhead.toISOString(),
          requestedNewDeadline: fourDaysAhead.toISOString(),
          reasonCategory: "academic_conflict",
          details: "Midterm overlap with Computer Systems on Thursday.",
          hasDocumentation: false,
          turnstileToken: "cf_verified",
        }),
      });

      const res = await POST(req, {
        params: Promise.resolve({ courseToken: "course_token_abc" }),
      });

      expect(res.status).toBe(201);
      const json = (await res.json()) as { requestToken: string; status: string; message: string };
      expect(json.status).toBe("auto_approved");
      expect(json.message).toContain("approved per course policy");
      expect(json.requestToken).toBeDefined();
      expect(mockQueueSend).toHaveBeenCalledTimes(1);
    });

    it("(b) routes to manual review path when no policy matches", async () => {
      mockFindFirstCourse.mockResolvedValueOnce({
        id: "crs_active_123",
        status: "active",
      });

      // No active policies exist for this course
      mockFindManyPolicies.mockResolvedValueOnce([]);

      const twoDaysAhead = new Date(Date.now() + 2 * 86_400_000);
      const threeDaysAhead = new Date(Date.now() + 3 * 86_400_000);

      const req = new Request("http://localhost/api/public/c/course_token_abc/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestType: "extension",
          studentName: "Maya Lin",
          studentEmail: "maya@university.edu",
          assignmentName: "Problem Set 5",
          currentDeadline: twoDaysAhead.toISOString(),
          requestedNewDeadline: threeDaysAhead.toISOString(),
          reasonCategory: "academic_conflict",
          details: "Midterm overlap with Computer Systems on Thursday.",
          hasDocumentation: false,
          turnstileToken: "cf_verified",
        }),
      });

      const res = await POST(req, {
        params: Promise.resolve({ courseToken: "course_token_abc" }),
      });

      expect(res.status).toBe(201);
      const json = (await res.json()) as { requestToken: string; status: string; message: string };
      expect(json.status).toBe("manual_review");
      expect(json.message).toBe("Your request was submitted for review.");
      expect(mockQueueSend).toHaveBeenCalledTimes(1);
    });

    it("(c1) returns calm 429 when IP rate limit window is exceeded", async () => {
      // Mock IP count >= 10
      mockKvGet.mockImplementation((key: string) => {
        if (typeof key === "string" && key.startsWith("rl:intake:ip:")) {
          return Promise.resolve("10");
        }
        return Promise.resolve("0");
      });

      const req = new Request("http://localhost/api/public/c/course_token_abc/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "cf-connecting-ip": "192.168.1.100",
        },
        body: JSON.stringify({
          requestType: "extension",
          studentName: "Maya Lin",
          studentEmail: "maya@university.edu",
          assignmentName: "Problem Set 5",
          currentDeadline: new Date(Date.now() + 86400000).toISOString(),
          requestedNewDeadline: new Date(Date.now() + 172800000).toISOString(),
          reasonCategory: "academic_conflict",
          details: "Valid details meeting min 20 chars.",
          hasDocumentation: false,
          turnstileToken: "cf_verified",
        }),
      });

      const res = await POST(req, {
        params: Promise.resolve({ courseToken: "course_token_abc" }),
      });

      expect(res.status).toBe(429);
      const json = (await res.json()) as { error?: string };
      expect(json.error).toBe("Too many submissions. Please wait before submitting again.");
    });

    it("(c2) returns calm 429 when course token rate limit window is exceeded", async () => {
      // Mock Course token count >= 30
      mockKvGet.mockImplementation((key: string) => {
        if (typeof key === "string" && key.startsWith("rl:intake:course:")) {
          return Promise.resolve("30");
        }
        return Promise.resolve("0");
      });

      const req = new Request("http://localhost/api/public/c/course_token_abc/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "cf-connecting-ip": "10.0.0.1",
        },
        body: JSON.stringify({
          requestType: "extension",
          studentName: "Maya Lin",
          studentEmail: "maya@university.edu",
          assignmentName: "Problem Set 5",
          currentDeadline: new Date(Date.now() + 86400000).toISOString(),
          requestedNewDeadline: new Date(Date.now() + 172800000).toISOString(),
          reasonCategory: "academic_conflict",
          details: "Valid details meeting min 20 chars.",
          hasDocumentation: false,
          turnstileToken: "cf_verified",
        }),
      });

      const res = await POST(req, {
        params: Promise.resolve({ courseToken: "course_token_abc" }),
      });

      expect(res.status).toBe(429);
      const json = (await res.json()) as { error?: string };
      expect(json.error).toBe("Too many submissions. Please wait before submitting again.");
    });

    it("(d1) returns 404 when course token is invalid or does not exist", async () => {
      mockFindFirstCourse.mockResolvedValueOnce(null);

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
    });

    it("(d2) returns 404 when course is archived", async () => {
      mockFindFirstCourse.mockResolvedValueOnce({
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
    });
  });
});
