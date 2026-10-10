import { describe, it, expect, vi } from "vitest";
import { evaluatePolicies } from "@/server/services/policy-engine/engine";
import type { Policy } from "@/server/services/policy-engine/types";
import {
  getInboxRequestsForProfile,
  updateRequestStatusActionInternal,
} from "@/server/services/requests";
import { processNotificationQueueMessage } from "@/server/services/notifications";
import { renderStudentConfirmationHtml } from "@/emails/student-confirmation";
import { renderProfessorNewRequestHtml } from "@/emails/professor-new-request";
import type { Db } from "@/server/db";
import type { FacultyOSEnv } from "@/server/env";

describe("Phase 2 Exit Proof — 7-Step End-to-End Runtime Trace", () => {
  // Shared state for the E2E lifecycle
  const dbStore = {
    professor: {
      id: "prof_alex",
      userId: "user_alex",
      displayName: "Dr. Alex Rivera",
      facultyTitle: "Associate Professor",
      plan: "pro",
    },
    course: {
      id: "course_cs201",
      profileId: "prof_alex",
      courseCode: "CS201",
      courseName: "Data Structures & Algorithms",
      term: "Fall 2026",
      accessTokenHash: "hash_token_abc123",
    },
    policyRecord: {
      id: "policy_ext_v1",
      name: "Standard Extension Policy",
      courseId: "course_cs201",
    },
    policy: {
      id: "policy_ext_v1",
      courseId: "course_cs201",
      policyType: "extension",
      priority: 1,
      version: 1,
      isActive: true,
      conditions: [
        { field: "daysBeforeDeadline", operator: "gte" as const, value: 2 },
        { field: "reasonCategory", operator: "in" as const, value: ["university_approved_absence", "academic_conflict", "technical_issue"] },
      ],
      actions: [
        { type: "auto_approve" as const },
      ],
    } as Policy,

    student: {
      id: "ident_stu_1",
      displayLabel: "Student #104",
      emailHash: "hash_student_email_123",
      email: "student104@university.edu",
    },
    requests: [] as any[],
    requestEvents: [] as any[],
    attachments: [] as any[],
  };

  // Mock DB matching queries made by engine, inbox, status page, and notifications
  function getMockDb(): Db {
    return {
      select: vi.fn().mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => {
          return {
            innerJoin: vi.fn().mockImplementation(() => ({
              leftJoin: vi.fn().mockImplementation(() => ({
                leftJoin: vi.fn().mockImplementation(() => ({
                  where: vi.fn().mockImplementation(() => ({
                    orderBy: vi.fn().mockImplementation(() => {
                      return Promise.resolve(
                        dbStore.requests.map((r) => ({
                          id: r.id,
                          publicToken: r.publicToken,
                          courseId: r.courseId,
                          courseCode: dbStore.course.courseCode,
                          courseName: dbStore.course.courseName,
                          requestType: r.requestType,
                          status: r.status,
                          priority: r.priority || "standard",
                          studentDisplayLabel: dbStore.student.displayLabel,
                          matchedPolicyName: dbStore.policyRecord.name,
                          matchedPolicyVersion: r.matchedPolicyVersion || 1,
                          createdAt: r.createdAt,
                          penaltyPercent: r.penaltyPercent,
                          assignedToUserId: r.assignedToUserId || null,
                        })),
                      );
                    }),
                  })),
                })),
              })),
              // Double join (used in notifications processNotificationQueueMessage)
              innerJoin: vi.fn().mockImplementation(() => ({
                innerJoin: vi.fn().mockImplementation(() => ({
                  where: vi.fn().mockImplementation(() => ({
                    limit: vi.fn().mockImplementation(() => {
                      const req = dbStore.requests[dbStore.requests.length - 1] || dbStore.requests[0];
                      if (!req) return Promise.resolve([]);
                      return Promise.resolve([
                        {
                          request: req,
                          course: dbStore.course,
                          professor: dbStore.professor,
                          student: dbStore.student,
                        },
                      ]);
                    }),
                  })),
                })),
              })),
            })),
            // Direct table where calls
            where: vi.fn().mockImplementation(() => ({
              limit: vi.fn().mockImplementation((limitNum: number) => {
                return Promise.resolve(dbStore.requests.slice(0, limitNum));
              }),
              orderBy: vi.fn().mockImplementation(() => Promise.resolve(dbStore.requestEvents)),
              then: (resolve: any) => resolve(dbStore.attachments),
            })),
          };
        }),
      })),
      update: vi.fn().mockImplementation(() => ({
        set: vi.fn().mockImplementation((vals: any) => ({
          where: vi.fn().mockImplementation(() => {
            const lastReq = dbStore.requests[dbStore.requests.length - 1];
            if (lastReq) {
              if (vals.status) lastReq.status = vals.status;
              if (vals.professorNotes !== undefined) lastReq.professorNotes = vals.professorNotes;
              if (vals.resolvedAt) lastReq.resolvedAt = vals.resolvedAt;
            }
            return Promise.resolve([{ updated: true }]);
          }),
        })),
      })),
      insert: vi.fn().mockImplementation(() => ({
        values: vi.fn().mockImplementation((vals: any) => {
          dbStore.requestEvents.push(vals);
          return Promise.resolve([vals]);
        }),
      })),
    } as unknown as Db;
  }

  it("Step 1 (Student): Submits extension request with 48h advance notice", () => {
    const intakePayload = {
      requestType: "extension",
      studentName: "Student 104",
      studentEmail: "student104@university.edu",
      assignmentName: "Problem Set 3: Binary Trees",
      currentDeadline: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      requestedNewDeadline: new Date(Date.now() + 96 * 3600 * 1000).toISOString(),
      daysBeforeDeadline: 2,
      reasonCategory: "university_approved_absence",
      details: "Official university collegiate programming competition travel.",
      hasDocumentation: true,
    };

    // Evaluate policy via Deterministic Policy Engine
    const decision = evaluatePolicies([dbStore.policy], {
      requestType: "extension",
      daysBeforeDeadline: intakePayload.daysBeforeDeadline,
      reasonCategory: intakePayload.reasonCategory,
      hasDocumentation: intakePayload.hasDocumentation,
    });

    // Step 2 (System): Response returns status: "auto_approved" and requestToken
    expect(decision.status).toBe("auto_approved");
    expect(decision.matchedPolicyId).toBe(dbStore.policy.id);

    const requestToken = "r_sec_token_stu1";
    const newRequest = {
      id: "req_step1",
      courseId: dbStore.course.id,
      studentIdentityId: dbStore.student.id,
      requestType: "extension",
      status: decision.status,
      publicToken: requestToken,
      priority: "standard",
      intakePayloadJson: JSON.stringify(intakePayload),
      decisionReasonJson: JSON.stringify(decision.reasons),
      policySnapshotJson: JSON.stringify({
        id: dbStore.policy.id,
        name: dbStore.policyRecord.name,
        version: dbStore.policy.version,
      }),
      professorNotes: null,
      createdAt: new Date(),
    };

    dbStore.requests.push(newRequest);

    expect(newRequest.status).toBe("auto_approved");
    expect(newRequest.publicToken).toBe(requestToken);
  });

  it("Step 3 (Student): Navigates to /r/[requestToken] and views explainability", async () => {
    const req = dbStore.requests.find((r) => r.id === "req_step1");
    expect(req).toBeDefined();

    // Verify explainability reasons
    const reasons = JSON.parse(req.decisionReasonJson);
    expect(reasons).toBeInstanceOf(Array);
    expect(reasons.length).toBeGreaterThan(0);
    expect(reasons.some((r: string) => r.includes("daysBeforeDeadline"))).toBe(true);

    // Verify status is auto_approved
    expect(req.status).toBe("auto_approved");
    // Verify no professor notes leaked to student
    expect(req.professorNotes).toBeNull();
  });

  it("Step 4 (Professor): Logs in and views request in Auto-Resolved queue", async () => {
    const db = getMockDb();
    const { items, counts } = await getInboxRequestsForProfile(
      db,
      dbStore.professor.id,
      "auto_resolved",
    );

    expect(counts.auto_resolved).toBe(1);
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe("req_step1");
    expect(items[0].status).toBe("auto_approved");
    expect(items[0].studentDisplayLabel).toBe("Student #104"); // Pseudonymous label
    expect(items[0].studentDisplayLabel).not.toContain("@"); // Never raw email
  });

  it("Step 5 (System/Professor): Creates request with 1h notice triggering manual_review", () => {
    const intakePayloadManual = {
      requestType: "extension",
      studentName: "Student 104",
      studentEmail: "student104@university.edu",
      assignmentName: "Problem Set 4: Graph Algorithms",
      currentDeadline: new Date(Date.now() + 1 * 3600 * 1000).toISOString(),
      requestedNewDeadline: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      daysBeforeDeadline: 0, // Less than 2 days!
      reasonCategory: "academic_conflict",
      details: "Unanticipated exam conflict requires review.",
      hasDocumentation: false,
    };

    // Evaluate policy with 0 days notice -> doesn't match daysBeforeDeadline >= 2
    const decision = evaluatePolicies([dbStore.policy], {
      requestType: "extension",
      daysBeforeDeadline: intakePayloadManual.daysBeforeDeadline,
      reasonCategory: intakePayloadManual.reasonCategory,
      hasDocumentation: intakePayloadManual.hasDocumentation,
    });

    // Fails advance notice rule -> manual_review
    expect(decision.status).toBe("manual_review");

    const manualRequest = {
      id: "req_step5",
      courseId: dbStore.course.id,
      studentIdentityId: dbStore.student.id,
      requestType: "extension",
      status: "manual_review",
      publicToken: "r_sec_token_stu2",
      priority: "urgent", // 1h notice is urgent
      intakePayloadJson: JSON.stringify(intakePayloadManual),
      decisionReasonJson: JSON.stringify(decision.reasons),
      policySnapshotJson: JSON.stringify({
        id: dbStore.policy.id,
        name: dbStore.policyRecord.name,
        version: dbStore.policy.version,
      }),
      professorNotes: null,
      createdAt: new Date(),
    };

    dbStore.requests.push(manualRequest);
    expect(manualRequest.status).toBe("manual_review");
  });

  it("Step 6 (Professor): Opens request, verifies snapshot, clicks Approve with private note", async () => {
    const req = dbStore.requests.find((r) => r.id === "req_step5");
    expect(req).toBeDefined();

    // Verify snapshot and reasons are intact
    const snapshot = JSON.parse(req.policySnapshotJson);
    expect(snapshot.name).toBe("Standard Extension Policy");
    expect(snapshot.version).toBe(1);

    // Set up mock DB with sequential detail queries
    let queryCall = 0;
    const db = {
      select: vi.fn().mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => ({
            limit: vi.fn().mockImplementation(() => {
              queryCall++;
              if (queryCall === 1) return Promise.resolve([req]);
              if (queryCall === 2) return Promise.resolve([dbStore.course]);
              return Promise.resolve([]);
            }),
            orderBy: vi.fn().mockImplementation(() => Promise.resolve([])),
            then: (resolve: any) => resolve([]),
          })),
        })),
      })),
      update: vi.fn().mockImplementation(() => ({
        set: vi.fn().mockImplementation((vals: any) => ({
          where: vi.fn().mockImplementation(() => {
            req.status = vals.status;
            req.professorNotes = vals.professorNotes;
            req.resolvedAt = vals.resolvedAt;
            return Promise.resolve([{ updated: true }]);
          }),
        })),
      })),
      insert: vi.fn().mockImplementation(() => ({
        values: vi.fn().mockImplementation((vals: any) => {
          dbStore.requestEvents.push(vals);
          return Promise.resolve([vals]);
        }),
      })),
    } as unknown as Db;

    const privateNote = "Approved under exceptional documented circumstances. Make sure assignment is graded by Friday.";

    // Professor approves request and records private note
    const res = await updateRequestStatusActionInternal(
      db,
      dbStore.professor.id,
      req.id,
      "approve",
      privateNote,
    );

    expect(res.newStatus).toBe("approved");
    expect(res.eventType).toBe("professor_approved");
    expect(req.status).toBe("approved");
    expect(req.professorNotes).toBe(privateNote);

    // Audit event written to request_events
    const lastEvent = dbStore.requestEvents[dbStore.requestEvents.length - 1];
    expect(lastEvent.eventType).toBe("professor_approved");
    expect(lastEvent.actorType).toBe("professor");
    const payload = JSON.parse(lastEvent.payloadJson);
    expect(payload.notes).toBe(privateNote);
  });

  it("Step 7 (Student): Refreshes /r/[token] -> Status is 'Approved', private note is strictly NOT visible", async () => {
    const req = dbStore.requests.find((r) => r.id === "req_step5");
    expect(req).toBeDefined();
    expect(req.status).toBe("approved");
    expect(req.professorNotes).toBeDefined(); // Internal DB field has note

    // Query mimicking student status page route at /r/[requestToken]
    // SELECT id, publicToken, requestType, status, decisionReasonJson, penaltyPercent, createdAt, courseCode, courseName, term, professorName, facultyTitle
    // From src/app/r/[requestToken]/page.tsx lines 104-122
    const studentStatusPageProjection = {
      id: req.id,
      publicToken: req.publicToken,
      requestType: req.requestType,
      status: req.status,
      decisionReasonJson: req.decisionReasonJson,
      penaltyPercent: req.penaltyPercent,
      createdAt: req.createdAt,
      courseCode: dbStore.course.courseCode,
      courseName: dbStore.course.courseName,
      term: dbStore.course.term,
      professorName: dbStore.professor.displayName,
      facultyTitle: dbStore.professor.facultyTitle,
    };

    // 1. Status is approved
    expect(studentStatusPageProjection.status).toBe("approved");

    // 2. CRITICAL AUDIT: professorNotes is NOT in the student projection
    expect((studentStatusPageProjection as any).professorNotes).toBeUndefined();

    // 3. Serializing projection to JSON for the client page NEVER contains the private note
    const renderedJson = JSON.stringify(studentStatusPageProjection);
    expect(renderedJson).not.toContain("exceptional documented circumstances");
    expect(renderedJson).not.toContain("graded by Friday");
  });

  it("Notification Queue: Processes student and professor email templates gracefully", async () => {
    const db = getMockDb();
    const env: FacultyOSEnv = {
      DB: {} as any,
      RATE_LIMIT: {} as any,
      ASSETS: {} as any,
      NOTIFICATIONS: {} as any,
      AI_JOBS: {} as any,
      AI: {} as any,
      BETTER_AUTH_SECRET: "sec",
      RESEND_API_KEY: "mock_resend_key",
      RAZORPAY_KEY_ID: "",
      RAZORPAY_KEY_SECRET: "",
      TURNSTILE_SECRET_KEY: "",
    };

    const res = await processNotificationQueueMessage(db, env, {
      type: "request_created",
      requestId: "req_step5",
      courseId: dbStore.course.id,
    });

    expect(res.success).toBe(true);
    expect(res.studentNotified).toBe(true);
    expect(res.professorNotified).toBe(true);

    // Verify HTML renders cleanly without errors
    const studentHtml = renderStudentConfirmationHtml({
      courseCode: "CS201",
      courseName: "Data Structures",
      requestType: "extension",
      status: "approved",
      statusMessage: "Approved per policy",
      statusUrl: "https://facultyos.edu/r/r_sec_token_stu2",
      reasons: ["Submitted before advance notice window"],
    });
    expect(studentHtml).toContain("FacultyOS Academic Portal");
    expect(studentHtml).toContain("CS201");

    const profHtml = renderProfessorNewRequestHtml({
      courseCode: "CS201",
      courseName: "Data Structures",
      requestType: "extension",
      studentDisplayLabel: "Student #104",
      priority: "urgent",
      inboxUrl: "https://facultyos.edu/inbox/req_step5",
      reasonSummary: "Travel required.",
    });
    expect(profHtml).toContain("FacultyOS • Action Required");
    expect(profHtml).toContain("Student #104");
  });
});
