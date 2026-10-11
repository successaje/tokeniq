import type { Metadata } from "next";

export const metadata: Metadata = { title: "Reserves" };

export default function ReservesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
