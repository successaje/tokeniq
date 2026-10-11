"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, CircleSlash, Clock, Mail, MailWarning, ShieldCheck, UserRound, Users } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { errorMessage } from "@/components/ui/query-error";
import { LoadingRegion, Skeleton } from "@/components/ui/skeleton";
import { Callout, StatusBadge } from "@/components/ui/status";
import { useToast } from "@/components/ui/toast";
import { api, ApiError } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { dateTimeLabel, relativeTime } from "@/lib/format";
import { rememberOrg, ROLE_DESCRIPTION, ROLE_LABEL } from "@/lib/org";
import type { InvitationDetailDto, MeDto } from "@/lib/types";

type Loaded =
  | { kind: "signed_out" }
  | { kind: "not_addressed"; me: MeDto }
  | { kind: "ok"; inv: InvitationDetailDto; me: MeDto };

/**
 * Load the invitation without tripping the global 401 handler (which would
 * send people to sign in with a generic "session expired" message).
 */
async function load(id: string, signal?: AbortSignal): Promise<Loaded> {
  let me: MeDto;
  try {
    me = await api<MeDto>("/api/v1/me", { signal });
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return { kind: "signed_out" };
    throw err;
  }
  try {
    const inv = await api<InvitationDetailDto>(`/api/v1/invitations/${encodeURIComponent(id)}`, { signal });
    return { kind: "ok", inv, me };
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return { kind: "signed_out" };
    if (err instanceof ApiError && err.status === 404) return { kind: "not_addressed", me };
    throw err;
  }
}

function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <header className="flex h-16 items-center px-5 pt-safe sm:px-8">
        <Link href="/" aria-label="TokenIQ home">
          <Logo />
        </Link>
      </header>
      <main id="main" className="flex flex-1 items-start justify-center px-4 pb-16 pt-[6vh] sm:items-center sm:pt-0">
        <div className="w-full max-w-[440px]">{children}</div>
      </main>
      <footer className="px-5 pb-6 text-center text-xs text-text-3 sm:px-8">
        <Link href="/legal/privacy" className="hover:text-text-2">
          Privacy
        </Link>{" "}
        ·{" "}
        <Link href="/legal/terms" className="hover:text-text-2">
          Terms
        </Link>{" "}
        ·{" "}
        <Link href="/security" className="hover:text-text-2">
          Security
        </Link>
      </footer>
    </div>
  );
}

function Panel({ icon: Icon, tone = "text-text-2", title, children }: { icon: typeof Users; tone?: string; title: string; children: ReactNode }) {
  return (
    <div>
      <span className={`flex size-10 items-center justify-center rounded-[var(--radius-card)] bg-sunken ${tone}`} aria-hidden="true">
        <Icon className="size-5" />
      </span>
      <h1 className="mt-4 text-2xl font-semibold tracking-[-0.01em] text-text text-balance">{title}</h1>
      <div className="mt-2 space-y-4 text-sm text-text-2">{children}</div>
    </div>
  );
}

