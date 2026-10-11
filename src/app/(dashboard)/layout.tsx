import React from "react";
import { requireProfile } from "@/server/auth/session";
import { AppShell } from "@/components/ui/app-shell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log("[FACULTYOS_TRACE] DashboardLayout: start");
  const { user, profile } = await requireProfile();
  console.log("[FACULTYOS_TRACE] DashboardLayout: profile ready", profile?.id);

  return (
    <AppShell
      user={{
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image ?? null,
      }}
      profile={{
        id: profile.id,
        displayName: profile.displayName,
        plan: profile.plan,
        institution: profile.institution ?? null,
        facultyTitle: profile.facultyTitle ?? null,
      }}
    >
      {children}
    </AppShell>
  );
}
