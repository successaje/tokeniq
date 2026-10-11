"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Eye, FlaskConical, KeyRound, Plus, ShieldCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { VerificationStatus } from "@/components/app/accounts/account-badges";
import { AddAccountForm, AddAccountResult, useAddAccount } from "@/components/app/accounts/add-account-form";
import { kindLabel, useMeta } from "@/components/app/accounts/labels";
import { VerifySheet } from "@/components/app/accounts/verify-sheet";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { AddressText, ChainLabel } from "@/components/ui/identity";
import { Skeleton } from "@/components/ui/skeleton";
import { Callout } from "@/components/ui/status";
import { api, orgPath } from "@/lib/api";
import { rememberOrg } from "@/lib/org";
import type { MeDto, OrgDto, TreasuryAccountDto } from "@/lib/types";
import { EditOrganizationButton, OnboardingStep, StepActions, useSaveProgress } from "./onboarding-step";
import { can } from "./use-onboarding-org";

export function TreasuryStep() {
  return (
    <OnboardingStep
      step={2}
      title="Add your first treasury account"
      description="Paste the address of a Safe or wallet your organization uses. TokenIQ reads its balances from the chain and shows you what it found."
    >
      {(ctx) => <TreasuryStepBody {...ctx} />}
    </OnboardingStep>
  );
}