export function InviteView() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { toast } = useToast();
  const loginHref = `/login?next=${encodeURIComponent(`/invite/${id}`)}&reason=invite`;
  const q = useQuery({ queryKey: ["invite", id], queryFn: ({ signal }) => load(id, signal), retry: false, staleTime: 0 });
  const [statusOverride, setStatusOverride] = useState<string | null>(null);
  const [acceptError, setAcceptError] = useState<{ title: string; body: string } | null>(null);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    if (q.data?.kind === "signed_out") router.replace(loginHref);
  }, [q.data, router, loginHref]);

  const accept = useMutation({
    mutationFn: () => api<{ organizationId: string }>(`/api/v1/invitations/${encodeURIComponent(id)}/accept`, { method: "POST" }),
    onSuccess: async ({ organizationId }) => {
      rememberOrg(organizationId);
      qc.removeQueries({ queryKey: ["org"] });
      // The shell routes people without memberships to onboarding, so the new membership must be loaded first.
      await qc.fetchQuery({ queryKey: ["me"], queryFn: () => api<MeDto>("/api/v1/me"), staleTime: 0 });
      const name = q.data?.kind === "ok" ? q.data.inv.organizationName : "the organization";
      toast({ id: "invite-accepted", tone: "success", title: `You joined ${name}`, description: q.data?.kind === "ok" ? `Your role is ${ROLE_LABEL[q.data.inv.role]}.` : undefined });
      router.replace("/app");
    },
    onError: (err) => {
      if (err instanceof ApiError && err.code === "invitation_expired") return setStatusOverride("expired");
      if (err instanceof ApiError && err.code === "invitation_not_pending") {
        q.refetch();
        return setAcceptError({ title: "This invitation can no longer be accepted", body: `${err.message}.` });
      }
      if (err instanceof ApiError && err.code === "email_unverified") return setAcceptError({ title: "Verify your email address first", body: "Sign out, then sign in again with an emailed code to this address. That verifies it, and you can accept the invitation straight after." });
      if (err instanceof ApiError && err.status === 404) return q.refetch();
      setAcceptError({ title: "Couldn't accept the invitation", body: `${errorMessage(err).replace(/\.$/, "")}. Try again in a moment.` });
    },
  });

  const switchAccount = async () => {
    setSwitching(true);
    try {
      await authClient.signOut();
    } finally {
      qc.clear();
      window.location.assign(loginHref);
    }
  };

  if (q.isLoading || q.data?.kind === "signed_out") {
    return (
      <Frame>
        <LoadingRegion label={q.data?.kind === "signed_out" ? "Taking you to sign in…" : "Opening your invitation…"} className="space-y-3">
          <Skeleton className="size-10" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-11 w-full" />
          {q.data?.kind === "signed_out" && (
            <p className="text-sm text-text-2">
              Sign in to see this invitation.{" "}
              <Link href={loginHref} className="font-medium text-accent hover:underline">
                Continue to sign in
              </Link>
            </p>
          )}
        </LoadingRegion>
      </Frame>
    );
  }

  if (q.isError || !q.data) {
    return (
      <Frame>
        <Callout tone="danger" title="Couldn't open this invitation" action={<Button variant="secondary" size="sm" onClick={() => q.refetch()}>Try again</Button>}>
          {errorMessage(q.error, "TokenIQ did not respond").replace(/\.$/, "")}. Nothing was changed.
        </Callout>
      </Frame>
    );
  }

  const data = q.data;
  const signedInAs = data.me.user.hasRealEmail ? data.me.user.email : "a wallet account without an email address";

  if (data.kind === "not_addressed") {
    return (
      <Frame>
        <Panel icon={MailWarning} tone="text-warning" title="This invitation is for a different email address">
          <p>
            You are signed in as <strong className="font-medium text-text">{signedInAs}</strong>. Invitations can only be opened by the email address they were sent to, so TokenIQ can&apos;t show this one to you.
          </p>
          <p>If it was sent to another address of yours, sign out and sign in with that address. If the link is old, ask the person who invited you for a new one.</p>
          <div className="flex flex-col gap-2 pt-1">
            <Button size="lg" onClick={switchAccount} loading={switching} loadingLabel="Signing out">
              Sign out and use another email
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <Link href={data.me.organizations.length ? "/app" : "/onboarding"}>Continue as {data.me.user.name || "yourself"}</Link>
            </Button>
          </div>
        </Panel>
      </Frame>
    );
  }

  const inv = data.inv;
  const status = statusOverride ?? inv.status;
  const expires = dateTimeLabel(inv.expiresAt);
  const elsewhere = data.me.organizations.length ? "/app" : "/onboarding";

  if (status === "accepted") {
    const org = data.me.organizations.filter((o) => o.name === inv.organizationName);
    return (
      <Frame>
        <Panel icon={ShieldCheck} tone="text-success" title={`You're already a member of ${inv.organizationName}`}>
          <p>This invitation has been accepted. Your role is {ROLE_LABEL[inv.role]} unless someone has changed it since.</p>
          <Button
            size="lg"
            className="w-full"
            onClick={() => {
              if (org.length === 1) rememberOrg(org[0]!.id);
              router.push("/app");
            }}
          >
            Open {inv.organizationName}
          </Button>
        </Panel>
      </Frame>
    );
  }

  if (status !== "pending") {
    const expired = status === "expired";
    return (
      <Frame>
        <Panel icon={expired ? Clock : CircleSlash} tone="text-text-2" title={expired ? "This invitation has expired" : status === "superseded" ? "A newer invitation replaced this one" : "This invitation was withdrawn"}>
          <p>
            {expired
              ? `It expired on ${expires}. Invitations last 7 days. Ask ${inv.inviterName || "the person who invited you"} to send a new one.`
              : status === "superseded"
                ? `${inv.inviterName || "Someone"} sent you a newer invitation to ${inv.organizationName}. Use the link in the most recent email.`
                : `${inv.organizationName} revoked this invitation. Contact ${inv.inviterName || "the person who invited you"} if you think this is a mistake.`}
          </p>
          <Button size="lg" variant="secondary" className="w-full" asChild>
            <Link href={elsewhere}>Go to TokenIQ</Link>
          </Button>
        </Panel>
      </Frame>
    );
  }

  return (
    <Frame>
      <Panel icon={Users} tone="text-accent" title={`Join ${inv.organizationName} on TokenIQ`}>
        <p>
          <strong className="font-medium text-text">{inv.inviterName || "A team member"}</strong> invited you to help manage this organization&apos;s treasury.
        </p>
        <dl className="divide-y divide-hairline rounded-[var(--radius-card)] border border-hairline bg-surface text-[13px]">
          <div className="flex items-start gap-3 px-3 py-2.5">
            <UserRound className="mt-0.5 size-4 shrink-0 text-text-3" aria-hidden="true" />
            <div className="min-w-0">
              <dt className="sr-only">Role</dt>
              <dd>
                <StatusBadge tone="accent" icon={null}>
                  {ROLE_LABEL[inv.role]}
                </StatusBadge>
                <p className="mt-1 text-text-2">{ROLE_DESCRIPTION[inv.role]}.</p>
              </dd>
            </div>
          </div>
          <div className="flex items-start gap-3 px-3 py-2.5">
            <Mail className="mt-0.5 size-4 shrink-0 text-text-3" aria-hidden="true" />
            <div className="min-w-0">
              <dt className="text-text-2">Sent to</dt>
              <dd className="truncate font-medium text-text">{inv.email}</dd>
            </div>
          </div>
          <div className="flex items-start gap-3 px-3 py-2.5">
            <CalendarClock className="mt-0.5 size-4 shrink-0 text-text-3" aria-hidden="true" />
            <div>
              <dt className="text-text-2">Expires</dt>
              <dd className="font-medium text-text">
                {relativeTime(inv.expiresAt)} <span className="font-normal text-text-3">· {expires}</span>
              </dd>
            </div>
          </div>
        </dl>
        {acceptError && (
          <Callout tone="danger" title={acceptError.title}>
            {acceptError.body}
          </Callout>
        )}
        <div className="flex flex-col gap-2 pt-1">
          <Button size="lg" className="w-full" onClick={() => accept.mutate()} loading={accept.isPending} loadingLabel="Joining">
            Accept and join
          </Button>
          <Button size="lg" variant="secondary" className="w-full" onClick={() => setDeclineOpen(true)}>
            Decline
          </Button>
        </div>
        <p className="text-xs text-text-3">Joining gives you access to this organization only. You can leave at any time from Team.</p>
      </Panel>
      <ConfirmDialog
        open={declineOpen}
        onOpenChange={setDeclineOpen}
        title="Decline this invitation?"
        description={`You won't join ${inv.organizationName}.`}
        confirmLabel="Decline"
        onConfirm={() => router.replace(elsewhere)}
        consequences={`TokenIQ does not notify ${inv.inviterName || "the inviter"}. The link stays valid until ${expires} unless they revoke it, so you can still change your mind.`}
      />
    </Frame>
  );
}
