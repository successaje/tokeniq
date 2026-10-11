import { CheckCircle2, CircleDashed, CircleDot } from "lucide-react";
import { cn } from "@/lib/cn";
import { IllustrationLabel } from "./primitives";

export const EXECUTION_STAGES = [
  {
    n: "1",
    title: "Deterministic checks",
    who: "Policy engine",
    what: "The reserve stays covered after the move, caps and allow-lists are respected, the venue meets policy, and the data is fresh. Any failure blocks the proposal.",
    evidence: "Check results stored with the proposal",
  },
  {
    n: "2",
    title: "Internal approval",
    who: "Your team, in TokenIQ",
    what: "The number of approvers depends on the amount. The proposer cannot approve their own proposal, and proposals expire if not approved in time.",
    evidence: "Who approved, when, under which policy version",
  },
  {
    n: "3",
    title: "Safe signatures",
    who: "Your Safe owners, in their wallets",
    what: "TokenIQ prepares the exact transaction and shows what it does. Owners sign; the Safe enforces its own threshold.",
    evidence: "Signatures checked against current Safe owners",
  },
  {
    n: "4",
    title: "On-chain execution",
    who: "Any signer submits",
    what: "The transaction is simulated before submission. TokenIQ never holds a key and cannot submit on its own.",
    evidence: "Transaction hash and Safe execution event",
  },
  {
    n: "5",
    title: "Reconciliation",
    who: "TokenIQ verifies",
    what: "Submitting is not success. TokenIQ tracks the receipt and the Safe’s execution event until confirmed, then refreshes balances and positions.",
    evidence: "Failures are shown as failures",
  },
] as const;

export function ExecutionStages({ className }: { className?: string }) {
  return (
    <ol className={cn("grid border-t border-hairline md:grid-cols-5", className)}>
      {EXECUTION_STAGES.map((s, i) => (
        <li key={s.n} className={cn("relative border-b border-hairline py-5 md:border-b-0 md:py-6 md:pr-5", i > 0 && "md:border-l md:border-hairline md:pl-5")}>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-[11px] text-text-3" aria-hidden="true">
              {s.n.padStart(2, "0")}
            </span>
            <h3 className="text-[15px] font-semibold leading-6 text-text">{s.title}</h3>
          </div>
          <p className="mt-1 text-xs font-medium text-accent">{s.who}</p>
          <p className="mt-2 text-[13px] leading-5 text-text-2">{s.what}</p>
          <p className="mt-3 text-xs text-text-3">Evidence: {s.evidence}</p>
        </li>
      ))}
    </ol>
  );
}

type TrackState = "done" | "partial" | "waiting";

const TRACKS: Array<{ name: string; meaning: string; state: TrackState; status: string; detail: string }> = [
  { name: "Internal approval", meaning: "Your team agrees", state: "done", status: "Approved · 2 of 2", detail: "Finance lead and an owner" },
  { name: "Safe signatures", meaning: "Owners authorise the transaction", state: "partial", status: "1 of 2 signatures", detail: "Waiting for one more owner" },
  { name: "On-chain execution", meaning: "The transaction runs", state: "waiting", status: "Not submitted", detail: "Available once the threshold is met" },
];

const icon: Record<TrackState, typeof CheckCircle2> = { done: CheckCircle2, partial: CircleDot, waiting: CircleDashed };
const tone: Record<TrackState, string> = { done: "text-success", partial: "text-accent", waiting: "text-text-3" };

/** One proposal, three separate tracks: approval is not a signature, and a signature is not execution. */
export function ProposalTracks({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-[var(--radius-card)] border border-hairline bg-surface", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-hairline px-4 py-4 sm:px-5">
        <div className="min-w-0">
          <p className="text-xs text-text-3">Proposal · allocate</p>
          <p className="mt-0.5 text-[15px] font-semibold text-text">
            Deposit <span className="num">$250,000</span> USDC into Example USDC vault
          </p>
          <p className="mt-0.5 text-xs text-text-2">From Operations Safe on Base · 2-of-3 Safe</p>
        </div>
        <IllustrationLabel />
      </div>
      <ul className="divide-y divide-hairline">
        {TRACKS.map((t) => {
          const Icon = icon[t.state];
          return (
            <li key={t.name} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-0.5 px-4 py-3 sm:grid-cols-[11rem_minmax(0,1fr)_auto] sm:px-5">
              <div>
                <p className="text-[13px] font-medium text-text">{t.name}</p>
                <p className="text-xs text-text-3">{t.meaning}</p>
              </div>
              <p className="order-3 col-span-2 text-xs text-text-2 sm:order-none sm:col-span-1">{t.detail}</p>
              <p className={cn("inline-flex items-center gap-1.5 justify-self-end text-[13px] font-medium", tone[t.state])}>
                <Icon className="size-4" aria-hidden="true" />
                <span className="text-text">{t.status}</span>
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
