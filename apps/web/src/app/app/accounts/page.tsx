import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountsView } from "@/components/app/accounts/accounts-view";

export const metadata: Metadata = { title: "Accounts" };

export default function AccountsPage() {
  return (
    <Suspense>
      <AccountsView />
    </Suspense>
  );
}
