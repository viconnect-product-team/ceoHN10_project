import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/dashboard/AppShell";
import { IntegratedPlatformsManager } from "@/components/admin/IntegratedPlatformsManager";

export const Route = createFileRoute("/admin/integrations")({
  head: () => ({ meta: [{ title: "Cấu hình phần mềm nền tảng — CEO HN10 Master Admin" }] }),
  component: IntegrationsPage,
});

function IntegrationsPage() {
  return (
    <AppShell>
      <IntegratedPlatformsManager />
    </AppShell>
  );
}
