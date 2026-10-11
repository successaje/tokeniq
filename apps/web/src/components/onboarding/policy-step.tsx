"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { parseDecimal, wadToString } from "@tokeniq/core";
import { ArrowRight, Gauge, Rocket, Shield } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { AmountInput, Field } from "@/components/ui/field";
import { Money } from "@/components/ui/money";
import { RadioCards } from "@/components/ui/radio-cards";
import { Skeleton } from "@/components/ui/skeleton";
import { Callout } from "@/components/ui/status";
import { Stepper } from "@/components/ui/stepper";
import { ApiError, api, orgPath } from "@/lib/api";
import { pct, usd } from "@/lib/format";
import type { OrgDto, PoliciesDto, PolicyDto } from "@/lib/types";
import { BackLink, OnboardingStep, recordOnboarding, StepActions } from "./onboarding-step";
import { can } from "./use-onboarding-org";

type PresetId = "conservative" | "balanced" | "growth";
const PRESET_IDS: PresetId[] = ["conservative", "balanced", "growth"];
const PRESET_ICON = { conservative: Shield, balanced: Gauge, growth: Rocket } as const;
/** Fields a preset sets besides runway (which people may adjust separately). */
const SHAPE_FIELDS = ["obligationHorizonDays", "obligationBufferBps", "maxDeployedBps", "maxPerProtocolBps", "maxPerVenueBps"] as const;

function matchPreset(p: PolicyDto, presets: PoliciesDto["presets"]): PresetId | null {
  return PRESET_IDS.find((id) => SHAPE_FIELDS.every((f) => presets[id].policy[f] === p[f])) ?? null;
}

function times(burn: string | null, months: number): string | null {
  if (!burn) return null;
  try {
    return wadToString(parseDecimal(burn) * BigInt(months));
  } catch {
    return null;
  }
}

function validAmount(v: string) {
  if (v.trim() === "") return true;
  try {
    parseDecimal(v);
    return true;
  } catch {
    return false;
  }
}

export function PolicyStep() {
  return (
    <OnboardingStep
      step={4}
      title="How much must stay protected?"
      description="Pick a starting policy. It decides how much TokenIQ keeps in reserve and how much it may suggest deploying. Every action still needs your approval, and you can change it any time in Reserves."
    >
      {({ org, orgId }) => <PolicyBody org={org} orgId={orgId} />}
    </OnboardingStep>
  );
}

