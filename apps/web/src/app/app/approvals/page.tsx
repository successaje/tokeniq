"use client";

import { CheckSquare, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ProposalStatusBadge } from "@/components/app/approvals/status";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Money } from "@/components/ui/money";
import { PageHeader } from "@/components/ui/page-header";
import { Segmented } from "@/components/ui/segmented";
import { Skeleton } from "@/components/ui/skeleton";
import { Callout, StatusBadge } from "@/components/ui/status";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { relativeTime } from "@/lib/format";
import { useOrgQuery } from "@/lib/org";
import type { ProposalListItem } from "@/lib/types";

const CHAIN: Record<number, string> = { 1: "Ethereum", 8453: "Base", 42161: "Arbitrum One", 10: "OP Mainnet", 84532: "Base Sepolia", 11155111: "Sepolia" };

function yourAction(p: ProposalListItem): string | null {
  if (p.status === "pending_approval" && !p.proposerIsYou && !p.yourDecision) return "Your review";
  if (p.status === "awaiting_signatures") return "Owners to sign";
  if (p.status === "ready_to_execute") return "Ready to submit";
  if (p.status === "stale") return "Re-prepare";
  return null;
}

export default function ApprovalsPage() {
  const [tab, setTab] = useState<"active" | "closed">("active");
  const q = useOrgQuery<{ proposals: ProposalListItem[] }>(`/proposals?status=${tab}`);
  return (
    <div>
      <PageHeader
        title="Approvals"
        description="Every action that moves funds passes three separate gates: internal approval in TokenIQ, Safe owner signatures in their own wallets, and on-chain execution."
        actions={<Segmented label="Show proposals" value={tab} onValueChange={setTab} options={[{ value: "active", label: "In progress" }, { value: "closed", label: "Closed" }]} />}
      />
      {q.isLoading ? (
        <div className="space-y-2" role="status" aria-live="polite">
          <span className="sr-only">Loading proposals…</span>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[72px]" />
          ))}
        </div>
      ) : q.isError ? (
        <Callout tone="danger" title="Couldn't load proposals" action={<Button size="sm" variant="secondary" onClick={() => q.refetch()}>Try again</Button>}>
          {(q.error as Error).message}
        </Callout>
      ) : q.data!.proposals.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title={tab === "active" ? "Nothing waiting for approval" : "No closed proposals yet"}
          description={tab === "active" ? "Proposals appear here when a finance member turns a recommendation into an action. Each one is re-checked against policy before anyone can sign." : "Executed, rejected, expired and cancelled proposals are kept here with their full history."}
          actions={tab === "active" ? <Button size="sm" variant="secondary" asChild><Link href="/app/recommendations">See recommendations</Link></Button> : undefined}
        />
      ) : (
        <Card>
          <ul className="divide-y divide-hairline">
            {q.data!.proposals.map((p) => {
              const action = yourAction(p);
              return (
                <li key={p.id}>
                  <Link href={`/app/approvals/${p.id}`} className="group flex items-center gap-4 px-4 py-3.5 hover:bg-sunken/60 sm:px-5">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-medium text-text">{p.title}</span>
                        <ProposalStatusBadge status={p.status} />
                        {action && <StatusBadge tone="accent" icon={null}>{action}</StatusBadge>}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-text-3">
                        <span>{CHAIN[p.chainId] ?? `Chain ${p.chainId}`}</span>
                        <span>by {p.proposerIsYou ? "you" : p.proposer}</span>
                        <span>{relativeTime(p.createdAt)}</span>
                        {p.status === "pending_approval" && <span>expires {relativeTime(p.expiresAt)}</span>}
                      </div>
                    </div>
                    <div className="hidden text-right text-xs text-text-2 sm:block">
                      <div className={cn(p.approvals.have >= p.approvals.need && p.approvals.roleRequirementMet ? "text-success" : "")}>
                        Approvals {p.approvals.have}/{p.approvals.need}
                      </div>
                      <div>Signatures {p.signatures}</div>
                    </div>
                    <Money value={p.amountUsd} compact className="w-24 text-right text-sm font-medium" />
                    <ChevronRight className="size-4 shrink-0 text-text-3" aria-hidden="true" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
