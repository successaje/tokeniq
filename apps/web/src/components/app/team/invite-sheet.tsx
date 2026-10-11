"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, MailCheck } from "lucide-react";
import { RadioGroup } from "radix-ui";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { errorMessage } from "@/components/ui/query-error";
import { Sheet } from "@/components/ui/sheet";
import { Callout } from "@/components/ui/status";
import { useToast } from "@/components/ui/toast";
import { api, ApiError, fieldErrors, orgPath } from "@/lib/api";
import { cn } from "@/lib/cn";
import { ROLE_DESCRIPTION, ROLE_LABEL, useOrg } from "@/lib/org";
import type { InvitationDto, Role } from "@/lib/types";

const ROLES: Role[] = ["viewer", "approver", "finance", "admin", "owner"];

export function inviteLink(id: string) {
  return `${typeof window === "undefined" ? "" : window.location.origin}/invite/${encodeURIComponent(id)}`;
}

export function CopyLinkButton({ id, size = "sm", variant = "ghost" }: { id: string; size?: "sm" | "md"; variant?: "ghost" | "secondary" }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant={variant}
      size={size}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(inviteLink(id));
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* clipboard blocked: the link is also shown as text */
        }
      }}
    >
      {copied ? <Check className="size-3.5 text-success" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
      {copied ? "Copied" : "Copy link"}
    </Button>
  );
}

/** Invite by email with an explicit role; roles are described so nobody grants more than they mean to. */
export function InviteSheet({ open, onOpenChange, initial }: { open: boolean; onOpenChange: (v: boolean) => void; initial?: { email: string; role: Role } | null }) {
  const { orgId, org, role: myRole } = useOrg();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("viewer");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState<InvitationDto | null>(null);

  useEffect(() => {
    if (!open) return;
    setEmail(initial?.email ?? "");
    setRole(initial?.role ?? "viewer");
    setErrors({});
    setFormError(null);
    setSent(null);
  }, [open, initial]);

  const roles = ROLES.filter((r) => r !== "owner" || myRole === "owner");

  const invite = useMutation({
    mutationFn: (body: { email: string; role: Role }) => api<InvitationDto>(orgPath(orgId, "/invitations"), { method: "POST", body }),
    onSuccess: (inv) => {
      setSent(inv);
      qc.invalidateQueries({ queryKey: ["org", orgId, "/invitations"] });
      toast({ id: `invite-${inv.email}`, tone: "success", title: `Invitation sent to ${inv.email}`, description: `They join as ${ROLE_LABEL[inv.role]} after signing in with this address.` });
    },
    onError: (err) => {
      const f = fieldErrors(err);
      if (Object.keys(f).length) return setErrors(f);
      if (err instanceof ApiError && err.code === "already_member") return setErrors({ email: "This person is already a member of the organization." });
      if (err instanceof ApiError && err.status === 403) return setFormError(`${err.message}.`);
      setFormError(errorMessage(err));
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return setErrors({ email: "Enter the email address they sign in with." });
    setErrors({});
    invite.mutate({ email: value, role });
  };

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={sent ? "Invitation sent" : initial ? "Resend invitation" : "Invite a member"}
      description={sent ? undefined : `They will join ${org.name} with the role you choose. You can change it later.`}
      footer={
        sent ? (
          <>
            <Button variant="secondary" onClick={() => setSent(null)}>
              Invite someone else
            </Button>
            <Button onClick={() => onOpenChange(false)}>Done</Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" form="invite-form" loading={invite.isPending} loadingLabel="Sending invitation">
              Send invitation
            </Button>
          </>
        )
      }
    >
      {sent ? (
        <div className="space-y-4">
          <div className="flex gap-3">
            <MailCheck className="mt-0.5 size-5 shrink-0 text-success" aria-hidden="true" />
            <p className="text-sm text-text-2">
              We emailed <strong className="font-medium text-text">{sent.email}</strong> a link to join as {ROLE_LABEL[sent.role]}. It expires on {new Date(sent.expiresAt).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}. Any earlier invitation to this address no longer works.
            </p>
          </div>
          <div className="rounded-[var(--radius-control)] border border-hairline bg-sunken p-3">
            <div className="text-xs font-medium text-text-2">Invitation link</div>
            <p className="mt-1 break-all font-mono text-xs text-text">{inviteLink(sent.id)}</p>
            <div className="mt-2">
              <CopyLinkButton id={sent.id} variant="secondary" />
            </div>
            <p className="mt-2 text-xs text-text-3">Only the person signed in as {sent.email} can open it, so it is safe to share in your team chat.</p>
          </div>
        </div>
      ) : (
        <form id="invite-form" onSubmit={submit} className="space-y-5" noValidate>
          {formError && <Callout tone="danger">{formError}</Callout>}
          <Field label="Email address" hint="They must sign in with exactly this address to accept." error={errors.email}>
            {(p) => <Input {...p} type="email" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@organization.xyz" autoFocus={!initial} />}
          </Field>
          <fieldset>
            <legend className="text-[13px] font-medium text-text">Role</legend>
            <RadioGroup.Root value={role} onValueChange={(v) => setRole(v as Role)} className="mt-1.5 space-y-1.5" aria-label="Role">
              {roles.map((r) => (
                <RadioGroup.Item
                  key={r}
                  value={r}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-[var(--radius-control)] border border-hairline px-3 py-2.5 text-left transition-colors duration-[var(--dur-fast)] hover:bg-sunken",
                    "data-[state=checked]:border-accent data-[state=checked]:bg-accent-subtle/60",
                  )}
                >
                  <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border border-border-strong/60 bg-surface" aria-hidden="true">
                    <RadioGroup.Indicator className="size-2 rounded-full bg-accent" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-medium text-text">{ROLE_LABEL[r]}</span>
                    <span className="block text-xs text-text-2">{ROLE_DESCRIPTION[r]}</span>
                  </span>
                </RadioGroup.Item>
              ))}
            </RadioGroup.Root>
            {myRole !== "owner" && <p className="mt-2 text-xs text-text-3">Only owners can invite other owners.</p>}
          </fieldset>
          {errors.role && (
            <p className="text-xs font-medium text-danger" role="alert">
              {errors.role}
            </p>
          )}
        </form>
      )}
    </Sheet>
  );
}
