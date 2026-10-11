"use client";

import { Puzzle, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddressText, ChainLabel, Freshness } from "@/components/ui/identity";
import { Sheet } from "@/components/ui/sheet";
import { Callout, StatusBadge } from "@/components/ui/status";
import type { TreasuryAccountDto } from "@/lib/types";
import { VerificationStatus } from "./account-badges";
import { hasGuard, purposeLabel, safeVersionNote } from "./labels";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-3 py-2 text-[13px]">
      <dt className="text-text-2">{label}</dt>
      <dd className="min-w-0 text-text">{children}</dd>
    </div>
  );
}

/** Owners, threshold, version, guard and modules: who can move funds out of this Safe. */
export function SafeDetailsSheet({
  open,
  onOpenChange,
  account,
  explorerBase,
  onVerify,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  account: TreasuryAccountDto | null;
  explorerBase: string | null;
  onVerify?: () => void;
}) {
  const a = account;
  const safe = a?.safe;
  const note = safeVersionNote(safe?.version);
  const link = (addr: string) => (explorerBase ? `${explorerBase}/address/${addr}` : null);
  const signerStillOwner = a?.verificationSigner && safe ? safe.owners.some((o) => o.toLowerCase() === a.verificationSigner!.toLowerCase()) : true;
  const sample = a?.verificationMethod === "sample";

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={a ? a.label : "Safe details"} description={a ? "Who can move funds out of this Safe, as last read on-chain." : undefined}>
      {a && (
        <div className="space-y-5">
          <dl className="divide-y divide-hairline">
            <Row label="Network">
              <ChainLabel chainId={a.chainId} name={a.chain} />
            </Row>
            <Row label="Address">
              <AddressText address={a.address} explorer={a.explorer} full />
            </Row>
            <Row label="Purpose">{purposeLabel(a.purpose)}</Row>
            <Row label="Verification">
              <VerificationStatus account={a} />
            </Row>
            <Row label="Last read">
              <Freshness at={a.lastSyncedAt} />
            </Row>
          </dl>

          {sample && <Callout tone="neutral">This is a simulated sample Safe. Its owners and modules are not read from any chain.</Callout>}

          <section aria-labelledby="owners-heading">
            <h3 id="owners-heading" className="flex items-center gap-1.5 text-[13px] font-semibold text-text">
              <Users className="size-4 text-text-2" aria-hidden="true" />
              Owners and threshold
            </h3>
            <p className="mt-1 text-[13px] text-text-2">
              {safe?.threshold ? (
                <>
                  <span className="font-medium text-text">
                    {safe.threshold} of {safe.owners.length || "?"}
                  </span>{" "}
                  owner signatures are needed to execute a transaction.
                </>
              ) : (
                "Threshold not read yet."
              )}
            </p>
            {safe && safe.owners.length > 0 ? (
              <ul className="mt-2 divide-y divide-hairline rounded-[var(--radius-control)] border border-hairline" aria-label="Owners">
                {safe.owners.map((o) => (
                  <li key={o} className="flex items-center justify-between gap-2 px-3 py-2">
                    <AddressText address={o} explorer={link(o)} />
                    {a.verificationSigner && o.toLowerCase() === a.verificationSigner.toLowerCase() && (
                      <StatusBadge tone="success" icon={ShieldCheck}>
                        Verified signer
                      </StatusBadge>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              !sample && <p className="mt-2 text-xs text-text-3">Owners will appear after the next successful sync.</p>
            )}
            {!signerStillOwner && (
              <Callout tone="warning" className="mt-2" title="The verifying signer is no longer listed as an owner">
                TokenIQ revokes the verification on the next sync. Verify again with a current owner.
              </Callout>
            )}
          </section>

          <section aria-labelledby="version-heading">
            <h3 id="version-heading" className="text-[13px] font-semibold text-text">
              Contract version
            </h3>
            <dl className="mt-1 divide-y divide-hairline">
              <Row label="Version">{safe?.version ? `v${safe.version}` : "Unknown"}</Row>
              <Row label="Nonce">
                <span className="num">{safe?.nonce ?? "—"}</span>
                {safe?.nonce && <span className="ml-1 text-xs text-text-3">transactions executed</span>}
              </Row>
              <Row label="Guard">
                {hasGuard(safe?.guard) ? (
                  <span className="block">
                    <AddressText address={safe!.guard!} explorer={link(safe!.guard!)} />
                    <span className="block text-xs text-text-3">Checks every owner transaction before it executes.</span>
                  </span>
                ) : (
                  <span className="text-text-2">None set</span>
                )}
              </Row>
            </dl>
            {note && (
              <Callout tone={note.tone === "danger" ? "danger" : "info"} className="mt-2" title={note.title}>
                {note.body}
              </Callout>
            )}
          </section>

          <section aria-labelledby="modules-heading">
            <h3 id="modules-heading" className="flex items-center gap-1.5 text-[13px] font-semibold text-text">
              <Puzzle className="size-4 text-text-2" aria-hidden="true" />
              Modules
            </h3>
            {safe && safe.modules.length > 0 ? (
              <>
                <Callout tone="warning" className="mt-2" title={`${safe.modules.length} module${safe.modules.length === 1 ? " is" : "s are"} enabled`}>
                  Modules can move funds without owner signatures. Make sure your team recognises each one, and disable any you don&apos;t in Safe&#123;Wallet&#125;.
                </Callout>
                <ul className="mt-2 divide-y divide-hairline rounded-[var(--radius-control)] border border-hairline" aria-label="Enabled modules">
                  {safe.modules.map((m) => (
                    <li key={m} className="px-3 py-2">
                      <AddressText address={m} explorer={link(m)} />
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="mt-1 text-[13px] text-text-2">{safe ? "No modules enabled. Only the owners above can move funds." : "Not read yet."}</p>
            )}
          </section>

          {!a.verified && !sample && onVerify && (
            <div className="rounded-[var(--radius-card)] border border-dashed border-hairline p-3">
              <p className="text-[13px] text-text-2">This Safe&apos;s balance is excluded from reserve maths until an owner signs a verification message.</p>
              <Button size="sm" className="mt-2" onClick={onVerify}>
                Verify control
              </Button>
            </div>
          )}
        </div>
      )}
    </Sheet>
  );
}
