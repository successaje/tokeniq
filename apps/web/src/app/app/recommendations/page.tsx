import type { Metadata } from "next";
import { Suspense } from "react";
import { RecommendationsView } from "@/components/app/recommendations/recommendations-view";

export const metadata: Metadata = { title: "Recommendations" };

export default function RecommendationsPage() {
  return (
    <Suspense>
      <RecommendationsView />
    </Suspense>
  );
}
