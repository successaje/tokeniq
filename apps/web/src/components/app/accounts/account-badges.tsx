import { CircleDashed, FlaskConical, ShieldAlert, ShieldCheck } from "lucide-react";
import { StatusBadge } from "@/components/ui/status";
import { cn } from "@/lib/cn";
import { dateLabel, shortAddress } from "@/lib/format";
import type { TreasuryAccountDto } from "@/lib/types";

/**
 * Verified (with who signed and when), unverified (and what that means for the
 * maths), or sample. Text carries the meaning; colour is the third cue.
 */
export function VerificationStatus({ account, compact = false, className }: { account: TreasuryAccountDto; compact?: boolean; className?: string }) {
  if (account.verificationMethod === "sample") {
    return (
      <span className={cn("inline-flex flex-col items-start gap-0.5", className)}>
        <StatusBadge tone="neutral" icon={FlaskConical}>
          Sample
        </StatusBadge>
        {!compact && <span className="text-xs text-text-3">Simulated, cannot be verified</span>}
      </span>
    );
  }
  if (account.verified) {
    return (
      <span className={cn("inline-flex flex-col items-start gap-0.5", className)}>
        <StatusBadge tone="success" icon={ShieldCheck}>
          Verified
        </StatusBadge>
        {!compact && (
          <span className="text-xs text-text-3">
            {account.verificationSigner ? (
              <>
                by <span className="font-mono">{shortAddress(account.verificationSigner)}</span>
              </>
            ) : (
              "Control proven"
            )}
            {account.verifiedAt && ` on ${dateLabel(account.verifiedAt)}`}
          </span>
        )}
      </span>
    );
  }
  return (
    <span className={cn("inline-flex flex-col items-start gap-0.5", className)}>
      <StatusBadge tone="warning" icon={ShieldAlert}>
        Unverified
      </StatusBadge>
      {!compact && <span className="text-xs text-text-3">Excluded from reserve maths</span>}
    </span>
  );
}

export function IncludedLabel({ included }: { included: boolean }) {
  return included ? (
    <span className="text-xs text-text-2">Counted in treasury</span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs text-text-3">
      <CircleDashed className="size-3" aria-hidden="true" /> Not counted
    </span>
  );
}
