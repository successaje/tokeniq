"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/field";
import { errorMessage, QueryError } from "@/components/ui/query-error";
import { LoadingRegion, Skeleton } from "@/components/ui/skeleton";
import { Callout, StatusBadge } from "@/components/ui/status";
import { useToast } from "@/components/ui/toast";
import { api, ApiError, fieldErrors, orgPath } from "@/lib/api";
import { dateLabel } from "@/lib/format";
import { ROLE_LABEL, useCan, useOrg, useOrgQuery } from "@/lib/org";
import type { OrgDto } from "@/lib/types";

export function OrganizationTab() {
  const { orgId } = useOrg();
  const canEdit = useCan("org.manage");
  const q = useOrgQuery<OrgDto>("");
  const qc = useQueryClient();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!q.data) return;
    setName(q.data.name);
    setPurpose(q.data.purpose ?? "");
  }, [q.data]);

  const save = useMutation({
    mutationFn: (body: { name?: string; purpose?: string | null }) => api<OrgDto>(orgPath(orgId), { method: "PATCH", body }),
    onSuccess: (org) => {
      qc.setQueryData(["org", orgId, ""], org);
      qc.invalidateQueries({ queryKey: ["me"] });
      toast({ id: "org-profile", tone: "success", title: "Organization profile saved" });
    },
    onError: (err) => {
      const f = fieldErrors(err);
      if (Object.keys(f).length) return setErrors(f);
      setFormError(err instanceof ApiError && err.status === 403 ? `${err.message}. Only owners and admins can edit the profile.` : errorMessage(err));
    },
  });

  if (q.isLoading) {
    return (
      <LoadingRegion label="Loading the organization…">
        <Skeleton className="h-64 w-full max-w-2xl" />
      </LoadingRegion>
    );
  }
  if (q.isError || !q.data) return <QueryError error={q.error} onRetry={() => q.refetch()} title="Couldn't load the organization" />;
  const org = q.data;
  const dirty = name.trim() !== org.name || (purpose.trim() || null) !== (org.purpose ?? null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const errs: Record<string, string> = {};
    if (name.trim().length < 2) errs.name = "Use at least 2 characters.";
    if (purpose.trim().length > 280) errs.purpose = "Keep it under 280 characters.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const body: { name?: string; purpose?: string | null } = {};
    if (name.trim() !== org.name) body.name = name.trim();
    if ((purpose.trim() || null) !== (org.purpose ?? null)) body.purpose = purpose.trim() || null;
    save.mutate(body);
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
      <form onSubmit={submit} noValidate className="min-w-0">
        <Card>
          <CardHeader title="Organization profile" description="Shown to your team, in reports and in invitations." />
          <CardBody className="space-y-4">
            {!canEdit && <Callout tone="neutral">Only owners and admins can edit the organization profile.</Callout>}
            <Field label="Name" error={errors.name}>
              {(p) => <Input {...p} value={name} maxLength={80} onChange={(e) => setName(e.target.value)} disabled={!canEdit} autoComplete="organization" />}
            </Field>
            <Field label="What does the treasury fund?" optional hint="A sentence helps teammates and the copilot understand context." error={errors.purpose}>
              {(p) => <Textarea {...p} value={purpose} maxLength={280} onChange={(e) => setPurpose(e.target.value)} disabled={!canEdit} placeholder="For example: protocol development, grants and audits" />}
            </Field>
            {formError && <Callout tone="danger">{formError}</Callout>}
          </CardBody>
          {canEdit && (
            <CardFooter className="justify-end">
              <Button type="button" variant="secondary" disabled={!dirty || save.isPending} onClick={() => (setName(org.name), setPurpose(org.purpose ?? ""), setErrors({}))}>
                Reset
              </Button>
              <Button type="submit" disabled={!dirty} loading={save.isPending} loadingLabel="Saving">
                Save changes
              </Button>
            </CardFooter>
          )}
        </Card>
      </form>

      <div className="space-y-4">
        <Card>
          <CardHeader title="Details" />
          <CardBody className="pt-2">
            <dl className="space-y-2 text-[13px]">
              <div className="flex justify-between gap-3">
                <dt className="text-text-2">Your role</dt>
                <dd className="text-text">{ROLE_LABEL[org.role]}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-text-2">Reporting currency</dt>
                <dd className="text-text">{org.reportingCurrency}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-text-2">Created</dt>
                <dd className="text-text">{dateLabel(org.createdAt)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-text-2">Workspace ID</dt>
                <dd className="truncate font-mono text-xs text-text-2" title={org.id}>
                  {org.slug}
                </dd>
              </div>
              {org.isSample && (
                <div className="pt-1">
                  <StatusBadge tone="warning">Sample workspace: simulated data, nothing can execute</StatusBadge>
                </div>
              )}
            </dl>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Treasury policy" description="Reserve rules, exposure limits, allowed venues and autonomy." />
          <CardBody className="pt-2">
            <Button variant="secondary" size="sm" asChild>
              <Link href="/app/reserves">
                Open reserves and policy <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
