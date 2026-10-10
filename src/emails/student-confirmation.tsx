import React from "react";

export interface StudentConfirmationEmailProps {
  studentName?: string;
  courseCode: string;
  courseName: string;
  requestType: string;
  status: string;
  statusMessage: string;
  statusUrl: string;
  reasons?: string[];
}

export function StudentConfirmationEmail({
  studentName = "Student",
  courseCode,
  courseName,
  requestType,
  status,
  statusMessage,
  statusUrl,
  reasons = [],
}: StudentConfirmationEmailProps) {
  const isApproved = status === "auto_approved" || status === "approved";
  const isDenied = status === "auto_denied" || status === "denied";

  const statusColor = isApproved
    ? "#10B981"
    : isDenied
      ? "#F43F5E"
      : "#6366F1";

  const statusBg = isApproved
    ? "#ECFDF5"
    : isDenied
      ? "#FFF1F2"
      : "#EEF2FF";

  const statusLabel = isApproved
    ? "Approved per Policy"
    : isDenied
      ? "Not Eligible per Policy"
      : "Under Faculty Review";

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
            FacultyOS Academic Portal
          </div>
          <h1 style={{ margin: "6px 0 0", fontSize: "20px", fontWeight: "700", color: "#FFFFFF" }}>
            Request Confirmation • {courseCode}
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#94A3B8" }}>
            {courseName}
          </p>
        </div>

        {/* Content */}
        <div style={{ padding: "32px" }}>
          <p style={{ margin: "0 0 16px", fontSize: "14px", color: "#334155" }}>
            Hello {studentName},
          </p>
          <p style={{ margin: "0 0 20px", fontSize: "14px", color: "#334155" }}>
            Your <strong>{requestType.replace("_", " ")}</strong> request has been successfully submitted and processed by the course automated policy engine.
          </p>

          {/* Status Badge Card */}
          <div
            style={{
              backgroundColor: statusBg,
              border: `1px solid ${statusColor}40`,
              borderRadius: "12px",
              padding: "18px 20px",
              marginBottom: "24px",
            }}
          >
            <div style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", color: statusColor }}>
              Current Status
            </div>
            <div style={{ fontSize: "17px", fontWeight: "700", color: statusColor, marginTop: "4px" }}>
              {statusLabel}
            </div>
            <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#475569" }}>
              {statusMessage}
            </p>
          </div>

          {/* Plain-Language Reasons */}
          {reasons.length > 0 && (
            <div style={{ marginBottom: "24px" }}>
              <div style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", color: "#64748B", marginBottom: "8px" }}>
                Evaluation Policy Citation
              </div>
              <ul style={{ margin: "0", paddingLeft: "20px", fontSize: "13px", color: "#475569" }}>
                {reasons.map((r, i) => (
                  <li key={i} style={{ marginBottom: "4px" }}>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* CTA Link */}
          <div style={{ textAlign: "center", margin: "28px 0" }}>
            <a
              href={statusUrl}
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
              View Request Status & Timeline →
            </a>
          </div>

          <p style={{ fontSize: "12px", color: "#64748B", textAlign: "center", margin: "0 0 20px" }}>
            You can bookmark the link above to check for updates or grader notes anytime without logging in.
          </p>

          {/* Zero AI Guarantee Note */}
          <div
            style={{
              backgroundColor: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: "10px",
              padding: "12px 16px",
              fontSize: "11px",
              color: "#64748B",
              lineHeight: "1.4",
            }}
          >
            <strong>Audit Assurance:</strong> This request was evaluated deterministically against the instructor&apos;s active syllabus policy version. Artificial intelligence was not involved in executing this decision.
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            backgroundColor: "#F1F5F9",
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

export function renderStudentConfirmationHtml(props: StudentConfirmationEmailProps): string {
  const isApproved = props.status === "auto_approved" || props.status === "approved";
  const isDenied = props.status === "auto_denied" || props.status === "denied";
  const statusColor = isApproved ? "#10B981" : isDenied ? "#F43F5E" : "#4F46E5";
  const statusBg = isApproved ? "#ECFDF5" : isDenied ? "#FFF1F2" : "#EEF2FF";
  const statusLabel = isApproved
    ? "Approved per Policy"
    : isDenied
      ? "Not Eligible per Policy"
      : "Under Faculty Review";

  const reasonsList = (props.reasons || [])
    .map((r) => `<li style="margin-bottom: 4px;">${r}</li>`)
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Request Confirmation • ${props.courseCode}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F4F6FB; margin: 0; padding: 32px 16px; color: #1E293B;">
  <div style="max-width: 580px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 20px -2px rgba(0,0,0,0.05);">
    <div style="background: linear-gradient(135deg, #0B1020 0%, #1E1B4B 100%); color: #FFFFFF; padding: 28px 32px;">
      <div style="font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #818CF8;">FacultyOS Academic Portal</div>
      <h1 style="margin: 6px 0 0; font-size: 20px; font-weight: 700; color: #FFFFFF;">Request Confirmation • ${props.courseCode}</h1>
      <p style="margin: 4px 0 0; font-size: 13px; color: #94A3B8;">${props.courseName}</p>
    </div>
    <div style="padding: 32px;">
      <p style="margin: 0 0 16px; font-size: 14px; color: #334155;">Hello ${props.studentName || "Student"},</p>
      <p style="margin: 0 0 20px; font-size: 14px; color: #334155;">Your <strong>${props.requestType.replace("_", " ")}</strong> request has been successfully submitted and processed by the course automated policy engine.</p>
      <div style="background: ${statusBg}; border: 1px solid ${statusColor}40; border-radius: 12px; padding: 18px 20px; margin-bottom: 24px;">
        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: ${statusColor};">Current Status</div>
        <div style="font-size: 17px; font-weight: 700; color: ${statusColor}; margin-top: 4px;">${statusLabel}</div>
        <p style="margin: 6px 0 0; font-size: 13px; color: #475569;">${props.statusMessage}</p>
      </div>
      ${props.reasons && props.reasons.length > 0 ? `
      <div style="margin-bottom: 24px;">
        <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #64748B; margin-bottom: 8px;">Evaluation Policy Citation</div>
        <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #475569;">
          ${reasonsList}
        </ul>
      </div>` : ""}
      <div style="text-align: center; margin: 28px 0;">
        <a href="${props.statusUrl}" style="display: inline-block; background-color: #4F46E5; color: #FFFFFF; font-weight: 600; font-size: 14px; padding: 12px 28px; border-radius: 10px; text-decoration: none;">View Request Status & Timeline →</a>
      </div>
      <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 12px 16px; font-size: 11px; color: #64748B; line-height: 1.4;">
        <strong>Audit Assurance:</strong> This request was evaluated deterministically against the instructor's active syllabus policy version. Artificial intelligence was not involved in executing this decision.
      </div>
    </div>
    <div style="background: #F1F5F9; padding: 16px 32px; border-top: 1px solid #E2E8F0; font-size: 11px; color: #64748B; text-align: center;">
      FacultyOS • Automated Academic Boundaries & Request Engine
    </div>
  </div>
</body>
</html>`;
}
