import { describe, it, expect, vi } from "vitest";
import {
  updateRequestStatusActionInternal,
  bulkCloseAutoResolvedInternal,
  RequestAccessError,
} from "@/server/services/requests";
import {
  createAttachmentRecord,
  getAttachmentWithOwnership,
} from "@/server/services/attachments";
import {
  isMedicalCategory,
  ALLOWED_ATTACHMENT_CATEGORIES,
  ALLOWED_ATTACHMENT_MIME_TYPES,
} from "@/lib/validations/request";
import { PlanLimitError } from "@/server/services/plan-limits";
import type { Db } from "@/server/db";

function createMockDb(fixtures: {
  courses?: any[];
  requests?: any[];
  professorProfiles?: any[];
  attachments?: any[];
  requestEvents?: any[];
} = {}) {
  const coursesStore = [...(fixtures.courses || [])];
  const requestsStore = [...(fixtures.requests || [])];
  const profilesStore = [...(fixtures.professorProfiles || [])];
  const attachmentsStore = [...(fixtures.attachments || [])];
  const eventsStore = [...(fixtures.requestEvents || [])];

  let directSelectCount = 0;

  const mockDb = {
    _stores: { coursesStore, requestsStore, profilesStore, attachmentsStore, eventsStore },
    select: vi.fn().mockImplementation(() => ({
      from: vi.fn().mockImplementation(() => {
        return {
          // Double innerJoin: createAttachmentRecord or getAttachmentWithOwnership
          innerJoin: vi.fn().mockImplementation(() => ({
            innerJoin: vi.fn().mockImplementation(() => ({
              where: vi.fn().mockImplementation(() => ({
                limit: vi.fn().mockImplementation(() => {
                  // For getAttachmentWithOwnership:
                  if (attachmentsStore.length > 0) {
                    const att = attachmentsStore[0];
                    const req = requestsStore.find((r) => r.id === att.requestId);
                    const c = coursesStore.find((co) => co.id === req?.courseId);
                    return Promise.resolve([
                      {
                        attachment: att,
                        request: req,
                        course: c,
                      },
                    ]);
                  }
                  // For createAttachmentRecord:
                  const r = requestsStore[0];
                  const c = coursesStore.find((co) => co.id === r?.courseId);
                  const p = profilesStore.find((pr) => pr.id === c?.profileId);
                  return Promise.resolve([
                    {
                      requestId: r?.id,
                      courseId: r?.courseId,
                      profileId: c?.profileId,
                      plan: p?.plan || "free",
                    },
                  ]);
                }),
              })),
            })),
            // Single innerJoin: bulkCloseAutoResolvedInternal
            where: vi.fn().mockImplementation(() => {
              const rows = requestsStore.map((r) => {
                const c = coursesStore.find((co) => co.id === r.courseId);
                return {
                  requestId: r.id,
                  courseProfileId: c?.profileId,
                  status: r.status,
                };
              });
              return Promise.resolve(rows);
            }),
          })),
          // Direct table select (e.g. sequential in getRequestDetailWithOwnership)
          where: vi.fn().mockImplementation(() => ({
            limit: vi.fn().mockImplementation(() => {
              directSelectCount++;
              // 1st call: request
              if (directSelectCount % 2 === 1) {
                return Promise.resolve(requestsStore.slice(0, 1));
              }
              // 2nd call: course
              const req = requestsStore[0];
              const c = coursesStore.find((co) => co.id === req?.courseId);
              return Promise.resolve(c ? [c] : coursesStore.slice(0, 1));
            }),
            orderBy: vi.fn().mockImplementation(() => Promise.resolve(eventsStore)),
            then: (resolve: any) => resolve(attachmentsStore),
          })),
        };
      }),
    })),
    update: vi.fn().mockImplementation(() => ({
      set: vi.fn().mockImplementation((vals: any) => ({
        where: vi.fn().mockImplementation(() => {
          if (requestsStore.length > 0 && vals.status) {
            requestsStore.forEach((r) => {
              r.status = vals.status;
              if (vals.professorNotes !== undefined) {
                r.professorNotes = vals.professorNotes;
              }
            });
          }
          return Promise.resolve([{ updated: true }]);
        }),
      })),
    })),
    insert: vi.fn().mockImplementation(() => ({
      values: vi.fn().mockImplementation((vals: any) => {
        if (vals.fileName !== undefined) {
          attachmentsStore.push(vals);
        } else {
          eventsStore.push(vals);
        }
        return Promise.resolve([vals]);
      }),
    })),
  };


  return mockDb as unknown as Db & { _stores: typeof mockDb._stores };
}