function TreasuryStepBody({ me, org, orgId }: { me: MeDto; org: OrgDto; orgId: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const wantsSample = params.get("sample") === "1";
  const qc = useQueryClient();
  const meta = useMeta();
  const accounts = useQuery({ queryKey: ["org", orgId, "/accounts"], queryFn: ({ signal }) => api<{ accounts: TreasuryAccountDto[] }>(orgPath(orgId, "/accounts"), { signal }) });
  const add = useAddAccount(orgId);
  const progress = useSaveProgress(orgId);
  const [adding, setAdding] = useState(false);
  const [verifying, setVerifying] = useState<TreasuryAccountDto | null>(null);
  const allowed = can(org.role, "accounts.manage");

  const existingSample = me.organizations.find((o) => o.isSample);
  const sample = useMutation({
    mutationFn: async () => (existingSample ? { organizationId: existingSample.id } : api<{ organizationId: string }>("/api/v1/sample-workspace", { method: "POST", body: {} })),
    onSuccess: async ({ organizationId }) => {
      rememberOrg(organizationId);
      await qc.refetchQueries({ queryKey: ["me"] });
      router.push("/app");
    },
  });

  const list = accounts.data?.accounts ?? [];
  const result = add.data;
  const showForm = allowed && !result && (list.length === 0 || adding);

  const next = () =>
    progress.mutate(
      { step: "treasury" },
      { onSuccess: () => router.push("/onboarding/obligations") },
    );

  return (
    <div>
      {wantsSample && (
        <Callout tone="info" className="mb-4" title="Looking for the sample workspace?" action={<Button size="sm" variant="secondary" loading={sample.isPending} onClick={() => sample.mutate()}>{existingSample ? "Open sample" : "Create sample"}</Button>}>
          It has simulated balances and obligations, is clearly labelled, and nothing in it can be signed or executed. Your organization stays as it is.
        </Callout>
      )}

      <ul className="mb-5 grid gap-3 sm:grid-cols-3">
        {[
          { icon: ShieldCheck, title: "A Safe is recommended", body: "Multi-signature control, and TokenIQ can prepare payments for your owners to sign." },
          { icon: Eye, title: "Read-only", body: "TokenIQ only reads balances. It never asks for keys and can't move funds." },
          { icon: KeyRound, title: "Verify now or later", body: "An owner signs a free message to prove control. Until then it's excluded from reserve maths." },
        ].map((f) => (
          <li key={f.title} className="rounded-[var(--radius-card)] border border-hairline bg-surface p-3">
            <f.icon className="size-4 text-text-2" aria-hidden="true" />
            <div className="mt-1.5 text-[13px] font-medium text-text">{f.title}</div>
            <p className="mt-0.5 text-xs text-text-2">{f.body}</p>
          </li>
        ))}
      </ul>

      {accounts.isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className="space-y-4">
          {list.length > 0 && !result && (
            <Card>
              <CardBody>
                <h2 className="text-[13px] font-medium text-text-2">
                  Already tracked ({list.length})
                </h2>
                <ul className="mt-2 divide-y divide-hairline">
                  {list.map((a) => (
                    <li key={a.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-medium text-text">{a.label}</div>
                        <div className="flex flex-wrap items-center gap-x-2 text-xs text-text-3">
                          <ChainLabel chainId={a.chainId} name={a.chain} />
                          <span>{kindLabel(a)}</span>
                          <AddressText address={a.address} explorer={a.explorer} />
                        </div>
                      </div>
                      <VerificationStatus account={a} compact />
                      {!a.verified && a.verificationMethod !== "sample" && (
                        <Button size="sm" variant="ghost" onClick={() => setVerifying(a)}>
                          Verify
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
                {allowed && !adding && (
                  <Button variant="secondary" size="sm" className="mt-2" onClick={() => setAdding(true)}>
                    <Plus className="size-4" aria-hidden="true" /> Add another account
                  </Button>
                )}
              </CardBody>
            </Card>
          )}

          {!allowed && (
            <Callout tone="neutral" title="Your role can't add accounts">
              Owners, admins and finance members add accounts. You can continue setup and add accounts later.
            </Callout>
          )}

          {showForm && (
            <Card>
              <CardBody>
                <AddAccountForm id="onboarding-add-account" mutation={add} compact autoFocus={list.length === 0} />
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Button type="submit" form="onboarding-add-account" loading={add.isPending} loadingLabel="Reading the address on-chain">
                    {add.isPending ? "Reading on-chain…" : "Add account"}
                  </Button>
                  {list.length > 0 && (
                    <Button variant="ghost" onClick={() => setAdding(false)}>
                      Cancel
                    </Button>
                  )}
                  <span className="text-xs text-text-3">Takes a few seconds: TokenIQ reads the address on-chain.</span>
                </div>
              </CardBody>
            </Card>
          )}

          {result && (
            <>
              <AddAccountResult orgId={orgId} result={result} compact />
              <div className="flex flex-wrap gap-2">
                {result.account.verificationMethod !== "sample" && (
                  <Button variant="secondary" onClick={() => setVerifying(result.account)}>
                    <ShieldCheck className="size-4" aria-hidden="true" /> Verify control now
                  </Button>
                )}
                <Button
                  variant="ghost"
                  onClick={() => {
                    add.reset();
                    setAdding(true);
                  }}
                >
                  <Plus className="size-4" aria-hidden="true" /> Add another
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {progress.error && (
        <Callout tone="danger" className="mt-4">
          Couldn&apos;t save your progress: {progress.error.message}
        </Callout>
      )}
      {sample.error && !wantsSample && (
        <Callout tone="danger" className="mt-4">
          {sample.error.message}
        </Callout>
      )}

      <StepActions
        back={<EditOrganizationButton org={org} />}
        secondary={
          list.length === 0 && !result ? (
            <Button variant="ghost" className="h-11 sm:h-9" onClick={() => router.push("/onboarding/obligations")}>
              Skip for now
            </Button>
          ) : undefined
        }
        primary={
          <Button className="h-11 sm:h-9" disabled={list.length === 0 && !result} loading={progress.isPending} onClick={next}>
            Continue <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        }
      />

      {!wantsSample && (
        <div className="mt-6 rounded-[var(--radius-card)] border border-dashed border-hairline p-4 text-sm text-text-2">
          <FlaskConical className="mr-1.5 inline size-4 align-[-3px] text-text-3" aria-hidden="true" />
          Not ready to connect real accounts?{" "}
          <Button variant="link" onClick={() => sample.mutate()} loading={sample.isPending}>
            {existingSample ? "Open your sample workspace" : "Use a sample workspace instead"}
          </Button>{" "}
          with simulated balances. It&apos;s clearly labelled and separate from {org.name}.
        </div>
      )}

      <VerifySheet
        open={!!verifying}
        onOpenChange={(v) => {
          if (v) return;
          setVerifying(null);
          // Show the refreshed list (with the new verification state) instead of the stale add result.
          if (result) add.reset();
        }}
        orgId={orgId}
        account={verifying}
        explorerBase={verifying ? (meta.data?.chains.find((c) => c.id === verifying.chainId)?.explorer.replace(/\/$/, "") ?? null) : null}
      />
    </div>
  );
}
