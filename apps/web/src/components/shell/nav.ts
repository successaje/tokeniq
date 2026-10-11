import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  CalendarClock,
  CheckSquare,
  CircleHelp,
  FileText,
  Gauge,
  HandCoins,
  Landmark,
  Layers,
  LayoutDashboard,
  Lightbulb,
  MessageSquareText,
  Settings,
  ShieldAlert,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Badge source key resolved by the shell (pending approvals, active alerts). */
  badge?: "approvals" | "alerts";
  description: string;
}

export interface NavGroup {
  label: string | null;
  items: NavItem[];
}

/**
 * Navigation follows how often a treasury team does each job: daily overview and
 * approvals first, planning next, then monitoring, with administration last.
 */
export const NAV: NavGroup[] = [
  {
    label: null,
    items: [
      { href: "/app", label: "Overview", icon: LayoutDashboard, description: "What you control, owe, must protect, and can deploy" },
      { href: "/app/approvals", label: "Approvals", icon: CheckSquare, badge: "approvals", description: "Proposals waiting for review, signatures or execution" },
      { href: "/app/copilot", label: "Copilot", icon: MessageSquareText, description: "Ask questions about your treasury, with sources" },
    ],
  },
  {
    label: "Plan",
    items: [
      { href: "/app/obligations", label: "Obligations", icon: CalendarClock, description: "Payroll, vendors and other commitments" },
      { href: "/app/payments", label: "Payments", icon: HandCoins, description: "What was paid, verified on-chain" },
      { href: "/app/reserves", label: "Reserves", icon: Gauge, description: "Policy requirement, coverage and stress tests" },
    ],
  },
  {
    label: "Treasury",
    items: [
      { href: "/app/treasury", label: "Balances", icon: Landmark, description: "Holdings by asset, network and account" },
      { href: "/app/accounts", label: "Accounts", icon: Wallet, description: "Safes and wallets, verification and sync" },
      { href: "/app/allocations", label: "Allocations", icon: Layers, description: "Current positions in protocols" },
    ],
  },
  {
    label: "Decide",
    items: [
      { href: "/app/recommendations", label: "Recommendations", icon: Lightbulb, description: "Policy-checked proposals and why" },
      { href: "/app/opportunities", label: "Opportunities", icon: BarChart3, description: "Vetted venues and how they fit your policy" },
    ],
  },
  {
    label: "Monitor",
    items: [
      { href: "/app/risk", label: "Risk", icon: ShieldAlert, badge: "alerts", description: "Alerts with evidence and next steps" },
      { href: "/app/activity", label: "Activity", icon: Activity, description: "Complete audit trail" },
      { href: "/app/reports", label: "Reports", icon: FileText, description: "Snapshots and CSV exports" },
    ],
  },
];

export const SECONDARY_NAV: NavItem[] = [
  { href: "/app/team", label: "Team", icon: Users, description: "Members, roles and invitations" },
  { href: "/app/settings", label: "Settings", icon: Settings, description: "Policies, approvals, security and preferences" },
  { href: "/app/help", label: "Help", icon: CircleHelp, description: "Guides and how calculations work" },
];

export const MOBILE_TABS: NavItem[] = [
  NAV[0]!.items[0]!,
  NAV[1]!.items[0]!,
  NAV[0]!.items[1]!,
  NAV[0]!.items[2]!,
];

export const ALL_NAV: NavItem[] = [...NAV.flatMap((g) => g.items), ...SECONDARY_NAV];

export const EXTRA_ICONS = { Bell, BookOpen };
