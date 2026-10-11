"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Building2, Check } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog";
import { Field, Input, Textarea } from "@/components/ui/field";
import { LoadingRegion, Skeleton } from "@/components/ui/skeleton";
import { Callout } from "@/components/ui/status";
import { ApiError, api, fieldErrors, orgPath } from "@/lib/api";
import { cn } from "@/lib/cn";
import type { MeDto, OrgDto } from "@/lib/types";
import { can, useOnboardingOrg } from "./use-onboarding-org";

export const STEPS = [
  { id: "organization", label: "Organization", href: null },
  { id: "treasury", label: "Treasury", href: "/onboarding/treasury" },
  { id: "obligations", label: "Obligations", href: "/onboarding/obligations" },
  { id: "policy", label: "Policy", href: "/onboarding/policy" },
] as const;

/** Four segments; completed steps are links so people can revisit them. */
export function StepProgress({ current, done }: { current: number; done: string[] }) {
  return (
    <nav aria-label="Setup progress" className="mt-3">
      <ol className="grid grid-cols-4 gap-1.5">
        {STEPS.map((s, i) => {
          const n = i + 1;
          const isDone = done.includes(s.id) && n !== current;
          const isCurrent = n === current;
          const body = (
            <>
              <span aria-hidden="true" className={cn("block h-1 rounded-full", isCurrent || isDone ? "bg-accent" : "bg-sunken ring-1 ring-inset ring-hairline")} />
              <span className={cn("mt-1.5 flex items-center gap-1 truncate text-[11px] sm:text-xs", isCurrent ? "font-medium text-text" : isDone ? "text-text-2" : "text-text-3")}>
                {isDone && <Check className="size-3 shrink-0 text-accent" aria-hidden="true" />}
                {s.label}
                <span className="sr-only">{isCurrent ? " (current step)" : isDone ? " (done)" : ""}</span>
              </span>
            </>
          );
          return (
            <li key={s.id} aria-current={isCurrent ? "step" : undefined} className="min-w-0">
              {isDone && s.href ? (
                <Link href={s.href} className="block rounded-[var(--radius-chip)] hover:opacity-80">
                  {body}
                </Link>
              ) : (
                body
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export interface StepContext {
  me: MeDto;
  org: OrgDto;
  orgId: string;
}

/**
 * Shell for steps 2–4: resolves the organization, shows "Step N of 4", the
 * progress bar, title and description, then renders the step.
 */
export function OnboardingStep({ step, title, description, children }: { step: 2 | 3 | 4; title: string; description: ReactNode; children: (ctx: StepContext) => ReactNode }) {
  const { me, org, resolving } = useOnboardingOrg();

  if (resolving) {
    return (
      <LoadingRegion label="Loading your organization…">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="mt-3 h-1 w-full" />
        <Skeleton className="mt-5 h-8 w-72" />
        <Skeleton className="mt-2 h-4 w-full max-w-md" />
        <Skeleton className="mt-6 h-72 w-full" />
      </LoadingRegion>
    );
  }
  if (me.isError || !me.data) {
    return (
      <Callout tone="danger" title="Couldn't load your account" action={<Button variant="secondary" size="sm" onClick={() => me.refetch()}>Try again</Button>}>
        {(me.error as Error)?.message ?? "The service did not respond."} Nothing was changed.
      </Callout>
    );
  }
  if (!org) {
    return (
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.01em]">Create your organization first</h1>
        <p className="mt-1.5 text-sm text-text-2">Setup continues once there is an organization to set up. Sample workspaces are already set up.</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/onboarding/organization">Name your organization</Link>
          </Button>
          {me.data.organizations.length > 0 && (
            <Button variant="secondary" asChild>
              <Link href="/app">Go to the app</Link>
            </Button>
          )}
        </div>
      </div>
    );
  }
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-text-3">Step {step} of 4</p>
        <p className="flex min-w-0 items-center gap-1.5 truncate text-xs text-text-3">
          <Building2 className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{org.name}</span>
        </p>
      </div>
      <StepProgress current={step} done={org.onboardingSteps} />
      <h1 className="mt-6 text-2xl font-semibold tracking-[-0.01em] text-balance">{title}</h1>
      <div className="mt-1.5 text-sm text-text-2">{description}</div>
      <div className="mt-6">{children({ me: me.data, org, orgId: org.id })}</div>
    </div>
  );
}

/** Back / skip on the left, primary on the right; stacks with the primary first on phones. */
export function StepActions({ back, secondary, primary }: { back?: ReactNode; secondary?: ReactNode; primary: ReactNode }) {
  return (
    <div className="mt-6 flex flex-col-reverse gap-2 border-t border-hairline pt-4 sm:flex-row sm:items-center">
      <div className="flex flex-wrap items-center gap-2">{back}</div>
      <div className="flex flex-col-reverse gap-2 sm:ml-auto sm:flex-row sm:items-center">
        {secondary}
        {primary}
      </div>
    </div>
  );
}

export function BackLink({ href, children = "Back" }: { href: string; children?: ReactNode }) {
  return (
    <Button variant="ghost" asChild className="h-11 sm:h-9">
      <Link href={href}>
        <ArrowLeft className="size-4" aria-hidden="true" /> {children}
      </Link>
    </Button>
  );
}

type ProgressBody = { step?: "treasury" | "obligations" | "policy"; complete?: boolean };

/**
 * POST /onboarding records progress and completion, an organization setting (`org.manage`). Other roles
 * never call it, and a 403 (role changed meanwhile) is not an error: there is just nothing to record.
 */
export async function recordOnboarding(org: Pick<OrgDto, "id" | "role">, body: ProgressBody): Promise<OrgDto | null> {
  if (!can(org.role, "org.manage")) return null;
  try {
    return await api<OrgDto>(orgPath(org.id, "/onboarding"), { method: "POST", body });
  } catch (e) {
    if (e instanceof ApiError && e.status === 403) return null;
    throw e;
  }
}

/** Save progress (step) and/or completion; refreshes the membership list. */
export function useSaveProgress(org: Pick<OrgDto, "id" | "role">) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ProgressBody) => recordOnboarding(org, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["me"] }),
  });
}

/**
 * Step 1 always creates a new organization, so "Back" from step 2 edits the
 * existing one instead (PATCH /orgs/{orgId}) to avoid creating a duplicate.
 */
export function EditOrganizationButton({ org }: { org: OrgDto }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(org.name);
  const [purpose, setPurpose] = useState(org.purpose ?? "");
  useEffect(() => {
    if (open) {
      setName(org.name);
      setPurpose(org.purpose ?? "");
    }
  }, [open, org]);
  const save = useMutation({
    mutationFn: () => api<OrgDto>(orgPath(org.id), { method: "PATCH", body: { name: name.trim(), purpose: purpose.trim() || null } }),
    onSuccess: async () => {
      await qc.refetchQueries({ queryKey: ["me"] });
      setOpen(false);
    },
  });
  const errs = fieldErrors(save.error);
  const allowed = can(org.role, "org.manage");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="ghost" className="h-11 sm:h-9" onClick={() => setOpen(true)}>
        <ArrowLeft className="size-4" aria-hidden="true" /> Back
      </Button>
      <DialogContent
        title="Organization details"
        description="Step 1 of 4. Changes apply to this organization; nothing else is created."
        size="sm"
        footer={
          <>
            <DialogClose asChild>
              <Button variant="secondary">{allowed ? "Cancel" : "Close"}</Button>
            </DialogClose>
            {allowed && (
              <Button type="submit" form="org-details-form" loading={save.isPending} disabled={name.trim().length < 2}>
                Save
              </Button>
            )}
          </>
        }
      >
        <form
          id="org-details-form"
          className="space-y-4"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
        >
          <Field label="Organization name" error={errs.name}>
            {(p) => <Input {...p} value={name} onChange={(e) => setName(e.target.value)} disabled={!allowed} maxLength={80} />}
          </Field>
          <Field label="What does the treasury fund?" optional error={errs.purpose}>
            {(p) => <Textarea {...p} value={purpose} onChange={(e) => setPurpose(e.target.value)} disabled={!allowed} maxLength={280} />}
          </Field>
          {!allowed && <Callout tone="neutral">Only owners and admins can rename the organization.</Callout>}
          {save.error && !Object.keys(errs).length && <Callout tone="danger">{save.error instanceof ApiError && save.error.status === 403 ? "Your role can't change organization details." : save.error.message}</Callout>}
        </form>
      </DialogContent>
    </Dialog>
  );
}
