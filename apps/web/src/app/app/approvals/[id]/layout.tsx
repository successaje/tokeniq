import type { Metadata } from "next";

// Absolute: the parent approvals layout sets a plain title, which does not pass the "%s · TokenIQ" template down.
export const metadata: Metadata = { title: { absolute: "Proposal · TokenIQ" } };

export default function ProposalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
