"use client";

import { Check, Copy, ExternalLink } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { relativeTime, shortAddress } from "@/lib/format";
import { Tooltip } from "./tooltip";

/**
 * "0x1234abcd…" split into 4-character groups after the 0x prefix. The gaps are
 * margins, not spaces, so selecting and copying yields the exact value.
 */
function GroupedHex({ value }: { value: string }) {
  const body = value.startsWith("0x") ? value.slice(2) : value;
  const groups = body.match(/.{1,4}/g) ?? [];
  return (
    <span className="select-all break-all">
      {value.startsWith("0x") && <span className="mr-[0.3em]">0x</span>}
      {groups.map((g, i) => (
        <span key={i} className="mr-[0.3em] inline-block last:mr-0">
          {g}
        </span>
      ))}
    </span>
  );
}

/**
 * An address or hash. Truncated by default; `full` shows the whole value as
 * wrapping, selectable text, grouped in 4-character blocks so it can be compared
 * with a wallet or hardware device (never only in a tooltip).
 */
export function AddressText({ address, explorer, full = false, kind = "address", className }: { address: string; explorer?: string | null; full?: boolean; kind?: "address" | "hash"; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-1 font-mono text-[12.5px] text-text-2", full && "items-start", className)}>
      {full ? (
        <GroupedHex value={address} />
      ) : (
        <span className="truncate" title={address}>
          {shortAddress(address)}
        </span>
      )}
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(address);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          } catch {
            /* clipboard blocked: the full value is still selectable when shown */
          }
        }}
        // 24px target (WCAG 2.5.8) without changing the line height.
        className="-my-1 inline-flex size-6 shrink-0 items-center justify-center rounded text-text-3 hover:text-text"
        aria-label={copied ? "Copied" : `Copy ${kind} ${address}`}
      >
        {copied ? <Check className="size-3.5 text-success" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
      </button>
      {explorer && (
        <a href={explorer} target="_blank" rel="noreferrer noopener" className="-my-1 inline-flex size-6 shrink-0 items-center justify-center rounded text-text-3 hover:text-text" aria-label="Open in block explorer">
          <ExternalLink className="size-3.5" aria-hidden="true" />
        </a>
      )}
    </span>
  );
}

const CHAIN_DOT: Record<number, string> = { 1: "#627EEA", 8453: "#0052FF", 42161: "#28A0F0", 10: "#FF0420", 84532: "#0052FF", 11155111: "#627EEA" };

export function ChainLabel({ chainId, name, className }: { chainId: number; name: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-text-2", className)}>
      <span aria-hidden="true" className="size-2 rounded-full ring-2 ring-surface" style={{ background: CHAIN_DOT[chainId] ?? "var(--text-3)" }} />
      {name}
    </span>
  );
}

/** "Synced 2 min ago" with an explicit stale state; never shows old data as current. */
export function Freshness({ at, staleAfterMinutes = 60, label = "Synced", className }: { at: string | null | undefined; staleAfterMinutes?: number; label?: string; className?: string }) {
  const stale = !at || Date.now() - Date.parse(at) > staleAfterMinutes * 60_000;
  return (
    <Tooltip content={at ? new Date(at).toUTCString() : "No data yet"}>
      <span className={cn("inline-flex items-center gap-1.5 text-xs", stale ? "text-warning" : "text-text-3", className)} tabIndex={0}>
        <span aria-hidden="true" className={cn("size-1.5 rounded-full", stale ? "bg-warning" : "bg-success")} />
        {at ? `${label} ${relativeTime(at)}` : "Not synced yet"}
        {stale && at && <span className="font-medium">· Stale</span>}
      </span>
    </Tooltip>
  );
}
