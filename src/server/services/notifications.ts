import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { Db } from "@/server/db";
import {
  requests,
  courses,
  professorProfiles,
  studentIdentities,
  requestEvents,
} from "@/server/db/schema";
import type { FacultyOSEnv } from "@/server/env";
import { renderStudentConfirmationHtml } from "@/emails/student-confirmation";
import { renderProfessorNewRequestHtml } from "@/emails/professor-new-request";

export interface SendEmailPayload {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export interface NotificationQueueMessage {
  type: "request_created" | "status_updated" | "ai_job" | string;
  requestId: string;
  courseId?: string;
  [key: string]: unknown;
}

/**
 * Sends an email via Resend API with graceful fallback in development or missing API key.
 */
export async function sendEmailViaResend(
  env: FacultyOSEnv,
  payload: SendEmailPayload,
): Promise<{ success: boolean; id?: string; mode: "live" | "simulated" }> {
  const apiKey = env.RESEND_API_KEY;
  const from = payload.from || "FacultyOS Notifications <notifications@facultyos.edu>";

  // If no live Resend key configured, simulate delivery cleanly
  if (!apiKey || apiKey === "REPLACE_WITH_RESEND_KEY" || apiKey.startsWith("mock_")) {
    console.log(`[notifications:simulated] To: ${payload.to} | Subject: "${payload.subject}"`);
    return {
      success: true,
      id: `sim_${nanoid()}`,
      mode: "simulated",
    };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[notifications:resend_error] HTTP ${res.status}: ${errText}`);
      return { success: false, mode: "live" };
    }

    const data = (await res.json()) as { id?: string };
    return { success: true, id: data.id, mode: "live" };
  } catch (error) {
    console.error("[notifications:exception]", error);
    return { success: false, mode: "live" };
  }
}

/**
 * Cloudflare Queue processing handler for a single notification queue message.
 */
export async function processNotificationQueueMessage(
  db: Db,
  env: FacultyOSEnv,
  msg: NotificationQueueMessage,
  baseUrl?: string,
): Promise<{
  success: boolean;
  studentNotified: boolean;
  professorNotified: boolean;
}> {
  // Resolve base URL: caller-provided > env binding > hardcoded fallback
  const resolvedBaseUrl =
    baseUrl ||
    (env as any).BETTER_AUTH_URL ||
    "https://facultyos.gs-softwares.workers.dev";
  const { requestId } = msg;
  if (!requestId) {
    return { success: false, studentNotified: false, professorNotified: false };
  }

  // Resolve request details with joins
  const [row] = await db
    .select({
      request: requests,
      course: courses,
      professor: professorProfiles,
      student: studentIdentities,
    })
    .from(requests)
    .innerJoin(courses, eq(requests.courseId, courses.id))
    .innerJoin(professorProfiles, eq(courses.profileId, professorProfiles.id))
    .innerJoin(studentIdentities, eq(requests.studentIdentityId, studentIdentities.id))
    .where(eq(requests.id, requestId))
    .limit(1);

  if (!row) {
    console.warn(`[notifications:queue] Request ${requestId} not found in database.`);
    return { success: false, studentNotified: false, professorNotified: false };
  }

  const { request, course, professor, student } = row;
  let studentNotified = false;
  let professorNotified = false;

  // 1. Send Student Confirmation Email
  // If student email is available (or in development/mock fallback)
  const studentEmail = (student as unknown as { email?: string }).email || "student@university.edu";
  let statusMessage = "Your request was submitted and is pending faculty review.";
  if (request.status === "auto_approved") {
    statusMessage = "Your request matched course policy criteria and was automatically approved.";
  } else if (request.status === "auto_denied") {
    statusMessage = "Your request did not satisfy required course policy criteria.";
  }

  let reasons: string[] = [];
  try {
    if (request.decisionReasonJson) {
      reasons = JSON.parse(request.decisionReasonJson) as string[];
    }
  } catch {
    reasons = [];
  }

  const studentHtml = renderStudentConfirmationHtml({
    studentName: student.displayLabel || "Student",
    courseCode: course.courseCode,
    courseName: course.courseName,
    requestType: request.requestType,
    status: request.status,
    statusMessage,
    statusUrl: `${resolvedBaseUrl}/r/${request.publicToken}`,
    reasons,
  });

  const studentRes = await sendEmailViaResend(env, {
    to: studentEmail,
    subject: `Request Submitted: ${course.courseCode} ${request.requestType.replace("_", " ")}`,
    html: studentHtml,
  });
  studentNotified = studentRes.success;

  // 2. Send Professor Notification Email (if request requires manual faculty review)
  const requiresProfessorAttention =
    request.status === "submitted" ||
    request.status === "manual_review" ||
    request.priority === "urgent";

  if (requiresProfessorAttention) {
    let reasonSummary = "Requires instructor evaluation.";
    try {
      const payload = JSON.parse(request.intakePayloadJson) as {
        details?: string;
        justification?: string;
        agenda?: string;
      };
      reasonSummary = payload.details || payload.justification || payload.agenda || reasonSummary;
    } catch {
      // fallback
    }

    const professorHtml = renderProfessorNewRequestHtml({
      professorName: professor.displayName || "Professor",
      courseCode: course.courseCode,
      courseName: course.courseName,
      requestType: request.requestType,
      studentDisplayLabel: student.displayLabel || `Student #${student.id.slice(0, 6)}`,
      priority: request.priority,
      inboxUrl: `${resolvedBaseUrl}/inbox/${request.id}`,
      submittedAt: request.createdAt ? new Date(request.createdAt).toLocaleString() : undefined,
      reasonSummary: reasonSummary.slice(0, 200),
    });

    const profEmail = "instructor@university.edu"; // Professor notification target
    const profRes = await sendEmailViaResend(env, {
      to: profEmail,
      subject: `[${course.courseCode}] ${request.priority === "urgent" ? "URGENT " : ""}New Request: ${request.requestType}`,
      html: professorHtml,
    });
    professorNotified = profRes.success;
  }

  // Record notification audit trail
  await db.insert(requestEvents).values({
    id: nanoid(),
    requestId: request.id,
    eventType: "notification_dispatched",
    actorType: "system",
    payloadJson: JSON.stringify({
      studentNotified,
      professorNotified,
      requiresProfessorAttention,
    }),
  });

  return { success: true, studentNotified, professorNotified };
}
