import type { Metadata } from "next";
import { TeamView } from "@/components/app/team/team-view";

export const metadata: Metadata = { title: "Team" };

export default function TeamPage() {
  return <TeamView />;
}
