"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Fingerprint, KeyRound, Laptop, LogOut, Mail, Smartphone, Wallet } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/field";
import { AddressText, ChainLabel } from "@/components/ui/identity";
import { errorMessage, QueryError } from "@/components/ui/query-error";
import { LoadingRegion, Skeleton } from "@/components/ui/skeleton";
import { Callout, StatusBadge } from "@/components/ui/status";
import { Timestamp } from "@/components/ui/timestamp";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { dateLabel } from "@/lib/format";
import { useOrg } from "@/lib/org";
import type { MetaDto } from "@/lib/types";

/** "Chrome on macOS" from a user agent; good enough to recognise your own devices. */
export function describeDevice(ua: string | null | undefined): { label: string; mobile: boolean } {
  if (!ua) return { label: "Unknown device", mobile: false };
  const browser = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : /curl|node|undici/i.test(ua) ? "Script or CLI" : "Browser";
  const os = /iPhone|iPad|iPod/.test(ua) ? "iOS" : /Android/.test(ua) ? "Android" : /Mac OS X|Macintosh/.test(ua) ? "macOS" : /Windows/.test(ua) ? "Windows" : /Linux/.test(ua) ? "Linux" : null;
  return { label: os ? `${browser} on ${os}` : browser, mobile: /Mobi|iPhone|Android/.test(ua) };
}

interface PasskeyRow {
  id: string;
  name?: string | null;
  deviceType?: string;
  backedUp?: boolean;
  createdAt: string | Date;
}

interface SessionRow {
  id: string;
  token: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  expiresAt: string | Date;
  ipAddress?: string | null;
  userAgent?: string | null;
}

const iso = (d: string | Date) => (typeof d === "string" ? d : d.toISOString());

/** Better Auth returns { data, error }; turn errors into throws for React Query. */
async function unwrap<T>(p: Promise<{ data: T | null; error: { message?: string } | null }>): Promise<T> {
  const r = await p;
  if (r.error) throw new Error(r.error.message || "The request failed");
  return r.data as T;
}

export function SecurityTab() {
  const { me } = useOrg();
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <div className="space-y-4">
        <Card>
          <CardHeader title="Sign-in methods" description="TokenIQ never asks for keys, seed phrases or passwords." />
          <CardBody className="pt-2">
            <ul className="divide-y divide-hairline text-[13px]">
              <li className="flex items-center gap-3 py-2.5">
                <Mail className="size-4 text-text-3" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-text">Email code</span>
                  <span className="block truncate text-xs text-text-2">{me.user.hasRealEmail ? me.user.email : "No email address on this account"}</span>
                </span>
                {me.user.hasRealEmail && (me.user.emailVerified ? <StatusBadge tone="success">Verified</StatusBadge> : <StatusBadge tone="warning">Not verified</StatusBadge>)}
              </li>
              <li className="flex items-center gap-3 py-2.5">
                <Fingerprint className="size-4 text-text-3" aria-hidden="true" />
                <span className="flex-1">
                  <span className="block font-medium text-text">Passkeys</span>
                  <span className="block text-xs text-text-2">{me.passkeys === 0 ? "None yet" : `${me.passkeys} registered`}</span>
                </span>
              </li>
              <li className="flex items-center gap-3 py-2.5">
                <Wallet className="size-4 text-text-3" aria-hidden="true" />
                <span className="flex-1">
                  <span className="block font-medium text-text">Wallets</span>
                  <span className="block text-xs text-text-2">{me.wallets.length === 0 ? "None linked" : `${me.wallets.length} linked`}</span>
                </span>
              </li>
            </ul>
          </CardBody>
        </Card>
        <Passkeys />
        <Wallets />
      </div>
      <Sessions />
    </div>
  );
}