describe("T2.11 — Decision Actions & Audit Trail", () => {
  it("executes valid decision transitions and logs audit events", async () => {
    const db = createMockDb({
      courses: [{ id: "c-101", profileId: "prof-alice", courseCode: "CS101" }],
      requests: [{ id: "req-1", courseId: "c-101", status: "submitted", priority: "standard" }],
    });

    // 1. Approve transition
    const approveRes = await updateRequestStatusActionInternal(
      db,
      "prof-alice",
      "req-1",
      "approve",
      "Met all advance notice criteria",
    );

    expect(approveRes.newStatus).toBe("approved");
    expect(approveRes.eventType).toBe("professor_approved");

    const events = db._stores.eventsStore;
    expect(events).toHaveLength(1);
    expect(events[0].eventType).toBe("professor_approved");
    expect(events[0].actorType).toBe("professor");
    const payload = JSON.parse(events[0].payloadJson);
    expect(payload.notes).toBe("Met all advance notice criteria");
  });

  it("HR5: blocks cross-profile decision mutations (IDOR Protection)", async () => {
    const db = createMockDb({
      courses: [{ id: "c-101", profileId: "prof-alice", courseCode: "CS101" }],
      requests: [{ id: "req-1", courseId: "c-101", status: "submitted" }],
    });

    // prof-bob tries to deny prof-alice's request
    await expect(
      updateRequestStatusActionInternal(
        db,
        "prof-bob",
        "req-1",
        "deny",
        "Unauthorized denial",
      ),
    ).rejects.toThrow(RequestAccessError);
  });

  it("supports close transition and assign_to_ta transition", async () => {
    const db = createMockDb({
      courses: [{ id: "c-101", profileId: "prof-alice", courseCode: "CS101" }],
      requests: [{ id: "req-1", courseId: "c-101", status: "submitted" }],
    });

    const taRes = await updateRequestStatusActionInternal(
      db,
      "prof-alice",
      "req-1",
      "assign_to_ta",
      "Please re-check rubric question 3",
      "ta-user-99",
    );
    expect(taRes.newStatus).toBe("ta_review");
    expect(taRes.eventType).toBe("ta_assigned");

    const closeRes = await updateRequestStatusActionInternal(
      db,
      "prof-alice",
      "req-1",
      "close",
      "Archived after resolution",
    );
    expect(closeRes.newStatus).toBe("closed");
    expect(closeRes.eventType).toBe("professor_closed");
  });

  it("bulk marks Auto-Resolved requests as closed with strict ownership check", async () => {
    const db = createMockDb({
      courses: [{ id: "c-101", profileId: "prof-alice", courseCode: "CS101" }],
      requests: [
        { id: "req-auto-1", courseId: "c-101", status: "auto_approved" },
        { id: "req-auto-2", courseId: "c-101", status: "auto_denied" },
      ],
    });

    const res = await bulkCloseAutoResolvedInternal(db, "prof-alice", [
      "req-auto-1",
      "req-auto-2",
    ]);

    expect(res.closedCount).toBe(2);
    expect(db._stores.eventsStore.filter((e) => e.eventType === "professor_closed")).toHaveLength(2);
  });

  it("bulk close rejects if any request belongs to another professor (IDOR)", async () => {
    const db = createMockDb({
      courses: [
        { id: "c-101", profileId: "prof-alice", courseCode: "CS101" },
        { id: "c-202", profileId: "prof-eve", courseCode: "MATH202" },
      ],
      requests: [
        { id: "req-auto-1", courseId: "c-101", status: "auto_approved" },
        { id: "req-auto-2", courseId: "c-202", status: "auto_approved" },
      ],
    });

    await expect(
      bulkCloseAutoResolvedInternal(db, "prof-alice", ["req-auto-1", "req-auto-2"]),
    ).rejects.toThrow(RequestAccessError);
  });
});

