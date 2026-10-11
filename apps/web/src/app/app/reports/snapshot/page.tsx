import type { Metadata } from "next";
import { SnapshotView } from "@/components/app/reports/snapshot-view";

export const metadata: Metadata = { title: "Treasury snapshot" };

export default function SnapshotPage() {
  return <SnapshotView />;
}
