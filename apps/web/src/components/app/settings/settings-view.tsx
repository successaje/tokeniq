"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApprovalsTab } from "./approvals-tab";
import { OrganizationTab } from "./organization-tab";
import { PreferencesTab } from "./preferences-tab";
import { SecurityTab } from "./security-tab";

const TABS = ["organization", "approvals", "security", "preferences"] as const;
type Tab = (typeof TABS)[number];

export function SettingsView() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const raw = params.get("tab");
  const tab: Tab = (TABS as readonly string[]).includes(raw ?? "") ? (raw as Tab) : "organization";

  return (
    <div>
      <PageHeader title="Settings" description="Your organization, who must approve what, how you sign in, and how TokenIQ looks." />
      <Tabs value={tab} onValueChange={(v) => router.replace(`${pathname}?tab=${v}`, { scroll: false })}>
        <TabsList label="Settings sections">
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="approvals">Approvals</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>
        <TabsContent value="organization">
          <OrganizationTab />
        </TabsContent>
        <TabsContent value="approvals">
          <ApprovalsTab />
        </TabsContent>
        <TabsContent value="security">
          <SecurityTab />
        </TabsContent>
        <TabsContent value="preferences">
          <PreferencesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
