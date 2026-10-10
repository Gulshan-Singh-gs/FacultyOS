import React from "react";

export interface ProfessorNewRequestEmailProps {
  professorName?: string;
  courseCode: string;
  courseName: string;
  requestType: string;
  studentDisplayLabel: string;
  priority: string;
  inboxUrl: string;
  submittedAt?: string;
  reasonSummary?: string;
}

export function ProfessorNewRequestEmail({
  professorName = "Professor",
  courseCode,
  courseName,
  requestType,
  studentDisplayLabel,
  priority,
  inboxUrl,
  submittedAt,
  reasonSummary,
}: ProfessorNewRequestEmailProps) {
  const isUrgent = priority === "urgent";

  return (
    <div
      style={{
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        backgroundColor: "#F4F6FB",
        color: "#1E293B",
        padding: "32px 16px",
        margin: "0",
        lineHeight: "1.5",
      }}
    >
      <div
        style={{
          maxWidth: "580px",
          margin: "0 auto",
          backgroundColor: "#FFFFFF",
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.05)",
          border: "1px solid #E2E8F0",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #0B1020 0%, #1E1B4B 100%)",
            color: "#FFFFFF",
            padding: "28px 32px",
          }}
        >
          <div style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "1px", textTransform: "uppercase", color: "#818CF8" }}>
            FacultyOS • Action Required
          </div>
          <h1 style={{ margin: "6px 0 0", fontSize: "20px", fontWeight: "700", color: "#FFFFFF" }}>
            New Request Pending Decision • {courseCode}
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#94A3B8" }}>
            {courseName}
          </p>
        </div>

        {/* Content */}
        <div style={{ padding: "32px" }}>
          <p style={{ margin: "0 0 16px", fontSize: "14px", color: "#334155" }}>
            Hello {professorName},
          </p>
          <p style={{ margin: "0 0 20px", fontSize: "14px", color: "#334155" }}>
            A student has submitted a <strong>{requestType.replace("_", " ")}</strong> request that could not be automatically resolved and requires your review.
          </p>

          {/* Request Metadata Card */}
          <div
            style={{
              backgroundColor: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: "12px",
              padding: "20px",
              marginBottom: "24px",
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div style={{ marginBottom: "12px" }}>
                <div style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "#64748B" }}>
                  Student
                </div>
                <div style={{ fontSize: "14px", fontWeight: "600", color: "#0F172A", marginTop: "2px" }}>
                  {studentDisplayLabel}
                </div>
              </div>

              <div style={{ marginBottom: "12px" }}>
                <div style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "#64748B" }}>
                  Priority
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: "700",
                    display: "inline-block",
                    padding: "2px 8px",
                    borderRadius: "6px",
                    marginTop: "2px",
                    textTransform: "uppercase",
                    backgroundColor: isUrgent ? "#FFE4E6" : "#EEF2FF",
                    color: isUrgent ? "#E11D48" : "#4F46E5",
                  }}
                >
                  {priority}
                </div>
              </div>
            </div>

            {submittedAt && (
              <div style={{ marginTop: "4px", fontSize: "12px", color: "#64748B" }}>
                Submitted: {submittedAt}
              </div>
            )}

            {reasonSummary && (
              <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #E2E8F0", fontSize: "13px", color: "#334155" }}>
                <div style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "#64748B", marginBottom: "4px" }}>
                  Circumstance Summary
                </div>
                {reasonSummary}
              </div>
            )}
          </div>

          {/* Action Button */}
          <div style={{ textAlign: "center", margin: "28px 0" }}>
            <a
              href={inboxUrl}
              style={{
                display: "inline-block",
                backgroundColor: "#4F46E5",
                color: "#FFFFFF",
                fontWeight: "600",
                fontSize: "14px",
                padding: "12px 28px",
                borderRadius: "10px",
                textDecoration: "none",
                boxShadow: "0 2px 8px rgba(79, 70, 229, 0.3)",
              }}
            >
              Open in Triage Inbox →
            </a>
          </div>

          {/* Boundaries reassurance */}
          <div
            style={{
              backgroundColor: "#F1F5F9",
              borderRadius: "10px",
              padding: "12px 16px",
              fontSize: "11px",
              color: "#64748B",
              lineHeight: "1.4",
            }}
          >
            <strong>Boundary Shield Active:</strong> This notification was dispatched according to your configured working hours. Non-urgent submissions during your off-hours are deferred automatically.
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            backgroundColor: "#F8FAFC",
            padding: "16px 32px",
            borderTop: "1px solid #E2E8F0",
            fontSize: "11px",
            color: "#64748B",
            textAlign: "center",
          }}
        >
          FacultyOS • Automated Academic Boundaries & Request Engine
        </div>
      </div>
    </div>
  );
}

