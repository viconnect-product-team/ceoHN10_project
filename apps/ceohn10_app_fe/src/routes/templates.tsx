import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/dashboard/AppShell";
import { PageTemplatesHub, type TemplateTab } from "@/components/templates/PageTemplatesHub";

type TemplatesSearch = {
  tab?: TemplateTab;
  type?: "excel" | "word" | "pdf";
};

export const Route = createFileRoute("/templates")({
  validateSearch: (search: Record<string, unknown>): TemplatesSearch => {
    const tab = search?.tab as TemplateTab | undefined;
    const type = search?.type as "excel" | "word" | "pdf" | undefined;
    return {
      tab: tab && ["excel", "word", "pdf", "invitation-setup"].includes(tab) ? tab : undefined,
      type: type && ["excel", "word", "pdf"].includes(type) ? type : undefined,
    };
  },
  component: TemplatesRouteComponent,
});

function TemplatesRouteComponent() {
  const search = Route.useSearch();
  const currentTab = search.tab || (search.type ? search.type : "excel");
  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto min-h-screen">
        <PageTemplatesHub key={`${currentTab}-${search.type}`} initialTab={currentTab} initialType={search.type} />
      </div>
    </AppShell>
  );
}