describe("T2.12 — Attachments & Strict Allowlists", () => {
  it("HR1: detects and rejects medical or health-related categories", () => {
    expect(isMedicalCategory("medical_note")).toBe(true);
    expect(isMedicalCategory("doctor_letter")).toBe(true);
    expect(isMedicalCategory("hospital_discharge")).toBe(true);
    expect(isMedicalCategory("mental_health_record")).toBe(true);
    expect(isMedicalCategory("clinic_note")).toBe(true);
    expect(isMedicalCategory("prescription_receipt")).toBe(true);

    expect(isMedicalCategory("university_document")).toBe(false);
    expect(isMedicalCategory("athletics_schedule")).toBe(false);
    expect(isMedicalCategory("technical_issue")).toBe(false);
    expect(isMedicalCategory("other_admin")).toBe(false);
  });

  it("HR1: rejects attachment upload with medical category", async () => {
    const db = createMockDb({
      courses: [{ id: "c-101", profileId: "prof-alice" }],
      professorProfiles: [{ id: "prof-alice", plan: "free" }],
      requests: [{ id: "req-1", courseId: "c-101" }],
    });

    await expect(
      createAttachmentRecord(db, {
        requestId: "req-1",
        fileName: "doctor_note.pdf",
        mimeType: "application/pdf",
        fileSize: 1024 * 50,
        category: "doctor_letter",
      }),
    ).rejects.toThrow(/Hard Rule 1/);
  });

  it("rejects blocked MIME types (e.g. .exe, .zip, .html)", async () => {
    const db = createMockDb({
      courses: [{ id: "c-101", profileId: "prof-alice" }],
      professorProfiles: [{ id: "prof-alice", plan: "free" }],
      requests: [{ id: "req-1", courseId: "c-101" }],
    });

    await expect(
      createAttachmentRecord(db, {
        requestId: "req-1",
        fileName: "payload.exe",
        mimeType: "application/x-msdownload",
        fileSize: 1024 * 100,
        category: "university_document",
      }),
    ).rejects.toThrow(/Unsupported file type/);
  });

  it("enforces plan-based file size caps (5MB for Free, 25MB for Pro)", async () => {
    const dbFree = createMockDb({
      courses: [{ id: "c-101", profileId: "prof-alice" }],
      professorProfiles: [{ id: "prof-alice", plan: "free" }],
      requests: [{ id: "req-1", courseId: "c-101" }],
    });

    // 6MB on Free plan should throw PlanLimitError
    await expect(
      createAttachmentRecord(dbFree, {
        requestId: "req-1",
        fileName: "large_scan.pdf",
        mimeType: "application/pdf",
        fileSize: 6 * 1024 * 1024,
        category: "university_document",
      }),
    ).rejects.toThrow(PlanLimitError);

    // 6MB on Pro plan should succeed
    const dbPro = createMockDb({
      courses: [{ id: "c-101", profileId: "prof-pro" }],
      professorProfiles: [{ id: "prof-pro", plan: "pro" }],
      requests: [{ id: "req-1", courseId: "c-101" }],
    });

    const attachment = await createAttachmentRecord(dbPro, {
      requestId: "req-1",
      fileName: "large_scan.pdf",
      mimeType: "application/pdf",
      fileSize: 6 * 1024 * 1024,
      category: "university_document",
    });

    expect(attachment.id).toBeDefined();
    expect(attachment.fileName).toBe("large_scan.pdf");
    expect(dbPro._stores.attachmentsStore).toHaveLength(1);
    expect(dbPro._stores.eventsStore[0].eventType).toBe("attachment_uploaded");
  });

  it("enforces IDOR protection when downloading attachments", async () => {
    const db = createMockDb({
      courses: [{ id: "c-101", profileId: "prof-alice" }],
      requests: [{ id: "req-1", courseId: "c-101" }],
      attachments: [
        {
          id: "att-123",
          requestId: "req-1",
          fileName: "syllabus.pdf",
          mimeType: "application/pdf",
          fileSize: 1024,
          category: "university_document",
        },
      ],
    });

    // Alice can access
    const resultAlice = await getAttachmentWithOwnership(db, "prof-alice", "att-123");
    expect(resultAlice).not.toBeNull();
    expect(resultAlice?.attachment.id).toBe("att-123");

    // Bob cannot access (throws RequestAccessError)
    await expect(
      getAttachmentWithOwnership(db, "prof-bob", "att-123"),
    ).rejects.toThrow(RequestAccessError);
  });
});