export function renderProfessorNewRequestHtml(props: ProfessorNewRequestEmailProps): string {
  const isUrgent = props.priority === "urgent";
  const priorityColor = isUrgent ? "#E11D48" : "#4F46E5";
  const priorityBg = isUrgent ? "#FFE4E6" : "#EEF2FF";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>New Request Pending Decision • ${props.courseCode}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F4F6FB; margin: 0; padding: 32px 16px; color: #1E293B;">
  <div style="max-width: 580px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 20px -2px rgba(0,0,0,0.05);">
    <div style="background: linear-gradient(135deg, #0B1020 0%, #1E1B4B 100%); color: #FFFFFF; padding: 28px 32px;">
      <div style="font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #818CF8;">FacultyOS • Action Required</div>
      <h1 style="margin: 6px 0 0; font-size: 20px; font-weight: 700; color: #FFFFFF;">New Request Pending Decision • ${props.courseCode}</h1>
      <p style="margin: 4px 0 0; font-size: 13px; color: #94A3B8;">${props.courseName}</p>
    </div>
    <div style="padding: 32px;">
      <p style="margin: 0 0 16px; font-size: 14px; color: #334155;">Hello ${props.professorName || "Professor"},</p>
      <p style="margin: 0 0 20px; font-size: 14px; color: #334155;">A student has submitted a <strong>${props.requestType.replace("_", " ")}</strong> request that could not be automatically resolved and requires your review.</p>
      <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <div style="margin-bottom: 12px;">
          <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748B;">Student</div>
          <div style="font-size: 14px; font-weight: 600; color: #0F172A; margin-top: 2px;">${props.studentDisplayLabel}</div>
        </div>
        <div style="margin-bottom: 12px;">
          <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748B;">Priority</div>
          <div style="font-size: 12px; font-weight: 700; display: inline-block; padding: 2px 8px; border-radius: 6px; margin-top: 2px; text-transform: uppercase; background-color: ${priorityBg}; color: ${priorityColor};">${props.priority}</div>
        </div>
        ${props.submittedAt ? `<div style="font-size: 12px; color: #64748B;">Submitted: ${props.submittedAt}</div>` : ""}
        ${props.reasonSummary ? `<div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #E2E8F0; font-size: 13px; color: #334155;"><div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748B; margin-bottom: 4px;">Circumstance Summary</div>${props.reasonSummary}</div>` : ""}
      </div>
      <div style="text-align: center; margin: 28px 0;">
        <a href="${props.inboxUrl}" style="display: inline-block; background-color: #4F46E5; color: #FFFFFF; font-weight: 600; font-size: 14px; padding: 12px 28px; border-radius: 10px; text-decoration: none;">Open in Triage Inbox →</a>
      </div>
      <div style="background: #F1F5F9; border-radius: 10px; padding: 12px 16px; font-size: 11px; color: #64748B; line-height: 1.4;">
        <strong>Boundary Shield Active:</strong> This notification was dispatched according to your configured working hours. Non-urgent submissions during your off-hours are deferred automatically.
      </div>
    </div>
    <div style="background: #F8FAFC; padding: 16px 32px; border-top: 1px solid #E2E8F0; font-size: 11px; color: #64748B; text-align: center;">
      FacultyOS • Automated Academic Boundaries & Request Engine
    </div>
  </div>
</body>
</html>`;
}
