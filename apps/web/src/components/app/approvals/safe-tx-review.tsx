"use client";

import { OctagonAlert, ShieldCheck } from "lucide-react";
import { maxUint256 } from "viem";
import { AddressText } from "@/components/ui/identity";
import { Callout } from "@/components/ui/status";
import { tokenAmount } from "@/lib/format";
import type { MetaTokenDto, ProposalDetail } from "@/lib/types";
import type { DecodedCall, SafeTxCheck, SafeTxReview } from "./safe-tx";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
      <dt className="text-text-2">{label}</dt>
      <dd className="min-w-0 text-right text-text">{children}</dd>
    </div>
  );
}

function Hash({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-text-2">{label}</dt>
      <dd className="mt-0.5">
        <AddressText address={value} full kind="hash" className="text-[12px] text-text" />
      </dd>
    </div>
  );
}

/** The token whose units an amount argument is in, when it can be identified. */
function amountToken(call: DecodedCall, review: SafeTxReview, p: ProposalDetail, tokens: MetaTokenDto[]): MetaTokenDto | null {
  const onChain = tokens.filter((t) => t.chainId === review.chainId);
  const byAddress = (a: string | undefined) => (a ? (onChain.find((t) => t.address.toLowerCase() === a.toLowerCase()) ?? null) : null);
  const bySymbol = () => (p.action.assetSymbol ? (onChain.find((t) => t.symbol === p.action.assetSymbol) ?? null) : null);
  switch (call.fn) {
    case "approve":
    case "transfer":
      return byAddress(call.to);
    case "supply":
    case "aaveWithdraw":
      return byAddress(call.args.find((a) => a.name === "asset")?.value);
    case "deposit":
      return byAddress(review.calls.find((c) => c.fn === "approve")?.to) ?? bySymbol();
    case "withdraw":
      return bySymbol();
    default:
      return null;
  }
}

function addressNote(a: string, review: SafeTxReview, tokens: MetaTokenDto[]): string | null {
  if (a.toLowerCase() === review.safe.toLowerCase()) return "this Safe";
  const t = tokens.find((x) => x.chainId === review.chainId && x.address.toLowerCase() === a.toLowerCase());
  if (t) return `${t.symbol} token`;
  const step = review.calls.find((c) => c.to.toLowerCase() === a.toLowerCase());
  return step ? `the contract called in step ${step.index + 1}` : null;
}

function CallDetail({ call, review, p, tokens }: { call: DecodedCall; review: SafeTxReview; p: ProposalDetail; tokens: MetaTokenDto[] }) {
  const unit = amountToken(call, review, p, tokens);
  const target = addressNote(call.to, review, tokens);
  return (
    <li className="space-y-1">
      <div className="text-text">{call.description || "Call"}</div>
      <div className="font-mono text-[12px] text-text-2">{call.signature ?? `Unknown function ${call.data.slice(0, 10)}`}</div>
      <dl className="space-y-1 text-[12.5px]">
        <Row label="Contract">
          <AddressText address={call.to} full className="text-[12px]" />
          {target && <span className="block text-xs text-text-3">{target}</span>}
        </Row>
        {call.args
          .filter((a) => a.name !== "referralCode")
          .map((a) => (
            <Row key={a.name} label={a.name}>
              {a.kind === "address" ? (
                <>
                  <AddressText address={a.value} full className="text-[12px]" />
                  {addressNote(a.value, review, tokens) && <span className="block text-xs text-text-3">{addressNote(a.value, review, tokens)}</span>}
                </>
              ) : a.kind === "amount" && a.value === maxUint256.toString() ? (
                <span>Entire balance (uint256 max)</span>
              ) : a.kind === "amount" && unit ? (
                <span className="num">
                  {tokenAmount(a.value, unit.decimals, unit.decimals)} {unit.symbol}
                  <span className="block font-mono text-xs text-text-3">{a.value} base units</span>
                </span>
              ) : (
                <span className="num font-mono text-[12px]">{a.value}{a.kind === "amount" ? " base units" : ""}</span>
              )}
            </Row>
          ))}
      </dl>
    </li>
  );
}

/**
 * Everything an owner needs to compare with their wallet or hardware device before
 * signing: network, Safe, nonce, operation, refund fields, the three hashes and each
 * decoded call. Values come from the typed data that will be signed.
 */
export function SafeTxReviewPanel({ p, check, chainName, tokens }: { p: ProposalDetail; check: SafeTxCheck; chainName: string | null; tokens: MetaTokenDto[] }) {
  const r = check.review;
  return (
    <section aria-labelledby="safe-tx-review" className="rounded-[var(--radius-card)] bg-sunken p-3 text-[13px]">
      <h4 id="safe-tx-review" className="text-xs font-medium text-text-2">
        Compare these with your wallet before signing
      </h4>
      {check.problems.length > 0 ? (
        <Callout tone="danger" className="mt-2" title="TokenIQ will not ask a wallet to sign or submit this transaction">
          <p>The prepared transaction failed checks this page runs independently of the server:</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5">
            {check.problems.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
          <p className="mt-1">Do not sign it elsewhere. Cancel the proposal and report this to your TokenIQ administrator.</p>
        </Callout>
      ) : (
        <p className="mt-1 flex items-start gap-1.5 text-xs text-success">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          Checked in this browser: the typed data hashes to the safeTxHash below and encodes exactly the calls listed.
        </p>
      )}
      {r && (
        <>
          <dl className="mt-3 space-y-1">
            <Row label="Network">
              {chainName ?? "Unknown network"} <span className="text-text-3">· chain ID {r.chainId}</span>
            </Row>
            <Row label="Safe (verifying contract)">
              <AddressText address={r.safe} full className="text-[12px]" />
            </Row>
            <Row label="Safe version">{r.safeVersion}</Row>
            <Row label="Nonce">
              <span className="num font-mono text-[12.5px]">{r.message.nonce.toString()}</span>
            </Row>
            <Row label="Operation">
              {r.message.operation === 1 ? (
                <span>
                  Delegate call (1) to MultiSendCallOnly, batching {r.calls.length} calls
                </span>
              ) : (
                <span>Call (0)</span>
              )}
            </Row>
            <Row label="To">
              <AddressText address={r.message.to} full className="text-[12px]" />
            </Row>
            <Row label="ETH value">
              <span className="num">{r.message.value.toString()}</span>
            </Row>
            <Row label="Gas refund">None (safeTxGas, baseGas, gasPrice 0; no gas token or refund receiver)</Row>
          </dl>
          <dl className="mt-3 space-y-2 border-t border-hairline pt-3">
            <Hash label="safeTxHash" value={r.safeTxHash} />
            <Hash label="Domain hash" value={r.domainHash} />
            <Hash label="Message hash" value={r.messageHash} />
          </dl>
          <p className="mt-1.5 text-xs text-text-3">Hardware wallets that cannot decode the transaction show the domain and message hashes; they must match exactly.</p>
          <h5 className="mt-3 border-t border-hairline pt-3 text-xs font-medium text-text-2">What the Safe will do</h5>
          <ol className="mt-1.5 list-decimal space-y-3 pl-5">
            {r.calls.map((c) => (
              <CallDetail key={c.index} call={c} review={r} p={p} tokens={tokens} />
            ))}
          </ol>
        </>
      )}
      {!r && check.problems.length === 0 && (
        <p className="mt-2 flex items-center gap-1.5 text-text-2">
          <OctagonAlert className="size-3.5" aria-hidden="true" /> The transaction details are unavailable.
        </p>
      )}
    </section>
  );
}
