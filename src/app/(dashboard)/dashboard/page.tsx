import React from "react";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  console.log("[FACULTYOS_TRACE] DashboardPage: minimal test render");
  return (
    <div>
      <h1>Hello Dashboard Page Test</h1>
      <p>This is a minimal server component test.</p>
    </div>
  );
}
