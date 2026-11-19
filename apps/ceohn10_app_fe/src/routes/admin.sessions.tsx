import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/dashboard/AppShell";
import { AdminSessionsManager } from "@/components/admin/AdminSessionsManager";

export const Route = createFileRoute("/admin/sessions")({
  head: () => ({ meta: [{ title: "Quản lý tài khoản quản trị & Phiên làm việc — CEO HN10 Master Admin" }] }),
  component: AdminSessionsPage,
});

function AdminSessionsPage() {
  return (
    <AppShell>
      <AdminSessionsManager />
    </AppShell>
  );
}
