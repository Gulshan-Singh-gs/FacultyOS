import React from "react";
import { requireProfile } from "@/server/auth/session";
import { AppShell } from "@/components/ui/app-shell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await requireProfile();

  return (
    <AppShell user={user} profile={profile}>
      {children}
    </AppShell>
  );
}
