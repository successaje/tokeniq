import type { Metadata } from "next";
import { AppShell } from "@/components/shell/app-shell";

export const metadata: Metadata = { title: { default: "Overview", template: "%s · TokenIQ" }, robots: { index: false } };

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
