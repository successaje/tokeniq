import type { Metadata } from "next";
import { Suspense } from "react";
import { ActivityView } from "@/components/app/activity/activity-view";

export const metadata: Metadata = { title: "Activity" };

export default function ActivityPage() {
  return (
    <Suspense>
      <ActivityView />
    </Suspense>
  );
}
