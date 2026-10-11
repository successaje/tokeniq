import type { Metadata } from "next";
import { Suspense } from "react";
import { SettingsView } from "@/components/app/settings/settings-view";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsView />
    </Suspense>
  );
}
