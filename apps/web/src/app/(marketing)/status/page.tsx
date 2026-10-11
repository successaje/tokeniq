import type { Metadata } from "next";
import { Container, PageIntro } from "@/components/marketing/primitives";
import { StatusBoard } from "@/components/marketing/status-board";
import { pageMetadata } from "@/lib/marketing-site";

export const metadata: Metadata = pageMetadata({
  title: "System status",
  description: "Live status of the TokenIQ API, database, background sync, copilot, email and data providers, from TokenIQ’s own checks.",
  path: "/status",
});

export default function StatusPage() {
  return (
    <>
      <PageIntro
        eyebrow="Status"
        title="System status"
        lead="Measured by TokenIQ’s own checks when you load this page. A component that has never been checked is shown as unknown, never as operational."
      />
      <Container className="max-w-[880px] pb-24 pt-10">
        <StatusBoard />
      </Container>
    </>
  );
}
