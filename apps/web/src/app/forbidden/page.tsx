import type { Metadata } from "next";
import Link from "next/link";
import { ErrorScreen, errorButton } from "@/components/marketing/error-screen";

export const metadata: Metadata = { title: "No access", robots: { index: false } };

export default function ForbiddenPage() {
  return (
    <ErrorScreen
      code="403 · Forbidden"
      title="You don’t have access to this."
      description={
        <>
          <p>Your role in this organization doesn’t allow this page or action, or it belongs to an organization you’re not a member of.</p>
          <p className="mt-2">Ask an owner or admin to change your role. If you think this is a mistake, check that you are signed in with the right account.</p>
        </>
      }
      details={[
        { label: "Roles that can approve", value: "Owner, Admin, Finance, Approver" },
        { label: "Roles that can change policy", value: "Owner, Admin" },
      ]}
      actions={
        <>
          <Link href="/app" className={errorButton.primary}>
            Back to the overview
          </Link>
          <Link href="/login" className={errorButton.secondary}>
            Sign in with another account
          </Link>
        </>
      }
    />
  );
}
