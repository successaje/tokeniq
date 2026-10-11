import {
  Bell,
  Building2,
  CalendarClock,
  CheckSquare,
  FileDown,
  FileText,
  HandCoins,
  Lightbulb,
  Mail,
  Rocket,
  Scale,
  ShieldAlert,
  UserCog,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { describeTiers } from "@/components/app/settings/approval-text";
import { pct, usd } from "@/lib/format";
import { ROLE_LABEL } from "@/lib/org";
import type { ActivityEventDto, ApprovalTierDto, PolicyChangeDto, Role } from "@/lib/types";

export interface Described {
  icon: LucideIcon;
  /** Sentence after the actor's name, e.g. "invited ana@x.org as Finance". */
  text: ReactNode;
  href?: string;
  /** Quoted reason or comment. */
  quote?: string;
  /** Field-level changes (policy, obligation, organization updates). */
  changes?: Array<{ label: string; from: string; to: string }>;
}

export interface DescribeContext {
  memberName: (memberId: string | null) => string | null;
  chainName: (chainId: number) => string;
}

/** Filter options: action prefixes the API matches with LIKE 'prefix%'. */
export const ACTION_FILTERS: Array<{ value: string; label: string }> = [
  { value: "", label: "All activity" },
  { value: "proposal.", label: "Proposals and approvals" },
  { value: "payment.", label: "Payments" },
  { value: "obligation.", label: "Obligations" },
  { value: "policy.", label: "Policy changes" },
  { value: "recommendation.", label: "Recommendations" },
  { value: "alert.", label: "Alerts" },
  { value: "account.", label: "Accounts" },
  { value: "member.", label: "Members and roles" },
  { value: "invitation.", label: "Invitations" },
  { value: "organization.", label: "Organization" },
  { value: "report.", label: "Reports and exports" },
  { value: "onboarding.", label: "Onboarding" },
];

const roleLabel = (r: unknown) => (typeof r === "string" && r in ROLE_LABEL ? ROLE_LABEL[r as Role] : String(r ?? "unknown"));
const str = (v: unknown) => (typeof v === "string" ? v : v === null || v === undefined ? "" : String(v));

const AUTONOMY: Record<string, string> = { observe: "Observe only", approval_required: "Approval required", bounded_automation: "Bounded automation" };

type Fmt = (v: unknown, ctx: DescribeContext) => string;
const fUsd: Fmt = (v) => (v === null || v === undefined || v === "" ? "Not set" : usd(String(v)));
const fBps: Fmt = (v) => (typeof v === "number" ? pct(v, v % 100 === 0 ? 0 : 2) : "Not set");
const fBool: Fmt = (v) => (v ? "Yes" : "No");
const fList: Fmt = (v) => (Array.isArray(v) ? (v.length ? v.join(", ") : "None") : str(v));
const fN = (unit: string): Fmt => (v) => (typeof v === "number" ? `${v} ${unit}${v === 1 ? "" : "s"}` : "Not set");

const POLICY_FIELDS: Record<string, { label: string; fmt: Fmt }> = {
  monthlyBurnUsd: { label: "Monthly burn", fmt: fUsd },
  runwayMonths: { label: "Runway to protect", fmt: fN("month") },
  minimumReserveUsd: { label: "Minimum reserve", fmt: fUsd },
  obligationHorizonDays: { label: "Obligation horizon", fmt: fN("day") },
  obligationBufferBps: { label: "Obligation buffer", fmt: fBps },
  includeEstimatedObligations: { label: "Count estimated obligations", fmt: fBool },
  thinCoverageBps: { label: "Thin coverage threshold", fmt: fBps },
  haircutsBps: {
    label: "Haircuts",
    fmt: (v) => {
      if (!v || typeof v !== "object") return "None";
      const e = Object.entries(v as Record<string, number>);
      return e.length ? e.map(([k, b]) => `${k} ${pct(b, 2)}`).join(", ") : "None";
    },
  },
  includeUnverifiedInReserve: { label: "Count unverified accounts", fmt: fBool },
  reserveAssets: { label: "Reserve assets", fmt: (v) => (Array.isArray(v) && v.length === 0 ? "All stablecoins" : fList(v, undefined as never)) },
  maxDataAgeMinutes: { label: "Maximum data age", fmt: fN("minute") },
  maxDeployedBps: { label: "Maximum deployed", fmt: fBps },
  maxPerProtocolBps: { label: "Maximum per protocol", fmt: fBps },
  maxPerVenueBps: { label: "Maximum per venue", fmt: fBps },
  maxShareOfVenueLiquidityBps: { label: "Maximum share of venue liquidity", fmt: fBps },
  minVenueTvlUsd: { label: "Minimum venue TVL", fmt: fUsd },
  maxVenueFeeBps: { label: "Maximum venue fee", fmt: fBps },
  allowedChains: { label: "Allowed networks", fmt: (v, ctx) => (Array.isArray(v) ? (v.length ? v.map((id) => ctx.chainName(Number(id))).join(", ") : "None") : str(v)) },
  allowedAssets: { label: "Allowed assets", fmt: fList },
  allowedProtocols: { label: "Allowed protocols", fmt: fList },
  minActionUsd: { label: "Minimum action size", fmt: fUsd },
  autonomy: { label: "Autonomy", fmt: (v) => AUTONOMY[str(v)] ?? str(v) },
  tiers: { label: "Approval tiers", fmt: (v) => (Array.isArray(v) ? describeTiers(v as ApprovalTierDto[]) : str(v)) },
  allowSelfApproval: { label: "Proposer may approve", fmt: fBool },
  proposalTtlHours: { label: "Proposals expire after", fmt: fN("hour") },
  name: { label: "Name", fmt: (v) => str(v) || "—" },
  purpose: { label: "Purpose", fmt: (v) => str(v) || "Not set" },
};

const OBLIGATION_FIELDS: Record<string, { label: string; fmt: Fmt }> = {
  title: { label: "Title", fmt: (v) => str(v) },
  amount: { label: "Amount", fmt: (v) => str(v) },
  currency: { label: "Currency", fmt: (v) => str(v) },
  firstDueDate: { label: "First due date", fmt: (v) => str(v) },
  status: { label: "Status", fmt: (v) => str(v) },
  certainty: { label: "Certainty", fmt: (v) => str(v) },
  priority: { label: "Priority", fmt: (v) => str(v) },
  category: { label: "Category", fmt: (v) => str(v) },
  counterparty: { label: "Counterparty", fmt: (v) => str(v) || "None" },
  recipientAddress: { label: "Recipient", fmt: (v) => str(v) || "None" },
  invoiceNumber: { label: "Invoice number", fmt: (v) => str(v) || "None" },
  notes: { label: "Notes", fmt: (v) => str(v) || "None" },
  recurrence: {
    label: "Recurrence",
    fmt: (v) => {
      const r = v as { freq?: string; interval?: number } | null;
      if (!r || !r.freq) return "—";
      return r.freq === "once" ? "Once" : `Every ${r.interval && r.interval > 1 ? `${r.interval} ` : ""}${r.freq.replace(/ly$/, "")}${r.interval && r.interval > 1 ? "s" : ""}`;
    },
  },
};

function fieldLabel(field: string) {
  return field.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}

function policyChanges(list: unknown, ctx: DescribeContext): Described["changes"] {
  if (!Array.isArray(list)) return undefined;
  return (list as PolicyChangeDto[]).map((c) => {
    const f = POLICY_FIELDS[c.field];
    const fmt: Fmt = f?.fmt ?? ((v) => (typeof v === "object" ? JSON.stringify(v) : str(v)));
    return { label: f?.label ?? fieldLabel(c.field), from: fmt(c.from, ctx), to: fmt(c.to, ctx) };
  });
}

function obligationChanges(changed: unknown): Described["changes"] {
  if (!changed || typeof changed !== "object") return undefined;
  return Object.entries(changed as Record<string, { from: unknown; to: unknown }>).map(([k, v]) => {
    const f = OBLIGATION_FIELDS[k];
    const fmt: Fmt = f?.fmt ?? ((x) => (typeof x === "object" && x !== null ? JSON.stringify(x) : str(x) || "None"));
    return { label: f?.label ?? fieldLabel(k), from: fmt(v?.from, undefined as never), to: fmt(v?.to, undefined as never) };
  });
}

function money(amount: unknown, currency: unknown) {
  const a = str(amount);
  if (!a) return "";
  return currency === "EUR" ? `${usd(a).replace("$", "")} EUR` : usd(a);
}

/** Turn an audit event into a readable sentence. Unknown actions fall back to a neutral description. */
export function describeEvent(e: ActivityEventDto, ctx: DescribeContext): Described {
  const d = (e.data ?? {}) as Record<string, unknown>;
  const title = str(d.title);
  switch (e.action) {
    case "organization.created":
      return { icon: Building2, text: <>created the organization{d.name ? <> “{str(d.name)}”</> : null}{d.isSample ? " as a sample workspace" : ""}</>, href: "/app/settings?tab=organization" };
    case "organization.updated":
      return { icon: Building2, text: "updated the organization profile", href: "/app/settings?tab=organization", changes: Object.keys(d).map((k) => ({ label: POLICY_FIELDS[k]?.label ?? fieldLabel(k), from: "", to: POLICY_FIELDS[k]?.fmt(d[k], ctx) ?? str(d[k]) })) };
    case "onboarding.completed":
      return { icon: Rocket, text: "completed onboarding", href: "/app" };
    case "member.role_changed": {
      const name = ctx.memberName(e.targetId);
      return { icon: UserCog, text: <>changed {name ? <strong className="font-medium text-text">{name}</strong> : "a member"}’s role from {roleLabel(d.from)} to {roleLabel(d.to)}</>, href: "/app/team" };
    }
    case "member.removed":
      return { icon: UserCog, text: <>removed a member{d.role ? ` (${roleLabel(d.role)})` : ""} from the organization</>, href: "/app/team" };
    case "member.left":
      return { icon: UserCog, text: "left the organization", href: "/app/team" };
    case "invitation.created":
      return { icon: Mail, text: <>invited {str(d.email) || "someone"} as {roleLabel(d.role)}</>, href: "/app/team" };
    case "invitation.revoked":
      return { icon: Mail, text: "revoked an invitation", href: "/app/team" };
    case "invitation.accepted":
      return { icon: Mail, text: <>accepted an invitation and joined as {roleLabel(d.role)}</>, href: "/app/team" };
    case "obligation.created":
      return {
        icon: CalendarClock,
        text: (
          <>
            recorded the obligation “{title || "Untitled"}”{d.amount ? ` for ${money(d.amount, d.currency)}` : ""}
            {d.certainty ? ` (${str(d.certainty)})` : ""}
          </>
        ),
        href: e.targetId ? `/app/obligations/${encodeURIComponent(e.targetId)}` : "/app/obligations",
      };
    case "obligation.updated":
      return { icon: CalendarClock, text: "updated an obligation", href: e.targetId ? `/app/obligations/${encodeURIComponent(e.targetId)}` : undefined, changes: obligationChanges(d.changed) };
    case "obligation.cancelled":
      return { icon: CalendarClock, text: "cancelled an obligation", href: e.targetId ? `/app/obligations/${encodeURIComponent(e.targetId)}` : undefined, changes: obligationChanges(d.changed)?.filter((c) => c.label !== "Status") };
    case "obligation.document_uploaded":
      return { icon: FileText, text: <>attached {str(d.filename) || "a document"} to an obligation</>, href: e.targetId ? `/app/obligations/${encodeURIComponent(e.targetId)}` : undefined };
    case "policy.treasury_updated":
    case "policy.approval_updated": {
      const kind = e.action === "policy.treasury_updated" ? "treasury" : "approval";
      const version = e.targetId?.split(":")[1];
      return {
        icon: Scale,
        text: <>updated the {kind} policy{version ? ` to version ${version}` : ""}</>,
        href: kind === "treasury" ? "/app/reserves" : "/app/settings?tab=approvals",
        quote: str(d.reason) || undefined,
        changes: policyChanges(d.changes, ctx),
      };
    }
    case "recommendation.dismissed":
      return { icon: Lightbulb, text: <>dismissed the recommendation “{title || "Untitled"}”</>, href: e.targetId ? `/app/recommendations?show=all#${encodeURIComponent(e.targetId)}` : "/app/recommendations", quote: str(d.reason) || undefined };
    case "alert.acknowledged":
      return { icon: ShieldAlert, text: <>acknowledged the alert “{title || "Untitled"}”</>, href: "/app/risk" };
    case "report.exported":
      return { icon: FileDown, text: <>exported the {e.targetId ?? ""} CSV</>, href: "/app/reports" };
    case "proposal.created":
      return { icon: CheckSquare, text: <>created the proposal “{title || "Untitled"}”{d.amountUsd ? ` for ${usd(str(d.amountUsd))}` : ""}</>, href: e.targetId ? `/app/approvals/${encodeURIComponent(e.targetId)}` : "/app/approvals" };
    case "proposal.approved":
    case "proposal.rejected":
    case "proposal.cancelled":
    case "proposal.commented":
    case "proposal.prepared":
    case "proposal.signed":
    case "proposal.submitted":
    case "proposal.executed":
    case "proposal.failed":
    case "proposal.expired": {
      const verb: Record<string, string> = {
        "proposal.approved": "approved",
        "proposal.rejected": "rejected",
        "proposal.cancelled": "cancelled",
        "proposal.commented": "commented on",
        "proposal.prepared": "prepared the Safe transaction for",
        "proposal.signed": "signed the Safe transaction for",
        "proposal.submitted": "submitted the Safe transaction on-chain for",
        "proposal.executed": "confirmed on-chain execution of",
        "proposal.failed": "recorded a failed execution of",
        "proposal.expired": "marked as expired",
      };
      return {
        icon: CheckSquare,
        text: (
          <>
            {verb[e.action]} {title ? <>the proposal “{title}”</> : "a proposal"}
            {e.action === "proposal.signed" && typeof d.signatures === "number" && typeof d.threshold === "number" ? ` (${d.signatures} of ${d.threshold} signatures)` : ""}
            {e.action === "proposal.approved" && typeof d.approvals === "number" && typeof d.required === "number" ? ` (${d.approvals} of ${d.required} approvals)` : ""}
          </>
        ),
        href: e.targetId ? `/app/approvals/${encodeURIComponent(e.targetId)}` : "/app/approvals",
        quote: str(d.reason) || str(d.comment) || str(d.body) || undefined,
      };
    }
    case "payment.paid_verified":
    case "payment.paid_unverified":
    case "payment.skipped":
    case "payment.undone": {
      const due = str(d.dueDate) ? ` due ${str(d.dueDate)}` : "";
      const what = title ? `“${title}”${due}` : `an obligation${due}`;
      const text =
        e.action === "payment.paid_verified"
          ? <>recorded the payment of {what}, verified on-chain</>
          : e.action === "payment.paid_unverified"
            ? <>marked {what} as paid (not verified on-chain)</>
            : e.action === "payment.skipped"
              ? <>skipped {what}</>
              : <>undid the payment record for {what}</>;
      return { icon: HandCoins, text, href: e.targetId ? `/app/obligations/${encodeURIComponent(e.targetId)}` : "/app/payments", quote: str(d.reason) || str(d.note) || undefined };
    }
    default:
      break;
  }
  const [noun, ...rest] = e.action.split(".");
  const verb = rest.join(" ").replace(/_/g, " ");
  if (noun === "payment") return { icon: HandCoins, text: <>{verb || "updated"} a payment{title ? ` for “${title}”` : ""}</>, href: "/app/payments" };
  if (noun === "account") return { icon: Wallet, text: <>{verb || "updated"} {str(d.label) ? <>the account “{str(d.label)}”</> : "an account"}</>, href: "/app/accounts", changes: obligationChanges(d.changed) };
  if (noun === "alert") return { icon: Bell, text: <>{verb} an alert</>, href: "/app/risk" };
  return { icon: FileText, text: <>{verb || "changed"} {(noun ?? "record").replace(/_/g, " ")}</> };
}
