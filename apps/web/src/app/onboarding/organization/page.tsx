"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Callout } from "@/components/ui/status";
import { api, fieldErrors } from "@/lib/api";
import { rememberOrg } from "@/lib/org";
import type { OrgDto } from "@/lib/types";

export default function OrganizationStep() {
  const router = useRouter();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [purpose, setPurpose] = useState("");
  const create = useMutation({
    mutationFn: () => api<OrgDto>("/api/v1/orgs", { method: "POST", body: { name: name.trim(), purpose: purpose.trim() || null } }),
    onSuccess: async (org) => {
      rememberOrg(org.id);
      await qc.refetchQueries({ queryKey: ["me"] });
      router.push("/onboarding/treasury");
    },
  });
  const sample = useMutation({
    mutationFn: () => api<{ organizationId: string }>("/api/v1/sample-workspace", { method: "POST", body: {} }),
    onSuccess: async ({ organizationId }) => {
      rememberOrg(organizationId);
      await qc.refetchQueries({ queryKey: ["me"] });
      router.push("/app");
    },
  });
  const errs = fieldErrors(create.error);
  return (
    <div>
      <p className="text-xs font-medium text-text-3">Step 1 of 4</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-[-0.01em]">Name your organization</h1>
      <p className="mt-1.5 text-sm text-text-2">This is the workspace your team shares. You can invite people and connect accounts next.</p>
      <Card className="mt-6">
        <CardBody>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              create.mutate();
            }}
            noValidate
          >
            <Field label="Organization name" error={errs.name}>
              {(p) => <Input {...p} value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Protocol" autoFocus required />}
            </Field>
            <Field label="What does the treasury fund?" optional hint="A sentence helps the copilot and teammates understand context.">
              {(p) => <Textarea {...p} value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Core contributors, audits and infrastructure for a lending protocol" maxLength={280} />}
            </Field>
            {create.error && !Object.keys(errs).length && <Callout tone="danger">{(create.error as Error).message}</Callout>}
            <Button type="submit" loading={create.isPending} disabled={name.trim().length < 2}>
              Create organization
            </Button>
          </form>
        </CardBody>
      </Card>
      <div className="mt-6 rounded-[var(--radius-card)] border border-dashed border-hairline p-4 text-sm text-text-2">
        Want to look around first?{" "}
        <Button variant="link" onClick={() => sample.mutate()} loading={sample.isPending}>
          Open a sample workspace
        </Button>{" "}
        with simulated balances and obligations. It is clearly labelled and nothing in it can be signed or executed.
        {sample.error && <Callout tone="danger" className="mt-3">{(sample.error as Error).message}</Callout>}
      </div>
    </div>
  );
}
