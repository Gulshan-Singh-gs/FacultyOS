import { ImageResponse } from "next/og";

export const alt = "FacultyOS — Automate Student Requests & Protect Your Time";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          backgroundColor: "#0B1020",
          backgroundImage:
            "radial-gradient(circle at 25% 25%, rgba(99, 102, 241, 0.25) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(34, 211, 238, 0.2) 0%, transparent 50%)",
          padding: "80px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Brand Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "18px",
              background: "linear-gradient(135deg, #6366F1, #22D3EE)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontSize: "36px",
              fontWeight: 800,
            }}
          >
            F
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "32px", fontWeight: 800, color: "#F9FAFB" }}>
              FacultyOS
            </span>
            <span style={{ fontSize: "18px", color: "#9CA3AF" }}>
              Operations Platform for University Professors
            </span>
          </div>
        </div>

        {/* Main Pitch */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "1000px" }}>
          <div
            style={{
              fontSize: "58px",
              fontWeight: 900,
              color: "#FFFFFF",
              lineHeight: 1.15,
              letterSpacing: "-0.03em",
            }}
          >
            Stop answering the same email 400 times.
          </div>
          <div style={{ fontSize: "24px", color: "#CBD5E1", lineHeight: 1.4 }}>
            Deterministic syllabus rules that triage student extensions, regrades, and meetings instantly.
          </div>
        </div>

        {/* Badges footer */}
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <div
            style={{
              backgroundColor: "rgba(99, 102, 241, 0.15)",
              border: "1px solid rgba(99, 102, 241, 0.4)",
              borderRadius: "12px",
              padding: "10px 20px",
              fontSize: "16px",
              fontWeight: 700,
              color: "#A5B4FC",
            }}
          >
            Deterministic Policy Engine
          </div>
          <div
            style={{
              backgroundColor: "rgba(16, 185, 129, 0.15)",
              border: "1px solid rgba(16, 185, 129, 0.4)",
              borderRadius: "12px",
              padding: "10px 20px",
              fontSize: "16px",
              fontWeight: 700,
              color: "#6EE7B7",
            }}
          >
            Zero Medical Data
          </div>
          <div
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "12px",
              padding: "10px 20px",
              fontSize: "16px",
              fontWeight: 700,
              color: "#F1F5F9",
            }}
          >
            1 Course Free Forever
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