function Passkeys() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const q = useQuery({ queryKey: ["auth", "passkeys"], queryFn: () => unwrap<PasskeyRow[]>(authClient.passkey.listUserPasskeys() as never) });
  const [name, setName] = useState(() => (typeof navigator === "undefined" ? "" : describeDevice(navigator.userAgent).label));
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [remove, setRemove] = useState<PasskeyRow | null>(null);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const supported = typeof window !== "undefined" && "PublicKeyCredential" in window;

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    setAdding(true);
    try {
      const res = await authClient.passkey.addPasskey({ name: name.trim() || undefined });
      if (res && "error" in res && res.error) {
        const msg = res.error.message ?? "";
        setAddError(/cancel|abort|not allowed|NotAllowed/i.test(msg) ? "Passkey creation was cancelled. Nothing was added." : msg || "Couldn't add the passkey.");
        return;
      }
      toast({ id: "passkey-added", tone: "success", title: "Passkey added", description: "You can now sign in with it from the sign-in page." });
      qc.invalidateQueries({ queryKey: ["auth", "passkeys"] });
      qc.invalidateQueries({ queryKey: ["me"] });
    } catch (err) {
      setAddError(errorMessage(err, "Couldn't add the passkey."));
    } finally {
      setAdding(false);
    }
  };

  const confirmRemove = async () => {
    if (!remove) return;
    setRemoving(true);
    setRemoveError(null);
    try {
      await unwrap(authClient.passkey.deletePasskey({ id: remove.id }) as never);
      toast({ id: `passkey-${remove.id}`, tone: "success", title: "Passkey removed" });
      setRemove(null);
      qc.invalidateQueries({ queryKey: ["auth", "passkeys"] });
      qc.invalidateQueries({ queryKey: ["me"] });
    } catch (err) {
      setRemoveError(errorMessage(err));
    } finally {
      setRemoving(false);
    }
  };

  return (
    <Card>
      <CardHeader title="Passkeys" description="Sign in with your device's fingerprint, face or PIN. Phishing-resistant, and nothing to remember." />
      <CardBody className="space-y-4 pt-2">
        {q.isLoading ? (
          <LoadingRegion label="Loading passkeys…">
            <Skeleton className="h-12 w-full" />
          </LoadingRegion>
        ) : q.isError ? (
          <QueryError error={q.error} onRetry={() => q.refetch()} title="Couldn't load passkeys" />
        ) : (q.data?.length ?? 0) === 0 ? (
          <p className="text-[13px] text-text-2">No passkeys yet. Add one for faster, safer sign-in on this device.</p>
        ) : (
          <ul className="divide-y divide-hairline" aria-label="Your passkeys">
            {q.data!.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-2.5">
                <KeyRound className="size-4 shrink-0 text-text-3" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium text-text">{p.name || "Unnamed passkey"}</div>
                  <div className="text-xs text-text-3">
                    Added {dateLabel(iso(p.createdAt))} · {p.backedUp || p.deviceType === "multiDevice" ? "Synced across your devices" : "This device only"}
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => (setRemoveError(null), setRemove(p))} aria-label={`Remove passkey ${p.name || ""}`}>
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
        {supported ? (
          <form onSubmit={add} className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <Field label="Passkey name" hint="So you can tell your devices apart." className="flex-1">
              {(p) => <Input {...p} value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />}
            </Field>
            <Button type="submit" variant="secondary" loading={adding} loadingLabel="Waiting for your device" className="sm:mb-[22px]">
              <Fingerprint className="size-4" aria-hidden="true" /> Add passkey
            </Button>
          </form>
        ) : (
          <Callout tone="neutral">This browser does not support passkeys.</Callout>
        )}
        {addError && <Callout tone="danger">{addError}</Callout>}
      </CardBody>
      <ConfirmDialog
        open={!!remove}
        onOpenChange={(v) => !v && setRemove(null)}
        tone="danger"
        title="Remove this passkey?"
        description={remove?.name || "Unnamed passkey"}
        confirmLabel="Remove passkey"
        loading={removing}
        onConfirm={confirmRemove}
        consequences={
          <div className="space-y-2">
            <p>You will no longer be able to sign in with it. Remove it from your device or password manager too.</p>
            {removeError && <Callout tone="danger">{removeError}</Callout>}
          </div>
        }
      />
    </Card>
  );
}

function Sessions() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const sessions = useQuery({ queryKey: ["auth", "sessions"], queryFn: () => unwrap<SessionRow[]>(authClient.listSessions() as never) });
  const current = useQuery({ queryKey: ["auth", "session"], queryFn: () => unwrap<{ session: { id: string; token: string } } | null>(authClient.getSession() as never) });
  const [revokeOthers, setRevokeOthers] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentId = current.data?.session.id;
  const currentToken = current.data?.session.token;
  const list = [...(sessions.data ?? [])].sort((a, b) => {
    const ac = a.id === currentId || a.token === currentToken ? 1 : 0;
    const bc = b.id === currentId || b.token === currentToken ? 1 : 0;
    return bc - ac || Date.parse(iso(b.updatedAt)) - Date.parse(iso(a.updatedAt));
  });
  const others = list.filter((s) => s.id !== currentId && s.token !== currentToken).length;

  const revoke = async (s: SessionRow) => {
    setBusy(s.id);
    setError(null);
    try {
      await unwrap(authClient.revokeSession({ token: s.token }) as never);
      toast({ id: `session-${s.id}`, tone: "success", title: "Session signed out", description: `${describeDevice(s.userAgent).label} is no longer signed in.` });
      qc.invalidateQueries({ queryKey: ["auth", "sessions"] });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const revokeAll = async () => {
    setBusy("others");
    setError(null);
    try {
      await unwrap(authClient.revokeOtherSessions() as never);
      setRevokeOthers(false);
      toast({ id: "sessions-others", tone: "success", title: "Signed out everywhere else", description: "Only this device is still signed in." });
      qc.invalidateQueries({ queryKey: ["auth", "sessions"] });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card className="h-fit">
      <CardHeader
        title="Active sessions"
        description="Devices signed in to your account. Sign out any you don't recognise."
        action={
          others > 0 && (
            <Button variant="secondary" size="sm" onClick={() => setRevokeOthers(true)}>
              <LogOut className="size-3.5" aria-hidden="true" /> Sign out others
            </Button>
          )
        }
      />
      <CardBody className="pt-2">
        {sessions.isLoading ? (
          <LoadingRegion label="Loading sessions…" className="space-y-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </LoadingRegion>
        ) : sessions.isError ? (
          <QueryError error={sessions.error} onRetry={() => sessions.refetch()} title="Couldn't load sessions" />
        ) : (
          <ul className="divide-y divide-hairline" aria-label="Sessions">
            {list.map((s) => {
              const d = describeDevice(s.userAgent);
              const isCurrent = s.id === currentId || s.token === currentToken;
              const Icon = d.mobile ? Smartphone : Laptop;
              return (
                <li key={s.id} className="flex items-start gap-3 py-3">
                  <Icon className="mt-0.5 size-4 shrink-0 text-text-3" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[13px] font-medium text-text">{d.label}</span>
                      {isCurrent && (
                        <StatusBadge tone="success" icon={null}>
                          This device
                        </StatusBadge>
                      )}
                    </div>
                    <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-text-3">
                      <span>IP {s.ipAddress || "unknown"}</span>
                      <span>
                        Signed in <Timestamp at={iso(s.createdAt)} />
                      </span>
                      <span>
                        Last active <Timestamp at={iso(s.updatedAt)} />
                      </span>
                      <span>Expires {dateLabel(iso(s.expiresAt))}</span>
                    </div>
                  </div>
                  {!isCurrent && (
                    <Button variant="ghost" size="sm" onClick={() => revoke(s)} loading={busy === s.id} loadingLabel="Signing out">
                      Sign out
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {error && (
          <Callout tone="danger" className="mt-3">
            {error}
          </Callout>
        )}
      </CardBody>
      <ConfirmDialog
        open={revokeOthers}
        onOpenChange={setRevokeOthers}
        tone="danger"
        title="Sign out every other session?"
        description={`${others} other session${others === 1 ? "" : "s"} will be signed out immediately.`}
        confirmLabel="Sign out others"
        loading={busy === "others"}
        onConfirm={revokeAll}
        consequences="This device stays signed in. Anyone using those sessions will have to sign in again."
      />
    </Card>
  );
}

function Wallets() {
  const { me } = useOrg();
  const meta = useQuery({ queryKey: ["meta"], queryFn: () => api<MetaDto>("/api/v1/meta"), staleTime: 3_600_000 });
  return (
    <Card>
      <CardHeader title="Wallets" description="Wallets you have signed in with (Sign-In with Ethereum). Signing in never gives TokenIQ control of a wallet." />
      <CardBody className="pt-2">
        {me.wallets.length === 0 ? (
          <p className="text-[13px] text-text-2">No wallets linked to this account.</p>
        ) : (
          <ul className="divide-y divide-hairline">
            {me.wallets.map((w) => {
              const chain = meta.data?.chains.find((c) => c.id === w.chainId);
              return (
                <li key={`${w.chainId}-${w.address}`} className="flex items-center justify-between gap-3 py-2.5">
                  <AddressText address={w.address} explorer={chain ? `${chain.explorer.replace(/\/$/, "")}/address/${w.address}` : null} />
                  <ChainLabel chainId={w.chainId} name={chain?.name ?? `Chain ${w.chainId}`} className="text-xs" />
                </li>
              );
            })}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
