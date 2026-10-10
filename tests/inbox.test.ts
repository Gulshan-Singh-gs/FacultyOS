import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getInboxRequestsForProfile,
  getRequestDetailWithOwnership,
  updateProfessorNotesInternal,
  updateRequestStatusActionInternal,
  RequestAccessError,
} from "@/server/services/requests";
import type { Db } from "@/server/db";

function createMockInboxDb(initialData: {
  courses?: any[];
  requests?: any[];
  studentIdentities?: any[];
  policies?: any[];
  requestEvents?: any[];
  attachments?: any[];
} = {}) {
  const coursesStore = [...(initialData.courses || [])];
  const requestsStore = [...(initialData.requests || [])];
  const identitiesStore = [...(initialData.studentIdentities || [])];
  const policiesStore = [...(initialData.policies || [])];
  const eventsStore = [...(initialData.requestEvents || [])];
  const attachmentsStore = [...(initialData.attachments || [])];

  const mockDb = {
    select: vi.fn().mockImplementation((selection?: any) => ({
      from: vi.fn().mockImplementation((table: any) => {
        // If complex query with joins (in getInboxRequestsForProfile)
        return {
          innerJoin: vi.fn().mockImplementation(() => ({
            leftJoin: vi.fn().mockImplementation(() => ({
              leftJoin: vi.fn().mockImplementation(() => ({
                where: vi.fn().mockImplementation((whereClause: any) => ({
                  orderBy: vi.fn().mockImplementation(() => {
                    // Filter courses owned by profileId
                    return Promise.resolve(
                      requestsStore.map((r) => {
                        const course = coursesStore.find((c) => c.id === r.courseId);
                        const ident = identitiesStore.find((i) => i.id === r.studentIdentityId);
                        const pol = policiesStore.find((p) => p.id === r.matchedPolicyId);
                        return {
                          id: r.id,
                          publicToken: r.publicToken,
                          courseId: r.courseId,
                          courseCode: course?.courseCode || "CS101",
                          courseName: course?.courseName || "Intro CS",
                          requestType: r.requestType,
                          status: r.status,
                          priority: r.priority || "standard",
                          studentDisplayLabel: ident?.displayLabel || "Student #101",
                          matchedPolicyName: pol?.name || null,
                          matchedPolicyVersion: r.matchedPolicyVersion || null,
                          createdAt: r.createdAt || new Date(),
                          penaltyPercent: r.penaltyPercent || null,
                          assignedToUserId: r.assignedToUserId || null,
                        };
                      }),
                    );
                  }),
                })),
              })),
            })),
          })),
          // Direct table select (e.g. in getRequestDetailWithOwnership)
          where: vi.fn().mockImplementation((whereClause: any) => ({
            limit: vi.fn().mockImplementation((limitNum: number) => {
              if (table && table._ && table._.name === "requests") {
                return Promise.resolve(requestsStore.slice(0, limitNum));
              }
              if (table && table._ && table._.name === "courses") {
                return Promise.resolve(coursesStore.slice(0, limitNum));
              }
              if (table && table._ && table._.name === "student_identities") {
                return Promise.resolve(identitiesStore.slice(0, limitNum));
              }
              if (table && table._ && table._.name === "policies") {
                return Promise.resolve(policiesStore.slice(0, limitNum));
              }
              return Promise.resolve(requestsStore.slice(0, limitNum));
            }),
            orderBy: vi.fn().mockImplementation(() => {
              return Promise.resolve(eventsStore);
            }),
            then: (resolve: any) => resolve(attachmentsStore),
          })),
        };
      }),
    })),
    update: vi.fn().mockImplementation(() => ({
      set: vi.fn().mockImplementation((vals: any) => ({
        where: vi.fn().mockImplementation(() => {
          return Promise.resolve([{ updated: true }]);
        }),
      })),
    })),
    insert: vi.fn().mockImplementation(() => ({
      values: vi.fn().mockImplementation((vals: any) => {
        eventsStore.push(vals);
        return Promise.resolve([vals]);
      }),
    })),
    _store: {
      coursesStore,
      requestsStore,
      identitiesStore,
      policiesStore,
      eventsStore,
      attachmentsStore,
    },
  } as unknown as Db;

  return mockDb;
}