function PolicyBody({ org, orgId }: { org: OrgDto; orgId: string }) {
  const router = useRouter();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["org", orgId, "/policies"], queryFn: ({ signal }) => api<PoliciesDto>(orgPath(orgId, "/policies"), { signal }) });
  const [preset, setPreset] = useState<PresetId>("balanced");
  const [runway, setRunway] = useState(6);
  const [minReserve, setMinReserve] = useState("");
  const [problem, setProblem] = useState<{ tone: "danger" | "warning"; title: string; body: string } | null>(null);
  const initialised = useRef(false);
  const allowed = can(org.role, "policy.write");

  useEffect(() => {
    if (initialised.current || !q.data) return;
    initialised.current = true;
    const cur = q.data.treasury;
    setPreset(matchPreset(cur, q.data.presets) ?? "balanced");
    setRunway(cur.runwayMonths);
    setMinReserve(cur.minimumReserveUsd === "0" ? "" : cur.minimumReserveUsd);
  }, [q.data]);

  const finish = useMutation({
    mutationFn: async () => {
      const data = q.data!;
      const cur = data.treasury;
      const chosen = data.presets[preset].policy;
      const next: PolicyDto = { ...cur, runwayMonths: runway, minimumReserveUsd: minReserve.trim() || "0" };
      for (const f of SHAPE_FIELDS) (next as unknown as Record<string, unknown>)[f] = chosen[f];
      const changed = (["runwayMonths", "minimumReserveUsd", ...SHAPE_FIELDS] as const).some((f) => next[f] !== cur[f]);
      if (changed && allowed) {
        await api(orgPath(orgId, "/policies/treasury"), { method: "PUT", body: { policy: next, reason: "Onboarding: initial policy", expectedVersion: data.treasuryVersion } });
      }
      return recordOnboarding(org, { step: "policy", complete: true });
    },
    onMutate: () => setProblem(null),
    onSuccess: async () => {
      await qc.refetchQueries({ queryKey: ["me"] });
      qc.invalidateQueries({ predicate: (k) => k.queryKey[0] === "org" && k.queryKey[1] === orgId });
      router.push("/onboarding/complete");
    },
    onError: async (e) => {
      if (e instanceof ApiError && e.code === "policy_version_conflict") {
        await q.refetch();
        setProblem({ tone: "warning", title: "The policy changed while you were choosing", body: "Someone saved a newer version. Your choices are kept; review them and finish again to apply them on top of it." });
      } else if (e instanceof ApiError && e.status === 403) {
        setProblem({ tone: "warning", title: "Your role can't change the policy", body: "Only owners and admins set the treasury policy. You can finish setup with the current policy." });
      } else if (e instanceof ApiError && e.code === "validation_error") {
        setProblem({ tone: "danger", title: "Some values aren't valid", body: e.message });
      } else {
        setProblem({ tone: "danger", title: "Couldn't save the policy", body: (e as Error).message });
      }
    },
  });

  if (q.isLoading) return <Skeleton className="h-96 w-full" />;
  if (q.isError || !q.data) {
    return (
      <Callout tone="danger" title="Couldn't load the policy presets" action={<Button size="sm" variant="secondary" onClick={() => q.refetch()}>Try again</Button>}>
        {(q.error as Error)?.message}. Nothing was changed.
      </Callout>
    );
  }

  const data = q.data;
  const burn = data.treasury.monthlyBurnUsd;
  const chosen = data.presets[preset].policy;
  const runwayAmount = times(burn, runway);
  const minOk = validAmount(minReserve);

  const options = PRESET_IDS.map((id) => {
    const p = data.presets[id];
    const amt = times(burn, p.policy.runwayMonths);
    return {
      value: id,
      label: p.label,
      icon: PRESET_ICON[id],
      description: (
        <span className="mt-1 block space-y-1">
          <span className="block">
            <span className="font-medium text-text">{p.policy.runwayMonths} months</span> of spend protected{amt ? ` (${usd(amt, { compact: true })})` : ""}
          </span>
          <span className="block">
            Obligations due in <span className="font-medium text-text">{p.policy.obligationHorizonDays} days</span> covered, +{pct(p.policy.obligationBufferBps, 0)} buffer
          </span>
          <span className="block">
            At most <span className="font-medium text-text">{pct(p.policy.maxDeployedBps, 0)}</span> of the treasury deployed
          </span>
        </span>
      ),
    };
  });

  return (
    <div className="space-y-4">
      <RadioCards label="Starting policy" value={preset} onValueChange={(v) => {
        setPreset(v);
        setRunway(data.presets[v].policy.runwayMonths);
      }} options={options} columns={3} disabled={!allowed} />

      <Card>
        <CardHeader title="Adjust if you need to" description="Both are optional. The reserve is the largest of the rules below." />
        <CardBody className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <div className="text-[13px] font-medium text-text" id="runway-label">
              Runway to protect
            </div>
            <Stepper label="Runway to protect" value={runway} onValueChange={setRunway} min={0} max={36} format={(v) => (v === 0 ? "Off" : `${v} month${v === 1 ? "" : "s"}`)} />
            <p className="text-xs text-text-3">{burn ? (runwayAmount && runway > 0 ? <>Keeps <Money value={runwayAmount} /> protected at {usd(burn)} a month.</> : "The runway rule is off.") : <>Needs a monthly spend estimate. <Link href="/onboarding/obligations" className="font-medium text-accent hover:underline">Add it in the previous step</Link>.</>}</p>
          </div>
          <Field label="Minimum reserve" optional error={minOk ? null : "Enter an amount in dollars, e.g. 250000."} hint="A floor that stays protected whatever the other rules say.">
            {(p) => <AmountInput {...p} value={minReserve} onChange={setMinReserve} placeholder="0" disabled={!allowed} />}
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="What this means" />
        <CardBody className="pt-2">
          <p className="text-[13px] text-text-2">TokenIQ keeps the largest of these protected before suggesting anything:</p>
          <ul className="mt-2 space-y-1.5 text-[13px] text-text">
            <li>
              <span className="font-medium">Runway:</span> {runway === 0 ? "off" : `${runway} months of operating spend`}
              {runwayAmount && runway > 0 ? (
                <>
                  {" "}
                  = <Money value={runwayAmount} />
                </>
              ) : null}
            </li>
            <li>
              <span className="font-medium">Floor:</span> {minReserve.trim() && minOk ? <Money value={minReserve} /> : "none"}
            </li>
            <li>
              <span className="font-medium">Obligations:</span> everything due in the next {chosen.obligationHorizonDays} days, plus {pct(chosen.obligationBufferBps, 0)}
            </li>
          </ul>
          <p className="mt-3 text-[13px] text-text-2">
            Above that, at most {pct(chosen.maxDeployedBps, 0)} of the treasury may go into protocols ({pct(chosen.maxPerProtocolBps, 0)} per protocol). Unverified accounts don&apos;t count, and every action needs approval.
          </p>
        </CardBody>
      </Card>

      {!allowed && <Callout tone="neutral">Only owners and admins can change the policy. Finishing keeps the current one (version {data.treasuryVersion}).</Callout>}
      {problem && (
        <Callout tone={problem.tone} title={problem.title}>
          {problem.body}
        </Callout>
      )}

      <StepActions
        back={<BackLink href="/onboarding/obligations" />}
        primary={
          <Button className="h-11 sm:h-9" loading={finish.isPending} loadingLabel="Saving the policy" disabled={!minOk} onClick={() => finish.mutate()}>
            Finish setup <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        }
      />
    </div>
  );
}
