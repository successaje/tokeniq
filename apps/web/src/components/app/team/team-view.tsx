"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MailPlus, RotateCw, UserMinus, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { errorMessage, QueryError } from "@/components/ui/query-error";
import { Select } from "@/components/ui/select";
import { LoadingRegion, Skeleton } from "@/components/ui/skeleton";
import { Callout, StatusBadge } from "@/components/ui/status";
import { Timestamp } from "@/components/ui/timestamp";
import { useToast } from "@/components/ui/toast";
import { api, ApiError, orgPath } from "@/lib/api";
import { dateLabel } from "@/lib/format";
import { ROLE_DESCRIPTION, ROLE_LABEL, useCan, useOrg, useOrgQuery } from "@/lib/org";
import type { InvitationDto, MemberDto, Role } from "@/lib/types";
import { CopyLinkButton, InviteSheet } from "./invite-sheet";

const ROLES: Role[] = ["owner", "admin", "finance", "approver", "viewer"];

/** Mirrors the API rule: owners can assign any role; admins any role except owner (and cannot change owners). */
function assignable(actor: Role, target: Role) {
  return actor === "owner" || (actor === "admin" && target !== "owner");
}

type Pending = { kind: "role"; member: MemberDto; role: Role } | { kind: "remove"; member: MemberDto } | { kind: "revoke"; invitation: InvitationDto } | null;