describe("T2.9 & T2.10 Professor Inbox & Request Detail", () => {
  describe("Security: IDOR Protection on Request Detail (Hard Rule 5)", () => {
    it("strictly blocks a professor from viewing a request belonging to another professor's course", async () => {
      // Setup: Course owned by "prof_victim"
      const courseVictim = {
        id: "crs_victim_101",
        profileId: "prof_victim",
        courseCode: "CS401",
        courseName: "Advanced Algorithms",
      };

      const requestVictim = {
        id: "req_victim_999",
        courseId: "crs_victim_101",
        studentIdentityId: "ident_1",
        publicToken: "token_abc_123",
        requestType: "extension",
        status: "submitted",
        intakePayloadJson: JSON.stringify({ assignmentName: "Problem Set 4" }),
      };

      // Attacker is "prof_attacker"
      let callCount = 0;
      const db = {
        select: vi.fn().mockImplementation(() => ({
          from: vi.fn().mockImplementation(() => ({
            where: vi.fn().mockImplementation(() => ({
              limit: vi.fn().mockImplementation(() => {
                // Return victim request, then return victim course
                if (callCount === 0) {
                  callCount++;
                  return Promise.resolve([requestVictim]);
                }
                return Promise.resolve([courseVictim]);
              }),
            })),
          })),
        })),
      } as unknown as Db;

      await expect(
        getRequestDetailWithOwnership(db, "prof_attacker", "req_victim_999"),
      ).rejects.toThrow(RequestAccessError);
    });

    it("allows the owner professor to view their own request detail", async () => {
      const courseOwner = {
        id: "crs_owner_101",
        profileId: "prof_owner",
        courseCode: "CS101",
        courseName: "Intro to Computer Science",
      };

      const requestOwner = {
        id: "req_owner_555",
        courseId: "crs_owner_101",
        studentIdentityId: "ident_1",
        publicToken: "token_xyz_789",
        requestType: "extension",
        status: "auto_approved",
        intakePayloadJson: JSON.stringify({
          assignmentName: "Lab 2",
          daysBeforeDeadline: 3,
        }),
        decisionReasonJson: JSON.stringify([
          "Submitted 3 days before deadline, meeting 48-hour notice policy.",
        ]),
        policySnapshotJson: JSON.stringify([{ type: "auto_approve" }]),
        matchedPolicyId: "pol_1",
        matchedPolicyVersion: 2,
      };

      let call = 0;
      const db = {
        select: vi.fn().mockImplementation(() => ({
          from: vi.fn().mockImplementation(() => ({
            where: vi.fn().mockImplementation(() => ({
              limit: vi.fn().mockImplementation(() => {
                call++;
                if (call === 1) return Promise.resolve([requestOwner]);
                if (call === 2) return Promise.resolve([courseOwner]);
                return Promise.resolve([]);
              }),
              orderBy: vi.fn().mockImplementation(() => Promise.resolve([])),
              then: (resolve: any) => resolve([]),
            })),
          })),
        })),
      } as unknown as Db;

      const result = await getRequestDetailWithOwnership(
        db,
        "prof_owner",
        "req_owner_555",
      );

      expect(result.request.id).toBe("req_owner_555");
      expect(result.course.profileId).toBe("prof_owner");
      expect(result.request.status).toBe("auto_approved");
    });
  });

  describe("T2.9 Inbox Queue Classification & Privacy", () => {
    it("partitions requests across the 6 required queues and displays pseudonymous student labels", async () => {
      const mockRequests = [
        {
          id: "req_1",
          courseId: "crs_1",
          requestType: "extension",
          status: "submitted",
          priority: "standard",
          studentIdentityId: "ident_1",
        },
        {
          id: "req_2",
          courseId: "crs_1",
          requestType: "regrade",
          status: "needs_student_info",
          priority: "standard",
        },
        {
          id: "req_3",
          courseId: "crs_1",
          requestType: "extension",
          status: "submitted",
          priority: "urgent", // Urgent queue
        },
        {
          id: "req_4",
          courseId: "crs_1",
          requestType: "absence",
          status: "auto_approved", // Auto-resolved queue
          priority: "standard",
        },
        {
          id: "req_5",
          courseId: "crs_1",
          requestType: "meeting",
          status: "ta_review", // TA review queue
          priority: "standard",
        },
        {
          id: "req_6",
          courseId: "crs_1",
          requestType: "extension",
          status: "closed", // Closed queue
          priority: "standard",
        },
      ];

      const db = createMockInboxDb({
        courses: [{ id: "crs_1", profileId: "prof_1", courseCode: "CS101" }],
        requests: mockRequests,
        studentIdentities: [
          { id: "ident_1", displayLabel: "Student #104 (Pseudonymous)" },
        ],
      });

      const { items, counts } = await getInboxRequestsForProfile(
        db,
        "prof_1",
        "needs_decision",
      );

      expect(counts.needs_decision).toBe(1); // req_1
      expect(counts.needs_student_info).toBe(1); // req_2
      expect(counts.urgent).toBe(1); // req_3
      expect(counts.auto_resolved).toBe(1); // req_4
      expect(counts.ta_review).toBe(1); // req_5
      expect(counts.closed).toBe(1); // req_6
      expect(counts.all).toBe(6);

      // Verify pseudonymous student label is used, not email
      expect(items[0].studentDisplayLabel).toContain("Student #104");
      expect(items[0].studentDisplayLabel).not.toContain("@");
    });
  });

  describe("T2.10 Actions & Notes Mutations with Ownership", () => {
    it("updates professor notes after verifying ownership", async () => {
      let call = 0;
      const db = {
        select: vi.fn().mockImplementation(() => ({
          from: vi.fn().mockImplementation(() => ({
            where: vi.fn().mockImplementation(() => ({
              limit: vi.fn().mockImplementation(() => {
                call++;
                if (call === 1) return Promise.resolve([{ id: "req_1", courseId: "crs_1" }]);
                if (call === 2) return Promise.resolve([{ id: "crs_1", profileId: "prof_owner" }]);
                return Promise.resolve([]);
              }),
              orderBy: vi.fn().mockImplementation(() => Promise.resolve([])),
              then: (resolve: any) => resolve([]),
            })),
          })),
        })),
        update: vi.fn().mockImplementation(() => ({
          set: vi.fn().mockImplementation(() => ({
            where: vi.fn().mockResolvedValue([{ updated: true }]),
          })),
        })),
      } as unknown as Db;

      await expect(
        updateProfessorNotesInternal(
          db,
          "prof_owner",
          "req_1",
          "Confidential: Student spoke in office hours, valid medical accommodation verified by dean.",
        ),
      ).resolves.not.toThrow();

      expect(db.update).toHaveBeenCalledTimes(1);
    });

    it("records audit lifecycle event on status update action", async () => {
      let call = 0;
      const db = {
        select: vi.fn().mockImplementation(() => ({
          from: vi.fn().mockImplementation(() => ({
            where: vi.fn().mockImplementation(() => ({
              limit: vi.fn().mockImplementation(() => {
                call++;
                if (call === 1) return Promise.resolve([{ id: "req_1", courseId: "crs_1", status: "submitted" }]);
                if (call === 2) return Promise.resolve([{ id: "crs_1", profileId: "prof_owner" }]);
                return Promise.resolve([]);
              }),
              orderBy: vi.fn().mockImplementation(() => Promise.resolve([])),
              then: (resolve: any) => resolve([]),
            })),
          })),
        })),
        update: vi.fn().mockImplementation(() => ({
          set: vi.fn().mockImplementation(() => ({
            where: vi.fn().mockResolvedValue([{ updated: true }]),
          })),
        })),
        insert: vi.fn().mockImplementation(() => ({
          values: vi.fn().mockResolvedValue([{ id: "event_1" }]),
        })),
      } as unknown as Db;

      await expect(
        updateRequestStatusActionInternal(
          db,
          "prof_owner",
          "req_1",
          "approved",
          "Granted 48h extension per syllabus policy.",
        ),
      ).resolves.not.toThrow();

      expect(db.update).toHaveBeenCalledTimes(1);
      expect(db.insert).toHaveBeenCalledTimes(1);
    });
  });
});
