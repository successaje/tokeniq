import type { Metadata } from "next";

export const metadata: Metadata = { title: "Copilot" };

export default function CopilotLayout({ children }: { children: React.ReactNode }) {
  return children;
}
