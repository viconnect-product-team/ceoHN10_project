import React, { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/dashboard/AppShell";
import { MasterPlatformStatusBar } from "@/components/dashboard/MasterPlatformStatusBar";
import { MasterFundSurplusWidget } from "@/components/dashboard/MasterFundSurplusWidget";
import {
  fetchMasterOverview,
  type CorePlatformItem,
  type IntegratedPlatformItem,
  type MasterFundSurplus,
} from "@/lib/master-admin.functions";

export const Route = createFileRoute("/admin/platforms")({
  head: () => ({ meta: [{ title: "Trạng thái nền tảng & Tổng quan — CEO HN10 Master Admin" }] }),
  component: PlatformsPage,
});

function PlatformsPage() {
  const [loading, setLoading] = useState(true);
  const [corePlatforms, setCorePlatforms] = useState<CorePlatformItem[]>([]);
  const [integratedPlatforms, setIntegratedPlatforms] = useState<IntegratedPlatformItem[]>([]);
  const [fundSurplus, setFundSurplus] = useState<MasterFundSurplus | undefined>(undefined);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchMasterOverview();
      setCorePlatforms(res.platformStatus.corePlatforms);
      setIntegratedPlatforms(res.platformStatus.integratedPlatformsSummary.items);
      setFundSurplus(res.fundSurplus);
    } catch (err) {
      console.error("[PlatformsPage] Load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <AppShell>
      <div className="space-y-6">
        <MasterPlatformStatusBar
          corePlatforms={corePlatforms}
          integratedPlatforms={integratedPlatforms}
          onRefresh={loadData}
          isLoading={loading}
        />

        <MasterFundSurplusWidget data={fundSurplus} isLoading={loading} />
      </div>
    </AppShell>
  );
}
