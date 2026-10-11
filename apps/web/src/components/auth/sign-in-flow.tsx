"use client";

import { ArrowLeft, Fingerprint, Mail, Wallet } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Callout } from "@/components/ui/status";
import { api } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { safeNext } from "@/lib/sanitize";

const WalletSignIn = dynamic(() => import("./wallet-sign-in").then((m) => m.WalletSignIn), { ssr: false, loading: () => <p className="text-sm text-text-2">Loading wallet options…</p> });

type Step = "choose" | "code" | "name" | "wallet";

const REASONS: Record<string, string> = {
  session: "Your session expired. Sign in again to continue where you left off.",
  signed_out: "You signed out.",
  invite: "Sign in with the email address the invitation was sent to.",
};

export function SignInFlow({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const reason = params.get("reason");
  const [step, setStep] = useState<Step>("choose");
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    if (step === "code") codeRef.current?.focus();
  }, [step]);

  async function sendCode(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    setBusy(true);
    const res = await authClient.emailOtp.sendVerificationOtp({ email: email.trim(), type: "sign-in" });
    setBusy(false);
    if (res.error) {
      setError(res.error.status === 429 ? "Too many codes requested. Wait a minute and try again." : (res.error.message ?? "We couldn't send a code. Try again."));
      return;
    }
    setStep("code");
    setCooldown(30);
  }

  async function finish() {
    try {
      const me = await api<{ user: { name: string } }>("/api/v1/me");
      if (!me.user.name || me.user.name === email.split("@")[0] || mode === "signup") {
        setName(me.user.name && me.user.name !== email.split("@")[0] ? me.user.name : "");
        setStep("name");
        return;
      }
    } catch {
      /* fall through */
    }
    router.replace(next);
  }

  async function verifyCode(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit code from the email.");
      return;
    }
    setBusy(true);
    const res = await authClient.signIn.emailOtp({ email: email.trim(), otp: code });
    setBusy(false);
    if (res.error) {
      setError(res.error.message?.toLowerCase().includes("attempt") ? "Too many incorrect attempts. Request a new code." : "That code is incorrect or has expired.");
      setCode("");
      return;
    }
    await finish();
  }

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 1) {
      setError("Enter your name so teammates know who approved what.");
      return;
    }
    setBusy(true);
    await api("/api/v1/me", { method: "PATCH", body: { name: name.trim() } }).catch(() => undefined);
    setBusy(false);
    router.replace(next);
  }

  async function passkey() {
    setError(null);
    setBusy(true);
    const res = await authClient.signIn.passkey();
    setBusy(false);
    if (res?.error) {
      setError(res.error.message?.includes("cancel") || res.error.message?.includes("NotAllowed") ? "Passkey sign-in was cancelled." : "No passkey worked for this site. Use email instead, then add a passkey in Settings.");
      return;
    }
    router.replace(next);
  }

  return (
    <div>
      {step === "choose" && (
        <>
          <h1 className="text-2xl font-semibold tracking-[-0.01em]">{mode === "signup" ? "Create your TokenIQ account" : "Sign in to TokenIQ"}</h1>
          <p className="mt-1.5 text-sm text-text-2">{mode === "signup" ? "No passwords. We'll email you a one-time code." : "Use your email, a passkey, or a wallet you've signed in with before."}</p>
          {reason && REASONS[reason] && (
            <Callout tone={reason === "session" ? "warning" : "info"} className="mt-4">
              {REASONS[reason]}
            </Callout>
          )}
          <form onSubmit={sendCode} className="mt-6 space-y-3" noValidate>
            <Field label="Work email" error={error}>
              {(p) => <Input {...p} type="email" inputMode="email" autoComplete="email webauthn" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@organization.xyz" required />}
            </Field>
            <Button type="submit" size="lg" className="w-full justify-center" loading={busy} loadingLabel="Sending code">
              <Mail className="size-4" aria-hidden="true" /> Email me a code
            </Button>
          </form>
          <div className="my-5 flex items-center gap-3 text-xs text-text-3">
            <span className="h-px flex-1 bg-hairline" /> or <span className="h-px flex-1 bg-hairline" />
          </div>
          <div className="grid gap-2">
            <Button variant="secondary" size="lg" className="w-full justify-center" onClick={passkey} disabled={busy}>
              <Fingerprint className="size-4" aria-hidden="true" /> Sign in with a passkey
            </Button>
            <Button variant="secondary" size="lg" className="w-full justify-center" onClick={() => setStep("wallet")} disabled={busy}>
              <Wallet className="size-4" aria-hidden="true" /> Sign in with a wallet
            </Button>
          </div>
          <p className="mt-6 text-center text-[13px] text-text-2">
            {mode === "signup" ? (
              <>
                Already have an account?{" "}
                <Link className="font-medium text-accent hover:underline" href={`/login${next !== "/app" ? `?next=${encodeURIComponent(next)}` : ""}`}>
                  Sign in
                </Link>
              </>
            ) : (
              <>
                New to TokenIQ?{" "}
                <Link className="font-medium text-accent hover:underline" href="/signup">
                  Create an account
                </Link>
              </>
            )}
          </p>
          <p className="mt-3 text-center text-xs text-text-3">TokenIQ never asks for private keys or seed phrases.</p>
        </>
      )}

      {step === "code" && (
        <form onSubmit={verifyCode} noValidate>
          <button type="button" onClick={() => setStep("choose")} className="mb-4 inline-flex items-center gap-1 text-[13px] text-text-2 hover:text-text">
            <ArrowLeft className="size-3.5" aria-hidden="true" /> Use a different email
          </button>
          <h1 className="text-2xl font-semibold tracking-[-0.01em]">Check your email</h1>
          <p className="mt-1.5 text-sm text-text-2">
            We sent a 6-digit code to <span className="font-medium text-text">{email}</span>. It expires in 10 minutes.
          </p>
          <div className="mt-6">
            <Field label="Verification code" error={error}>
              {(p) => (
                <Input
                  {...p}
                  ref={codeRef}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="\d{6}"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="num h-12 text-center text-xl tracking-[0.5em]"
                  placeholder="000000"
                />
              )}
            </Field>
          </div>
          <Button type="submit" size="lg" className="mt-4 w-full justify-center" loading={busy} loadingLabel="Verifying">
            Verify and continue
          </Button>
          <p className="mt-4 text-center text-[13px] text-text-2">
            Didn't get it? Check spam, or{" "}
            <button type="button" onClick={() => sendCode()} disabled={cooldown > 0 || busy} className="font-medium text-accent hover:underline disabled:text-text-3 disabled:no-underline">
              {cooldown > 0 ? `resend in ${cooldown}s` : "send a new code"}
            </button>
          </p>
        </form>
      )}

      {step === "name" && (
        <form onSubmit={saveName} noValidate>
          <h1 className="text-2xl font-semibold tracking-[-0.01em]">What should teammates call you?</h1>
          <p className="mt-1.5 text-sm text-text-2">Your name appears on approvals, comments and the audit trail.</p>
          <div className="mt-6">
            <Field label="Full name" error={error}>
              {(p) => <Input {...p} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ada Lovelace" autoFocus />}
            </Field>
          </div>
          <Button type="submit" size="lg" className="mt-4 w-full justify-center" loading={busy}>
            Continue
          </Button>
        </form>
      )}

      {step === "wallet" && (
        <div>
          <button type="button" onClick={() => setStep("choose")} className="mb-4 inline-flex items-center gap-1 text-[13px] text-text-2 hover:text-text">
            <ArrowLeft className="size-3.5" aria-hidden="true" /> Other sign-in options
          </button>
          <h1 className="text-2xl font-semibold tracking-[-0.01em]">Sign in with a wallet</h1>
          <p className="mt-1.5 text-sm text-text-2">You'll sign a message (Sign-In with Ethereum). It costs nothing and moves no funds. Signing in with a wallet does not give TokenIQ access to it.</p>
          <div className="mt-6">
            <WalletSignIn onSignedIn={() => router.replace(next)} />
          </div>
        </div>
      )}
    </div>
  );
}
