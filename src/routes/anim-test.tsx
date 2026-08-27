import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { ActivityListScreen } from "@/components/ActivityListScreen";
const A = lazy(() => import("@/components/JournalSuccessAnimation"));
const repo = {
  list: async () => [],
  save: async () => [{ id: "1", created_at: new Date().toISOString(), body: "x" }],
  remove: async () => [],
};
export const Route = createFileRoute("/anim-test")({
  component: () => (
    <ActivityListScreen
      title="t" subtitle="s" cacheKey="journal" repo={repo}
      mainField="body" mainPlaceholder="ph" multiline emptyText="empty"
      successAnimation={<Suspense fallback={null}><A /></Suspense>}
    />
  ),
});
