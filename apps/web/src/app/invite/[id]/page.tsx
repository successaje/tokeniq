import type { Metadata } from "next";
import { InviteView } from "./invite-view";

export const metadata: Metadata = { title: "Invitation", robots: { index: false, follow: false } };

export default function InvitePage() {
  return <InviteView />;
}
