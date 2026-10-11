"use client";

import { History } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Segmented } from "@/components/ui/segmented";
import { Skeleton } from "@/components/ui/skeleton";
import { Callout, StatusBadge } from "@/components/ui/status";
import { dateTimeLabel } from "@/lib/format";
import { useOrgQuery } from "@/lib/org";
import type { PolicyVersionDto } from "@/lib/types";
import { useMetaIndex } from "../treasury/meta";
import { ChangeList } from "./policy-editor";

/** Every saved policy version with who changed what, and why. Versions are append-only. */
export function PolicyHistory({ currentVersion }: { currentVersion: number }) {
  const q = useOrgQuery<{ versions: PolicyVersionDto[] }>("/policies/history");
  const { chains } = useMetaIndex();
  const [kind, setKind] = useState<"treasury" | "approval">("treasury");
  const [all, setAll] = useState(false);
  const chainName = (id: number) => chains.get(id)?.name ?? `Chain ${id}`;
  const versions = (q.data?.versions ?? []).filter((v) => v.kind === kind);
  const shown = all ? versions : versions.slice(0, 5);

  return (
    <Card>
      <CardHeader
        title="Policy history"
        description="Each save creates a new version. Earlier versions are never edited."
        action={
          <Segmented
            label="Policy"
            size="sm"
            value={kind}
            onValueChange={setKind}
            options={[
              { value: "treasury", label: "Treasury" },
              { value: "approval", label: "Approvals" },
            ]}
          />
        }
      />
      <CardBody className="pt-3">
        {q.isLoading ? (
          <div className="space-y-3" role="status" aria-label="Loading policy history">
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
          </div>
        ) : q.isError ? (
          <Callout tone="danger" title="Couldn't load the history" action={<Button variant="secondary" size="sm" onClick={() => q.refetch()}>Try again</Button>}>
            {(q.error as Error).message}
          </Callout>
        ) : versions.length === 0 ? (
          <p className="flex items-center gap-2 text-[13px] text-text-2">
            <History className="size-4 text-text-3" aria-hidden="true" />
            {kind === "treasury" ? "No saved versions yet. The default balanced policy applies until someone saves a change." : "No approval policy versions yet. The default approval tiers apply."}
          </p>
        ) : (
          <ol className="relative space-y-4 border-l border-hairline pl-4">
            {shown.map((v) => (
              <li key={v.id} className="relative">
                <span aria-hidden="true" className="absolute -left-[21px] top-1 size-2.5 rounded-full border-2 border-surface bg-border-strong" />
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-[13px] font-semibold text-text">Version {v.version}</span>
                  {kind === "treasury" && v.version === currentVersion && (
                    <StatusBadge tone="success" icon={null}>
                      Current
                    </StatusBadge>
                  )}
                  <span className="text-xs text-text-3">
                    {v.author} · {dateTimeLabel(v.createdAt)}
                  </span>
                </div>
                {v.reason && <p className="mt-0.5 text-[13px] text-text-2">“{v.reason}”</p>}
                {v.changes.length === 0 ? (
                  <p className="mt-1 text-xs text-text-3">{v.version === 1 ? "First saved version." : "Saved without field changes."}</p>
                ) : kind === "treasury" ? (
                  <ChangeList changes={v.changes} chainName={chainName} />
                ) : (
                  <ul className="mt-1 space-y-0.5 text-xs text-text-2">
                    {v.changes.map((c) => (
                      <li key={c.field}>
                        {c.field === "tiers" ? "Approval tiers" : c.field === "allowSelfApproval" ? "Proposers may approve their own proposals" : c.field === "proposalTtlHours" ? "Proposal expiry (hours)" : c.field}: <span className="text-text-3">{summary(c.from)}</span> → <span className="font-medium text-text">{summary(c.to)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>
        )}
        {versions.length > 5 && (
          <button type="button" className="mt-3 text-xs font-medium text-accent hover:underline" onClick={() => setAll((x) => !x)} aria-expanded={all}>
            {all ? "Show recent only" : `Show all ${versions.length} versions`}
          </button>
        )}
      </CardBody>
    </Card>
  );
}

function summary(v: unknown): string {
  if (v === null || v === undefined) return "Not set";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (Array.isArray(v)) {
    return v
      .map((t) => {
        const tier = t as { upToUsd?: string | null; requiredApprovals?: number; requiredRole?: string | null };
        if (tier && typeof tier === "object" && "requiredApprovals" in tier) return `${tier.upToUsd ? `≤ $${tier.upToUsd}` : "above"}: ${tier.requiredApprovals}${tier.requiredRole ? ` incl. ${tier.requiredRole}` : ""}`;
        return String(t);
      })
      .join("; ");
  }
  return typeof v === "object" ? JSON.stringify(v) : String(v);
}
