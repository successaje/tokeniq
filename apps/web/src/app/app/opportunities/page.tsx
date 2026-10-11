import type { Metadata } from "next";
import { Suspense } from "react";
import { OpportunitiesView } from "@/components/app/opportunities/opportunities-view";

export const metadata: Metadata = { title: "Opportunities" };

export default function OpportunitiesPage() {
  return (
    <Suspense>
      <OpportunitiesView />
    </Suspense>
  );
}