export function TeamView() {
  const { org, orgId, role: myRole } = useOrg();
  const canManage = useCan("members.manage");
  const members = useOrgQuery<{ members: MemberDto[] }>("/members");
  // Pending invitations (invitee emails and roles) are visible to owners and admins only; the API returns 403 to others.
  const invitations = useOrgQuery<{ invitations: InvitationDto[] }>("/invitations", { enabled: canManage });
  const qc = useQueryClient();
  const router = useRouter();
  const { toast } = useToast();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [resend, setResend] = useState<{ email: string; role: Role } | null>(null);
  const [pending, setPending] = useState<Pending>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);

  const close = () => {
    setPending(null);
    setDialogError(null);
  };
  const onFail = (err: unknown) => {
    if (err instanceof ApiError && err.code === "last_owner") return setDialogError(err.message.endsWith(".") ? err.message : `${err.message}. Make someone else an owner first.`);
    if (err instanceof ApiError && err.status === 403) return setDialogError(`${err.message}.`);
    if (err instanceof ApiError && err.status === 404) {
      qc.invalidateQueries({ queryKey: ["org", orgId, "/members"] });
      qc.invalidateQueries({ queryKey: ["org", orgId, "/invitations"] });
      return setDialogError("This was already changed by someone else. The list has been refreshed.");
    }
    setDialogError(errorMessage(err));
  };

  const changeRole = useMutation({
    mutationFn: ({ member, role }: { member: MemberDto; role: Role }) => api(orgPath(orgId, `/members/${encodeURIComponent(member.id)}`), { method: "PATCH", body: { role } }),
    onSuccess: async (_r, { member, role }) => {
      close();
      toast({ id: `role-${member.id}`, tone: "success", title: `${member.isYou ? "Your" : `${member.name || member.email}'s`} role is now ${ROLE_LABEL[role]}` });
      qc.invalidateQueries({ queryKey: ["org", orgId, "/members"] });
      if (member.isYou) await qc.invalidateQueries({ queryKey: ["me"] });
    },
    onError: onFail,
  });

  const remove = useMutation({
    mutationFn: (member: MemberDto) => api(orgPath(orgId, `/members/${encodeURIComponent(member.id)}`), { method: "DELETE" }),
    onSuccess: async (_r, member) => {
      close();
      if (member.isYou) {
        toast({ id: "left-org", tone: "success", title: `You left ${org.name}` });
        qc.removeQueries({ queryKey: ["org"] });
        await qc.refetchQueries({ queryKey: ["me"] });
        router.replace("/app");
        return;
      }
      toast({ id: `remove-${member.id}`, tone: "success", title: `${member.name || member.email} was removed`, description: "Their past actions stay in the activity log." });
      qc.invalidateQueries({ queryKey: ["org", orgId, "/members"] });
    },
    onError: onFail,
  });

  const revoke = useMutation({
    mutationFn: (inv: InvitationDto) => api(orgPath(orgId, `/invitations/${encodeURIComponent(inv.id)}`), { method: "DELETE" }),
    onSuccess: (_r, inv) => {
      close();
      toast({ id: `revoke-${inv.id}`, tone: "success", title: `Invitation to ${inv.email} revoked`, description: "The link no longer works." });
      qc.invalidateQueries({ queryKey: ["org", orgId, "/invitations"] });
    },
    onError: onFail,
  });

  const list = members.data?.members ?? [];
  const owners = list.filter((m) => m.role === "owner").length;

  return (
    <div>
      <PageHeader
        title="Team"
        description="Who can see and act on this treasury. Roles decide who can record obligations, change policy, propose and approve."
        meta={members.data && <span>{list.length} member{list.length === 1 ? "" : "s"} · {owners} owner{owners === 1 ? "" : "s"}</span>}
        actions={
          canManage && (
            <Button
              size="sm"
              onClick={() => {
                setResend(null);
                setInviteOpen(true);
              }}
            >
              <MailPlus className="size-4" aria-hidden="true" /> Invite member
            </Button>
          )
        }
      />

      {!canManage && (
        <Callout tone="neutral" className="mb-4">
          You can see who is on the team. Only owners and admins can invite people or change roles.
        </Callout>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-4">
          <Card>
            <CardHeader title="Members" />
            <CardBody className="px-0 pb-1 pt-2 sm:px-0">
              {members.isLoading ? (
                <LoadingRegion label="Loading members…" className="space-y-2 px-4 sm:px-5">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </LoadingRegion>
              ) : members.isError ? (
                <div className="px-4 sm:px-5">
                  <QueryError error={members.error} onRetry={() => members.refetch()} title="Couldn't load members" />
                </div>
              ) : (
                <ul className="divide-y divide-hairline" aria-label="Members">
                  {list.map((m) => {
                    const editable = canManage && assignable(myRole, m.role);
                    return (
                      <li key={m.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-5">
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sunken text-[11px] font-semibold text-text-2 ring-1 ring-hairline">
                            {(m.name || m.email).slice(0, 2).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="truncate text-[13px] font-medium text-text">{m.name || m.email}</span>
                              {m.isYou && (
                                <StatusBadge tone="neutral" icon={null}>
                                  You
                                </StatusBadge>
                              )}
                            </div>
                            <div className="truncate text-xs text-text-3">
                              {m.email.endsWith("@wallet.tokeniq.invalid") ? "Signed in with a wallet" : m.email} · joined {dateLabel(m.joinedAt)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 pl-11 sm:pl-0">
                          {editable ? (
                            <>
                              <label htmlFor={`role-${m.id}`} className="sr-only">
                                Role for {m.name || m.email}
                              </label>
                              <Select<Role>
                                id={`role-${m.id}`}
                                className="w-36"
                                value={m.role}
                                onValueChange={(role) => role !== m.role && setPending({ kind: "role", member: m, role })}
                                options={ROLES.filter((r) => assignable(myRole, r)).map((r) => ({ value: r, label: ROLE_LABEL[r] }))}
                              />
                            </>
                          ) : (
                            <span className="w-36 text-[13px] text-text-2">{ROLE_LABEL[m.role]}</span>
                          )}
                          {(m.isYou || editable) && (
                            <Button variant="ghost" size="sm" onClick={() => setPending({ kind: "remove", member: m })} aria-label={m.isYou ? "Leave organization" : `Remove ${m.name || m.email}`}>
                              <UserMinus className="size-4" aria-hidden="true" />
                              <span className="sm:sr-only lg:not-sr-only">{m.isYou ? "Leave" : "Remove"}</span>
                            </Button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardBody>
          </Card>

          {canManage && (
          <Card>
            <CardHeader title="Pending invitations" description="Invitations expire after 7 days. Resending sends a new link and the old one stops working." />
            <CardBody className="px-0 pb-1 pt-2 sm:px-0">
              {invitations.isLoading ? (
                <LoadingRegion label="Loading invitations…" className="px-4 sm:px-5">
                  <Skeleton className="h-12 w-full" />
                </LoadingRegion>
              ) : invitations.isError ? (
                <div className="px-4 sm:px-5">
                  <QueryError error={invitations.error} onRetry={() => invitations.refetch()} title="Couldn't load invitations" />
                </div>
              ) : (invitations.data?.invitations.length ?? 0) === 0 ? (
                <div className="px-4 pb-3 sm:px-5">
                  <EmptyState
                    icon={Users}
                    title="No pending invitations"
                    description={canManage ? "Invite finance, approvers and viewers so decisions and approvals don't depend on one person." : "Owners and admins can invite people."}
                    actions={
                      canManage && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setResend(null);
                            setInviteOpen(true);
                          }}
                        >
                          Invite member
                        </Button>
                      )
                    }
                  />
                </div>
              ) : (
                <ul className="divide-y divide-hairline" aria-label="Pending invitations">
                  {invitations.data!.invitations.map((inv) => (
                    <li key={inv.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-5">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-medium text-text">{inv.email}</div>
                        <div className="text-xs text-text-3">
                          {ROLE_LABEL[inv.role]} · sent <Timestamp at={inv.createdAt} /> · expires <Timestamp at={inv.expiresAt} />
                        </div>
                      </div>
                      {canManage && (
                        <div className="flex flex-wrap gap-1">
                          <CopyLinkButton id={inv.id} />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setResend({ email: inv.email, role: inv.role });
                              setInviteOpen(true);
                            }}
                          >
                            <RotateCw className="size-3.5" aria-hidden="true" /> Resend
                          </Button>
                          <Button variant="ghost" size="sm" className="text-danger hover:text-danger" onClick={() => setPending({ kind: "revoke", invitation: inv })}>
                            Revoke
                          </Button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
          )}
        </div>

        <Card className="h-fit">
          <CardHeader title="Roles" description="What each role can do in TokenIQ." />
          <CardBody className="pt-2">
            <dl className="space-y-2.5">
              {ROLES.map((r) => (
                <div key={r}>
                  <dt className="text-[13px] font-medium text-text">{ROLE_LABEL[r]}</dt>
                  <dd className="text-xs text-text-2">{ROLE_DESCRIPTION[r]}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-xs text-text-3">Approving inside TokenIQ is separate from signing: Safe owners still sign every transaction in their own wallets.</p>
          </CardBody>
        </Card>
      </div>

      <InviteSheet open={inviteOpen} onOpenChange={setInviteOpen} initial={resend} />

      <ConfirmDialog
        open={pending?.kind === "role"}
        onOpenChange={(v) => !v && close()}
        title={pending?.kind === "role" ? `Change ${pending.member.isYou ? "your" : `${pending.member.name || pending.member.email}'s`} role to ${ROLE_LABEL[pending.role]}?` : ""}
        description={pending?.kind === "role" ? `${ROLE_LABEL[pending.member.role]} → ${ROLE_LABEL[pending.role]}` : ""}
        confirmLabel="Change role"
        loading={changeRole.isPending}
        onConfirm={() => pending?.kind === "role" && changeRole.mutate({ member: pending.member, role: pending.role })}
        consequences={
          pending?.kind === "role" && (
            <div className="space-y-2">
              <p>
                <strong className="font-medium text-text">{ROLE_LABEL[pending.role]}:</strong> {ROLE_DESCRIPTION[pending.role]}.
              </p>
              {pending.member.isYou && <p className="text-warning">You are changing your own role. You may lose access to this page.</p>}
              <p className="text-xs text-text-3">The change takes effect immediately and is recorded in the activity log.</p>
              {dialogError && <Callout tone="danger">{dialogError}</Callout>}
            </div>
          )
        }
      />

      <ConfirmDialog
        open={pending?.kind === "remove"}
        onOpenChange={(v) => !v && close()}
        tone="danger"
        title={pending?.kind === "remove" ? (pending.member.isYou ? `Leave ${org.name}?` : `Remove ${pending.member.name || pending.member.email}?`) : ""}
        description={pending?.kind === "remove" ? (pending.member.isYou ? "You will lose access to this organization immediately." : `They lose access to ${org.name} immediately.`) : ""}
        confirmLabel={pending?.kind === "remove" && pending.member.isYou ? "Leave organization" : "Remove member"}
        loading={remove.isPending}
        onConfirm={() => pending?.kind === "remove" && remove.mutate(pending.member)}
        consequences={
          pending?.kind === "remove" && (
            <div className="space-y-2">
              <p>{pending.member.isYou ? "Your past approvals, comments and changes stay in the activity log. To come back, an owner or admin has to invite you again." : "Their past approvals, comments and changes stay in the activity log. You can invite them again later."}</p>
              {pending.member.role === "owner" && owners <= 1 && <p className="text-warning">This is the only owner. Make someone else an owner first, or the change will be refused.</p>}
              {dialogError && <Callout tone="danger">{dialogError}</Callout>}
            </div>
          )
        }
      />

      <ConfirmDialog
        open={pending?.kind === "revoke"}
        onOpenChange={(v) => !v && close()}
        tone="danger"
        title={pending?.kind === "revoke" ? `Revoke the invitation to ${pending.invitation.email}?` : ""}
        description="The invitation link stops working. You can invite them again later."
        confirmLabel="Revoke invitation"
        loading={revoke.isPending}
        onConfirm={() => pending?.kind === "revoke" && revoke.mutate(pending.invitation)}
        consequences={dialogError && <Callout tone="danger">{dialogError}</Callout>}
      />
    </div>
  );
}
